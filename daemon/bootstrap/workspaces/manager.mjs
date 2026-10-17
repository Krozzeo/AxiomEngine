import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {readdir,rm,lstat,rmdir} from 'node:fs/promises';
import {SceneWorkspace} from '../scene-workspace.mjs';
import {ProjectStore} from '../project-store.mjs';
import {AssetStore} from '../asset-store.mjs';
import {AssetPipeline} from '../asset-pipeline.mjs';
import {validateProject} from '../../../protocol/src/project-document.mjs';
import {page} from '../agent/contracts.mjs';
import {folder,readJson,writeJson,promote,fail,destinationFolder} from './files.mjs';
import {changes,digest} from './diff.mjs';
const pattern=/^workspace:\/\/([0-9a-f-]{36})$/;
const editable=new Set(['scene.document.edit','scene.example.create','project.editor.update','scene.script.edit','scene.component.paste','project.files.edit','scene.entities.paste','scene.camera.set','scene.audioSource.set','scene.audioListener.set','scene.audio.update','asset.audio.read','scene.animator.set','scene.sprite2D.set','scene.spriteAnimation.set','scene.tilemap.set','scene.light2D.set','scene.particles2D.set','scene.ui2D.set','scene.twoD.update','scene.entities.update','scene.entities.delete','scene.entity.reparent','scene.primitive.create','scene.material.set','scene.light.set','scene.lod.set','scene.rendering.update','scene.collider.set','scene.rigidBody.set','scene.entity.create','scene.entity.update','scene.entity.delete','scene.component.add','scene.component.remove','scene.asset.place','scene.camera.update','scene.undo','scene.redo','asset.import','asset.job.start','asset.job.get','asset.job.cancel','asset.explain','asset.get','script.compile','script.job.get','script.job.cancel','play.start','play.stop','scene.get']);
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}
export class ProposalManager {
 constructor(main){this.main=main;this.items=new Map();this.previewId=null;this.viewRevision=0;this.lastView=null;}
 async initialize(){this.root=join(await this.main.store.directory(),'.proposals');try{await lstat(this.root);}catch(error){if(error.code==='ENOENT')return;throw error;}await folder(this.root);for(const name of await readdir(this.root)){if(!/^[0-9a-f-]{36}$/.test(name))continue;const root=await folder(join(this.root,name));const saved=await readJson(join(root,'proposal.json'));if(saved.id!=='workspace://'+name)throw fail('Proposal identity mismatch');if(this.items.size>=8)throw fail('Too many retained proposals');validateProject(saved.base);validateProject(saved.project);if(saved.project.id!==saved.base.id||saved.project.scene.id!==saved.base.scene.id||!Number.isSafeInteger(saved.baseSceneRevision)||typeof saved.name!=='string'||saved.name.length>128)throw fail('Invalid proposal base identity');if(!Number.isSafeInteger(saved.revision)||saved.revision<1||!Array.isArray(saved.log)||saved.log.length>128)throw fail('Invalid proposal journal');const restored=await this.restore(saved,root);restored.recovered=true;}try{const view=await readJson(join(this.root,'view.json'));const item=this.items.get(view.previewId);if(item){const saved=await this.main.store.run('project.open',{id:item.base.id});this.main.activate(saved.project);this.previewId=item.id;}}catch(error){if(error.code!=='ENOENT')throw error;}}
 async restore(saved,root){const child=new SceneWorkspace(new ProjectStore(root));child.activate(saved.project);child.revision=saved.revision;child.pendingEditor=!!saved.pendingEditor;child.playing=false;child.savedScene=JSON.stringify(saved.base.scene);const base=freeze(structuredClone(saved.base));if(digest(child.project.scene)===digest(base.scene))child.project.scene=base.scene;
  const baseIds=new Set((base.scene.assets??[]).map(a=>a.sourceId??a.id)),baseAssets=this.main.assets;
  class OverlayAssets extends AssetStore{async readBytes(projectId,assetId){try{return await super.readBytes(projectId,assetId);}catch(e){if(e.code!=='ENOENT'||!baseIds.has(assetId))throw e;return baseAssets.readBytes(projectId,assetId);}}}
  child.assets=new OverlayAssets(child.store);child.pipeline=new AssetPipeline(child.assets);
  const read=child.compiler.read.bind(child.compiler);child.compiler.read=(id,build,name)=>base.scene.script?.build.id===build.id?this.main.compiler.read(id,build,name):read(id,build,name);
  const item={...saved,base,root,child,revision:child.revision,log:saved.log??[],journalFlight:Promise.resolve()};this.items.set(item.id,item);
  const finish=(job,context)=>{this.log(item,'job.finished',context,job.status);item.journalFlight=this.persist(item).catch(error=>{item.failure=error.message;});};child.onAssetEvent=finish;child.onScriptEvent=finish;return item;
 }
 get(id){if(!pattern.test(id??''))throw fail('Expected workspace identity');const item=this.items.get(id);if(!item)throw fail('Proposal is unavailable');return item;}
 check(item,data){if(data.expectedWorkspaceRevision!==item.child.revision)throw fail('Proposal changed; inspect its current revision');}
 busy(item){return !!(item.child.activeJob||item.child.activeScriptJob);}
 summary(item){return {id:item.id,name:item.name,projectId:item.base.id,baseSceneRevision:item.baseSceneRevision,revision:item.child.revision,dirty:item.child.dirty,playing:item.child.playing,preview:this.previewId===item.id,busy:this.busy(item),failure:item.failure??null,actionCount:item.log.length};}
 list(){return [...this.items.values()].map(i=>this.summary(i));}
 log(item,type,context={},status='completed'){item.log.push({sequence:(item.log.at(-1)?.sequence??0)+1,type,status,traceId:context?.traceId??null,actor:context?.actor??null,revision:item.child.revision,time:new Date().toISOString()});if(item.log.length>128)item.log.shift();}
 persist(item){const pending=item.journalFlight.then(()=>writeJson(join(item.root,'proposal.json'),{id:item.id,name:item.name,base:item.base,baseSceneRevision:item.baseSceneRevision,project:item.child.project,revision:item.child.revision,log:item.log,pendingEditor:!!item.child.pendingEditor}));item.journalFlight=pending.catch(error=>{item.failure=error.message;throw error;});return item.journalFlight;}
 get active(){return this.previewId?this.get(this.previewId).child:this.main;}
 view(){return {...this.active.snapshot(),workspaceId:this.previewId};}

 async execute(type,data,context){const item=this.get(data.workspaceId);if(!editable.has(type))throw fail('Operation is not available inside a proposal');if(item.failure)throw fail('Proposal journal failed; reject this proposal');let result;try{if(type==='project.editor.update'){item.child.check(data);validateProject({...item.child.project,editor:data.value});if(digest(item.child.project.editor??null)===digest(data.value))return {...item.child.snapshot(),workspaceId:item.id};if(Buffer.byteLength(JSON.stringify({...item.child.project,editor:data.value},null,2)+'\n')>192*1024)throw fail('Project size exceeds limit');item.child.project.editor=structuredClone(data.value);item.child.pendingEditor=true;item.child.revision++;result=item.child.snapshot();}else result=await item.child.run(type,data,context);}catch(error){this.log(item,type,context,'failed');item.log.at(-1).error={code:error.code??'AX_WORKSPACE_0001',message:error.message.slice(0,1024)};await this.persist(item);throw error;}if(type==='asset.audio.read')return result;if(type==='play.start')this.previewId=item.id;this.log(item,type,context);await this.persist(item);return result&&Object.hasOwn(result,'project')?{...result,workspaceId:item.id}:result;}
 async run(type,data,context){
  if(type==='workspace.list')return {items:this.list()};
  if(type==='workspace.begin'){
   this.main.check(data);if(this.main.playing||this.main.dirty||this.main.activeJob||this.main.activeScriptJob)throw fail('Save and stop the source project and finish its jobs before proposing');if(this.items.size>=8)throw fail('Maximum eight proposals');
   const id='workspace://'+randomUUID(),root=await folder(join(this.root,id.slice(12)));const saved={id,name:data.name??'AI proposal',base:structuredClone(this.main.project),baseSceneRevision:this.main.revision,project:structuredClone(this.main.project),revision:1,log:[]};const item=await this.restore(saved,root);this.log(item,type,context);await this.persist(item);return this.summary(item);
  }
  const item=this.get(data.workspaceId);
  if(type==='workspace.diff')return page(changes(item.base.scene,item.child.project.scene),data,{workspace:this.summary(item),reviewHash:digest([item.base.scene,item.child.project.scene,item.child.revision])});
  if(type==='workspace.log')return page(item.log,data,{workspaceId:item.id,oldestSequence:item.log[0]?.sequence??0,truncated:(item.log[0]?.sequence??0)>1});
  this.check(item,data);if(item.failure&&type!=='workspace.reject')throw fail('Proposal journal failed; reject this proposal');if(this.busy(item))throw fail('Finish or cancel proposal jobs first');await (type==='workspace.reject'?item.journalFlight.catch(()=>{}):item.journalFlight);
  if(type==='workspace.preview'){if(this.main.playing)throw fail('Stop source Play before preview');await item.child.validateResources(item.child.project.scene);this.previewId=item.id;await this.persistView();item.child.playing=data.playing!==false;item.child.revision++;await this.persist(item);return this.summary(item);}
  if(type==='workspace.continue'){if(item.recovered&&!this.main.dirty&&digest(this.main.project)===digest(item.base)){item.baseSceneRevision=this.main.revision;item.recovered=false;}if(this.previewId===item.id){this.previewId=null;await this.persistView();}item.child.playing=false;item.child.revision++;await this.persist(item);return this.summary(item);}
  if(type==='workspace.reject'){if(this.previewId===item.id){this.previewId=null;await this.persistView();}await rm(item.root,{recursive:true,force:true});this.items.delete(item.id);return {id:item.id,status:'rejected'};}
  if(type==='workspace.accept'){
   if(context?.actor?.kind!=='human')throw fail('Only human review can accept a proposal');
   if(data.reviewHash!==digest([item.base.scene,item.child.project.scene,item.child.revision]))throw fail('Review is stale; inspect this proposal again');
   if(this.main.project?.id!==item.base.id||this.main.revision!==item.baseSceneRevision||this.main.playing||this.main.activeJob||this.main.activeScriptJob)throw fail('Source changed; proposal cannot overwrite concurrent edits');
   const persisted=await this.main.store.run('project.open',{id:item.base.id});if(persisted.project.revision!==item.base.revision)throw fail('Saved project changed in another daemon');
   validateProject(item.child.project);await item.child.validateResources(item.child.project.scene);
   const created=[],directories=[];try{
    const root=await this.main.store.directory(),stem=this.main.store.filename(item.base.id).replace(/\.json$/,''),childStem=item.child.store.filename(item.base.id).replace(/\.json$/,'');
    const assets=join(item.root,childStem+'.assets');
    try{await lstat(assets);await promote(assets,join(root,stem+'.assets'),created,undefined,(item.child.project.scene.assets??[]).map(a=>(a.sourceId??a.id).slice(8)+'.bin'),directories);}catch(e){if(e.code!=='ENOENT')throw e;}
    const build=item.child.project.scene.script?.build;
    if(build&&build.id!==item.base.scene.script?.build.id){await destinationFolder(join(root,stem+'.scripts'),directories);await promote(join(item.root,childStem+'.scripts',build.id),join(root,stem+'.scripts',build.id),created,undefined,['manifest.json','publish'],directories);}

    if(this.items.get(item.id)!==item||item.child.revision!==data.expectedWorkspaceRevision||this.main.project?.id!==item.base.id||this.main.revision!==item.baseSceneRevision||this.main.playing||this.main.activeJob||this.main.activeScriptJob)throw fail('Source or proposal changed during publication');
    this.main.commitScene(structuredClone(item.child.project.scene));
   }catch(error){await Promise.all(created.map(p=>rm(p,{force:true})));for(const path of directories.reverse())await rmdir(path).catch(()=>{});throw error;}
   if(this.previewId===item.id){this.previewId=null;await this.persistView();}this.items.delete(item.id);await rm(item.root,{recursive:true,force:true});return {id:item.id,status:'accepted',sceneRevision:this.main.revision,dirty:this.main.dirty};
  }
  throw fail('Unknown proposal command');
 }
 review(id){const item=this.get(id);return {workspace:this.summary(item),reviewHash:digest([item.child.project,item.child.revision]),mainRevision:this.main.revision,mainHash:digest(this.main.project),mainDiverged:digest(this.main.project)!==digest(item.base),changes:changes({scene:item.base.scene,editor:item.base.editor},{scene:item.child.project.scene,editor:item.child.project.editor})};}
 async apply(data,context){
  if(context?.actor?.kind!=='human')throw fail('Only human review can apply a proposal');
  const item=this.get(data.workspaceId);this.check(item,data);
  if(item.failure||this.busy(item)||item.child.playing||this.main.playing||this.main.activeJob||this.main.activeScriptJob)throw fail('Stop Play and finish all jobs before applying');
  if(this.main.project?.id!==item.base.id||data.expectedMainRevision!==this.main.revision||data.mainHash!==digest(this.main.project)||data.reviewHash!==digest([item.child.project,item.child.revision]))throw fail('Review changed; review the current branches again');
  if(digest(this.main.project)!==digest(item.base)&&data.replaceMain!==true)throw fail('MAIN changed since the proposal began. Apply replaces all later MAIN changes; explicit replacement confirmation is required');
  await item.journalFlight;validateProject(item.child.project);await item.child.validateResources(item.child.project.scene);
  const persisted=await this.main.store.run('project.open',{id:item.base.id});if(persisted.project.revision!==this.main.project.revision)throw fail('Saved MAIN changed in another daemon');
  const root=await this.main.store.directory(),stem=this.main.store.filename(item.base.id).replace(/\.json$/,''),childStem=item.child.store.filename(item.base.id).replace(/\.json$/,''),recoveryId=randomUUID(),recoveryRoot=await folder(join(root,'.recoveries'));
  // Snapshot is durable before publishing. Existing MAIN resource bytes are retained.
  await writeJson(join(recoveryRoot,recoveryId+'.json'),{id:recoveryId,project:structuredClone(this.main.project),time:new Date().toISOString()});
  const created=[],directories=[];
  try{
   const assets=join(item.root,childStem+'.assets');try{await lstat(assets);await promote(assets,join(root,stem+'.assets'),created,undefined,(item.child.project.scene.assets??[]).map(a=>(a.sourceId??a.id).slice(8)+'.bin'),directories);}catch(e){if(e.code!=='ENOENT')throw e;}
   const build=item.child.project.scene.script?.build;if(build&&build.id!==item.base.scene.script?.build.id){await destinationFolder(join(root,stem+'.scripts'),directories);await promote(join(item.root,childStem+'.scripts',build.id),join(root,stem+'.scripts',build.id),created,undefined,['manifest.json','publish'],directories);}
   if(this.main.revision!==data.expectedMainRevision||digest(this.main.project)!==data.mainHash||item.child.revision!==data.expectedWorkspaceRevision||this.busy(item)||this.main.activeJob||this.main.activeScriptJob)throw fail('Branches changed during publication');
   const next=structuredClone(item.child.project);next.revision=this.main.project.revision;
   // Commit the durable project before publishing the accepted branch in memory.
   // A failed save leaves MAIN and the editable proposal intact, and rolls back
   // newly promoted resources through the same failure path as publication.
   const saved=await this.main.store.run('project.save',{id:next.id,expectedRevision:next.revision,scene:next.scene,editor:next.editor});
   this.main.past.push(structuredClone(this.main.project.scene));this.main.future=[];this.main.project=saved.project;this.main.savedScene=JSON.stringify(saved.project.scene);this.main.pendingEditor=false;this.main.revision++;
  }catch(error){await Promise.all(created.map(p=>rm(p,{force:true})));for(const path of directories.reverse())await rmdir(path).catch(()=>{});throw error;}
  if(this.previewId===item.id){this.previewId=null;await this.persistView();}this.items.delete(item.id);await rm(item.root,{recursive:true,force:true});
  return {status:'applied',recoveryId,snapshot:this.view()};
 }
 async persistView(){await writeJson(join(this.root,'view.json'),{previewId:this.previewId});}
 async recoveries(){const root=join(await this.main.store.directory(),'.recoveries');let names;try{await folder(root);names=await readdir(root);}catch(error){if(error.code==='ENOENT')return [];throw error;}const items=[];for(const name of names){if(!/^[0-9a-f-]{36}\.json$/.test(name))continue;const saved=await readJson(join(root,name));if(saved.project?.id===this.main.project?.id)items.push({id:saved.id,time:saved.time});}return items.sort((a,b)=>a.time.localeCompare(b.time)).slice(-8);}
 async recover(data,context){
  if(context?.actor?.kind!=='human')throw fail('Only humans can restore MAIN');
  if(!/^[0-9a-f-]{36}$/.test(data.recoveryId??''))throw fail('Invalid recovery identity');
  if(this.previewId||this.main.playing||this.main.activeJob||this.main.activeScriptJob||data.expectedMainRevision!==this.main.revision)throw fail('Return to MAIN, stop Play and review the current revision before recovery');
  const saved=await readJson(join(await this.main.store.directory(),'.recoveries',data.recoveryId+'.json'));validateProject(saved.project);
  if(saved.project.id!==this.main.project?.id)throw fail('Recovery belongs to another project');
  await this.main.validateResources(saved.project.scene);const revision=this.main.project.revision;this.main.project=structuredClone(saved.project);this.main.project.revision=revision;this.main.pendingEditor=true;this.main.revision++;this.main.past=[];this.main.future=[];return {snapshot:this.view(),status:'recovered'};
 }
 async close(){for(const i of this.items.values()){i.child.activeJob?.controller.abort();i.child.activeScriptJob?.controller.abort();}for(const i of this.items.values()){const deadline=Date.now()+10000;while(this.busy(i)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));await i.journalFlight;}}
}
