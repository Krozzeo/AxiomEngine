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
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'axiom-proposal-')),main=new SceneWorkspace(new ProjectStore(root));await main.run('project.create',{name:'Original'});const manager=new ProposalManager(main);await manager.initialize();t.after(async()=>{await manager.close();await rm(root,{recursive:true,force:true});});const begin=()=>manager.run('workspace.begin',{id:main.project.id,expectedSceneRevision:main.revision,name:'Proposal'},agent);return{root,main,manager,begin};}
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
