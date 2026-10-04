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
const editable=new Set(['scene.sprite2D.set','scene.spriteAnimation.set','scene.tilemap.set','scene.light2D.set','scene.particles2D.set','scene.ui2D.set','scene.twoD.update','scene.entities.update','scene.entities.delete','scene.entity.reparent','scene.primitive.create','scene.material.set','scene.light.set','scene.lod.set','scene.rendering.update','scene.collider.set','scene.rigidBody.set','scene.entity.create','scene.entity.update','scene.entity.delete','scene.component.add','scene.component.remove','scene.asset.place','scene.camera.update','scene.undo','scene.redo','asset.import','asset.job.start','asset.job.get','asset.job.cancel','asset.explain','asset.get','script.compile','script.job.get','script.job.cancel','play.start','play.stop','scene.get']);
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}
export class ProposalManager {
 constructor(main){this.main=main;this.items=new Map();this.previewId=null;this.viewRevision=0;this.lastView=null;}
 async initialize(){this.root=join(await this.main.store.directory(),'.proposals');try{await lstat(this.root);}catch(error){if(error.code==='ENOENT')return;throw error;}await folder(this.root);for(const name of await readdir(this.root)){if(!/^[0-9a-f-]{36}$/.test(name))continue;const root=await folder(join(this.root,name));const saved=await readJson(join(root,'proposal.json'));if(saved.id!=='workspace://'+name)throw fail('Proposal identity mismatch');if(this.items.size>=8)throw fail('Too many retained proposals');validateProject(saved.base);validateProject(saved.project);if(saved.project.id!==saved.base.id||saved.project.scene.id!==saved.base.scene.id||!Number.isSafeInteger(saved.baseSceneRevision)||typeof saved.name!=='string'||saved.name.length>128)throw fail('Invalid proposal base identity');if(!Number.isSafeInteger(saved.revision)||saved.revision<1||!Array.isArray(saved.log)||saved.log.length>128)throw fail('Invalid proposal journal');const restored=await this.restore(saved,root);restored.recovered=true;}}
 async restore(saved,root){const child=new SceneWorkspace(new ProjectStore(root));child.activate(saved.project);child.revision=saved.revision;child.playing=false;child.savedScene=JSON.stringify(saved.base.scene);const base=freeze(structuredClone(saved.base));if(digest(child.project.scene)===digest(base.scene))child.project.scene=base.scene;
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
 persist(item){const pending=item.journalFlight.then(()=>writeJson(join(item.root,'proposal.json'),{id:item.id,name:item.name,base:item.base,baseSceneRevision:item.baseSceneRevision,project:item.child.project,revision:item.child.revision,log:item.log}));item.journalFlight=pending.catch(error=>{item.failure=error.message;throw error;});return item.journalFlight;}
 get active(){return this.previewId?this.get(this.previewId).child:this.main;}
 view(){return {...this.active.snapshot(),workspaceId:this.previewId};}

 async execute(type,data,context){const item=this.get(data.workspaceId);if(!editable.has(type))throw fail('Operation is not available inside a proposal');if(item.failure)throw fail('Proposal journal failed; reject this proposal');let result;try{result=await item.child.run(type,data,context);}catch(error){this.log(item,type,context,'failed');item.log.at(-1).error={code:error.code??'AX_WORKSPACE_0001',message:error.message.slice(0,1024)};await this.persist(item);throw error;}if(type==='play.start')this.previewId=item.id;this.log(item,type,context);await this.persist(item);return result&&Object.hasOwn(result,'project')?{...result,workspaceId:item.id}:result;}
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
  if(type==='workspace.preview'){if(this.main.playing)throw fail('Stop source Play before preview');await item.child.validateResources(item.child.project.scene);this.previewId=item.id;item.child.playing=true;item.child.revision++;await this.persist(item);return this.summary(item);}
  if(type==='workspace.continue'){if(item.recovered&&!this.main.dirty&&digest(this.main.project)===digest(item.base)){item.baseSceneRevision=this.main.revision;item.recovered=false;}if(this.previewId===item.id)this.previewId=null;item.child.playing=false;item.child.revision++;await this.persist(item);return this.summary(item);}
  if(type==='workspace.reject'){if(this.previewId===item.id)this.previewId=null;await rm(item.root,{recursive:true,force:true});this.items.delete(item.id);return {id:item.id,status:'rejected'};}
  if(type==='workspace.accept'){
   if(context?.actor?.kind!=='human')throw fail('Only human review can accept a proposal');
   if(data.reviewHash!==digest([item.base.scene,item.child.project.scene,item.child.revision]))throw fail('Review is stale; inspect this proposal again');
   if(this.main.project?.id!==item.base.id||this.main.revision!==item.baseSceneRevision||this.main.playing||this.main.activeJob||this.main.activeScriptJob)throw fail('Source changed; proposal cannot overwrite concurrent edits');
   const persisted=await this.main.store.run('project.open',{id:item.base.id});if(persisted.project.revision!==item.base.revision)throw fail('Saved project changed in another daemon');
   validateProject(item.child.project);await item.child.validateResources(item.child.project.scene);
   const created=[],directories=[];try{
    const root=await this.main.store.directory(),stem=this.main.store.filename(item.base.id).replace(/\.json$/,'');
    const assets=join(item.root,stem+'.assets');
    try{await lstat(assets);await promote(assets,join(root,stem+'.assets'),created,undefined,(item.child.project.scene.assets??[]).map(a=>(a.sourceId??a.id).slice(8)+'.bin'),directories);}catch(e){if(e.code!=='ENOENT')throw e;}
    const build=item.child.project.scene.script?.build;
    if(build&&build.id!==item.base.scene.script?.build.id){await destinationFolder(join(root,stem+'.scripts'),directories);await promote(join(item.root,stem+'.scripts',build.id),join(root,stem+'.scripts',build.id),created,undefined,['manifest.json','publish'],directories);}

    if(this.items.get(item.id)!==item||item.child.revision!==data.expectedWorkspaceRevision||this.main.project?.id!==item.base.id||this.main.revision!==item.baseSceneRevision||this.main.playing||this.main.activeJob||this.main.activeScriptJob)throw fail('Source or proposal changed during publication');
    this.main.commitScene(structuredClone(item.child.project.scene));
   }catch(error){await Promise.all(created.map(p=>rm(p,{force:true})));for(const path of directories.reverse())await rmdir(path).catch(()=>{});throw error;}
   if(this.previewId===item.id)this.previewId=null;this.items.delete(item.id);await rm(item.root,{recursive:true,force:true});return {id:item.id,status:'accepted',sceneRevision:this.main.revision,dirty:this.main.dirty};
  }
  throw fail('Unknown proposal command');
 }
 async close(){for(const i of this.items.values()){i.child.activeJob?.controller.abort();i.child.activeScriptJob?.controller.abort();}for(const i of this.items.values()){const deadline=Date.now()+10000;while(this.busy(i)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));await i.journalFlight;}}
}
