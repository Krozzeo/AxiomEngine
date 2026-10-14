import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProposalManager} from '../daemon/bootstrap/workspaces/manager.mjs';
import {imageFixture} from './fixtures.mjs';
const human={actor:{kind:'human',id:'reviewer'},traceId:'review'},agent={actor:{kind:'agent',id:'test-agent'},traceId:'edit'};
async function fixture(t,options={}){const root=await mkdtemp(join(tmpdir(),'axiom-proposal-')),main=new SceneWorkspace(new ProjectStore(root,options));await main.run('project.create',{name:'Original'});const manager=new ProposalManager(main);await manager.initialize();t.after(async()=>{await manager.close();await rm(root,{recursive:true,force:true});});const begin=()=>manager.run('workspace.begin',{id:main.project.id,expectedSceneRevision:main.revision,name:'Proposal'},agent);return{root,main,manager,begin};}
const args=item=>({workspaceId:item.id,id:item.child.project.id,expectedSceneRevision:item.child.revision});
async function accept(manager,item,context=human){const review=await manager.run('workspace.diff',{workspaceId:item.id,maxBytes:65536});return manager.run('workspace.accept',{workspaceId:item.id,expectedWorkspaceRevision:item.child.revision,reviewHash:review.reviewHash},context);}
test('COW proposal keeps source and disk unchanged; reject removes all private files',async t=>{
 const {root,main,manager,begin}=await fixture(t),before=structuredClone(main.snapshot()),disk=await readFile(join(root,main.store.filename(main.project.id)));const p=manager.get((await begin()).id);
 assert.equal(p.child.project.scene,p.base.scene);assert.ok(Object.isFrozen(p.base.scene));
 await manager.execute('scene.entity.create',{...args(p),name:'New'},agent);await manager.execute('asset.import',{...args(p),name:'new.png',base64:imageFixture().toString('base64')},agent);
 assert.deepEqual(main.snapshot(),before);assert.deepEqual(await readFile(join(root,main.store.filename(main.project.id))),disk);assert.ok(!(await readdir(root)).some(n=>n.endsWith('.assets')));
 const diff=await manager.run('workspace.diff',{workspaceId:p.id,maxBytes:1024});assert.ok(diff.items.length);assert.ok(Buffer.byteLength(JSON.stringify(diff))<2000);
 await manager.run('workspace.reject',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision},human);assert.deepEqual(await readdir(join(root,'.proposals')),[]);assert.deepEqual(main.snapshot(),before);
});
test('human reviewed acceptance publishes one undoable draft and preserves imported resources',async t=>{
 const {main,manager,begin}=await fixture(t),p=manager.get((await begin()).id);await manager.execute('asset.import',{...args(p),name:'new.png',base64:imageFixture().toString('base64')},agent);await manager.execute('scene.asset.place',{...args(p),assetId:p.child.project.scene.assets[0].id},agent);
 await assert.rejects(accept(manager,p,agent),/human/);await accept(manager,p);assert.equal(main.project.scene.entities.length,1);assert.equal(main.dirty,true);assert.equal(manager.items.size,0);await main.validateResources(main.project.scene);await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});const saved=await main.store.run('project.open',{id:main.project.id});assert.equal(saved.project.scene.entities.length,1);
 await main.run('scene.undo',{id:main.project.id,expectedSceneRevision:main.revision});assert.equal(main.project.scene.entities.length,0);
});
test('stale review and concurrent source edits cannot be accepted',async t=>{
 const {main,manager,begin}=await fixture(t),p=manager.get((await begin()).id);const review=await manager.run('workspace.diff',{workspaceId:p.id});await manager.execute('scene.entity.create',{...args(p),name:'AI'},agent);
 await assert.rejects(manager.run('workspace.accept',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision,reviewHash:review.reviewHash},human),/stale/);
 await main.run('scene.entity.create',{id:main.project.id,expectedSceneRevision:main.revision,name:'Human'});await assert.rejects(accept(manager,p),/Source changed/);assert.equal(main.project.scene.entities[0].name,'Human');
});
test('idle proposals survive restart; explicit continue rebinds unchanged saved source',async t=>{
 const {root,main,manager,begin}=await fixture(t);await main.run('scene.entity.create',{id:main.project.id,expectedSceneRevision:main.revision,name:'Base'});await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});const p=manager.get((await begin()).id);await manager.execute('scene.entity.create',{...args(p),name:'Resumed'},agent);await manager.close();
 const fresh=new SceneWorkspace(new ProjectStore(root));await fresh.run('project.open',{id:main.project.id});const recovered=new ProposalManager(fresh);await recovered.initialize();t.after(()=>recovered.close());const item=recovered.get(p.id);assert.equal(item.child.project.scene.entities.length,2);assert.equal(fresh.project.scene.entities.length,1);await recovered.run('workspace.continue',{workspaceId:item.id,expectedWorkspaceRevision:item.child.revision},human);await accept(recovered,item);assert.equal(fresh.project.scene.entities.length,2);
});
test('proposal preview and continue never replace the source workspace',async t=>{
 const {main,manager,begin}=await fixture(t),p=manager.get((await begin()).id);await manager.execute('scene.entity.create',{...args(p),name:'Preview'},agent);await manager.run('workspace.preview',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision},human);assert.equal(manager.view().workspaceId,p.id);assert.equal(manager.view().playing,true);assert.equal(main.playing,false);assert.equal(main.project.scene.entities.length,0);await manager.run('workspace.continue',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision},human);assert.equal(manager.view().workspaceId,null);assert.equal(manager.view().project.scene.entities.length,0);
});
test('proposal rejects unsafe IDs, stale operations and linked overlay promotion',async t=>{
 const {main,manager,begin}=await fixture(t);assert.throws(()=>manager.get('../escape'),/identity/);const p=manager.get((await begin()).id);await assert.rejects(manager.run('workspace.reject',{workspaceId:p.id,expectedWorkspaceRevision:99}),/changed/);await assert.rejects(manager.execute('project.save',{...args(p)},agent),/not available/);
 const path=join(p.root,main.store.filename(main.project.id).replace('.json','.assets'));
 try{await symlink(manager.root,path,process.platform==='win32'?'junction':'dir');}catch(e){if(['EPERM','EACCES'].includes(e.code)){t.diagnostic('OS does not grant link creation');return;}throw e;}
 await assert.rejects(accept(manager,p),/link/);assert.equal(main.dirty,false);
});
test('failed publication rolls back promoted resources and leaves rejection available',async t=>{
 const {root,main,manager,begin}=await fixture(t),p=manager.get((await begin()).id);await manager.execute('asset.import',{...args(p),name:'new.png',base64:imageFixture().toString('base64')},agent);const commit=main.commitScene;main.commitScene=()=>{throw Error('Injected publication failure');};await assert.rejects(accept(manager,p),/publication failure/);main.commitScene=commit;assert.ok(!(await readdir(root)).some(n=>n.endsWith('.assets')));assert.equal(main.dirty,false);await manager.run('workspace.reject',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision},human);assert.deepEqual(await readdir(join(root,'.proposals')),[]);
});
test('source edits arriving during asynchronous acceptance validation are preserved',async t=>{
 const {main,manager,begin}=await fixture(t),p=manager.get((await begin()).id);
 await manager.execute('scene.entity.create',{...args(p),name:'AI'},agent);
 const validate=p.child.validateResources.bind(p.child);
 p.child.validateResources=async scene=>{await validate(scene);await main.run('scene.entity.create',{id:main.project.id,expectedSceneRevision:main.revision,name:'Concurrent human'});};
 await assert.rejects(accept(manager,p),/changed during publication/);
 assert.deepEqual(main.project.scene.entities.map(e=>e.name),['Concurrent human']);
 assert.equal(manager.items.size,1);
});

async function apply(manager,item,extra={}){const review=manager.review(item.id);return manager.apply({workspaceId:item.id,expectedWorkspaceRevision:item.child.revision,expectedMainRevision:review.mainRevision,mainHash:review.mainHash,reviewHash:review.reviewHash,...extra},human);}
test('M18.2 preview authoring survives toggles; Apply replaces diverged MAIN and preserves manual preview edits with recovery',async t=>{
 const {root,main,manager,begin}=await fixture(t);await main.run('scene.entity.create',{id:main.project.id,expectedSceneRevision:main.revision,name:'Cube'});await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});const id=main.project.scene.entities[0].id,p=manager.get((await begin()).id);
 await manager.execute('scene.entity.update',{...args(p),entityId:id,transform:{position:[2,0,0]}},agent);await manager.run('workspace.preview',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision,playing:false},human);await manager.run('workspace.continue',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision},human);
 await main.run('scene.entity.update',{id:main.project.id,expectedSceneRevision:main.revision,entityId:id,transform:{position:[5,0,0]}});await main.run('scene.entity.create',{id:main.project.id,expectedSceneRevision:main.revision,name:'Unrelated MAIN addition'});await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});await assert.rejects(apply(manager,p),/explicit replacement/);
 const result=await apply(manager,p,{replaceMain:true});assert.equal(main.project.scene.entities.length,1);assert.equal(main.project.scene.entities[0].transform.position[0],2);assert.equal(main.dirty,true);assert.equal(manager.previewId,null);assert.equal((await main.store.run('project.open',{id:main.project.id})).project.scene.entities[0].transform.position[0],5);
 await manager.recover({recoveryId:result.recoveryId,expectedMainRevision:main.revision},human);assert.equal(main.project.scene.entities.length,2);assert.equal(main.project.scene.entities[0].transform.position[0],5);assert.equal(main.dirty,true);assert.equal((await manager.recoveries()).at(-1).id,result.recoveryId);
 await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});const next=manager.get((await begin()).id);await manager.execute('scene.entity.update',{...args(next),entityId:id,transform:{position:[2,0,0]}},agent);await manager.execute('scene.entity.update',{...args(next),entityId:id,transform:{position:[5,0,0]}},human);await apply(manager,next);assert.equal(main.project.scene.entities[0].transform.position[0],5);assert.equal(main.dirty,true);
});
test('M18.2 script files and editor settings are isolated, persisted and adopted; restart restores authored preview',async t=>{
 const {root,main,manager,begin}=await fixture(t),p=manager.get((await begin()).id);await manager.execute('project.files.edit',{...args(p),action:'create',kind:'script',path:'Scripts/Branch.cs'},human);const editor={...p.child.project.editor,leftWidth:330,rightWidth:320,bottomHeight:210};await manager.execute('project.editor.update',{...args(p),value:editor},human);assert.notEqual(main.project.editor?.leftWidth,330);await manager.run('workspace.preview',{workspaceId:p.id,expectedWorkspaceRevision:p.child.revision,playing:false},human);
 const restoredMain=new SceneWorkspace(new ProjectStore(root)),restored=new ProposalManager(restoredMain);await restored.initialize();assert.equal(restored.previewId,p.id);assert.equal(restored.active.project.editor.leftWidth,330);assert.ok(restored.active.project.scene.projectFiles.some(f=>f.path==='Scripts/Branch.cs'));await restored.run('workspace.continue',{workspaceId:p.id,expectedWorkspaceRevision:restored.active.revision},human);await restored.close();
 await apply(manager,p);assert.equal(main.project.editor?.leftWidth,330);assert.ok(main.project.scene.projectFiles.some(f=>f.path==='Scripts/Branch.cs'));await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});assert.equal((await main.store.run('project.open',{id:main.project.id})).project.editor.leftWidth,330);assert.equal(main.dirty,false);
});
test('M18.2 Apply refuses stale review and active jobs without publication',async t=>{const {main,manager,begin}=await fixture(t),p=manager.get((await begin()).id),review=manager.review(p.id);await manager.execute('scene.entity.create',{...args(p),name:'New'},agent);await assert.rejects(manager.apply({workspaceId:p.id,expectedWorkspaceRevision:p.child.revision,expectedMainRevision:main.revision,mainHash:review.mainHash,reviewHash:review.reviewHash},human),/Review changed/);p.child.activeJob={controller:new AbortController()};await assert.rejects(apply(manager,p),/finish all jobs/);p.child.activeJob=null;assert.equal(main.project.scene.entities.length,0);assert.ok(manager.items.has(p.id));});
test('opening an unchanged panel layout does not stale the proposal review; humans alone can Apply',async t=>{const {manager,begin}=await fixture(t),p=manager.get((await begin()).id),editor={leftWidth:220,rightWidth:330,bottomHeight:220};await manager.execute('project.editor.update',{...args(p),value:editor},human);const review=manager.review(p.id);await manager.execute('project.editor.update',{...args(p),value:editor},human);assert.equal(p.child.revision,review.workspace.revision);await assert.rejects(manager.apply({},agent),/Only human/);await apply(manager,p);});

for(const path of ['accept','apply'])test('Hub folder projects promote isolated asset bytes through '+path+' and retain them after saving/reopening',async t=>{
 const {root,main,manager,begin}=await fixture(t,{folders:true}),p=manager.get((await begin()).id);
 await manager.execute('asset.import',{...args(p),name:'private.png',base64:imageFixture().toString('base64')},agent);
 const assetId=p.child.project.scene.assets[0].id;await manager.execute('scene.asset.place',{...args(p),assetId},agent);
 assert.notEqual(main.store.filename(main.project.id),p.child.store.filename(main.project.id));
 if(path==='accept')await accept(manager,p);else await apply(manager,p);
 await main.validateResources(main.project.scene);assert.deepEqual(await main.assets.readBytes(main.project.id,assetId),imageFixture());
 await main.run('scene.save',{id:main.project.id,expectedSceneRevision:main.revision});const reopened=new SceneWorkspace(new ProjectStore(root,{folders:true}));
 await reopened.run('project.open',{id:main.project.id});await reopened.validateResources(reopened.project.scene);assert.equal(reopened.project.scene.entities.length,1);assert.deepEqual(await reopened.assets.readBytes(main.project.id,assetId),imageFixture());
});
