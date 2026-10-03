import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CommandBus} from '../daemon/bootstrap/command-bus.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {AgentService} from '../daemon/bootstrap/agent/service.mjs';
import {EditorBridge} from '../daemon/bootstrap/agent/editor-bridge.mjs';
import {toolMap,validate,page,size} from '../daemon/bootstrap/agent/contracts.mjs';
import {envelope} from '../protocol/src/protocol.ts';
import {imageFixture} from './fixtures.mjs';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'axiom-agent-'));t.after(()=>rm(root,{recursive:true,force:true}));const workspace=new SceneWorkspace(new ProjectStore(root)),bus=new CommandBus({projects:workspace}),bridge=new EditorBridge(workspace,e=>bus.recordError(e),{timeoutMs:25});t.after(()=>bridge.close());bus.agentService=new AgentService({workspace,bus,bridge});const call=(name,args={})=>{validate(toolMap.get(name).inputSchema,args);return bus.dispatch(envelope('command',{type:name,data:args}));};return {workspace,bus,bridge,call};}
test('agent scene workflow uses public revisions, components and bounded queries',async t=>{
 const {call,workspace}=await fixture(t);await call('project.create',{name:'Agent scene'});const mutation=()=>({id:workspace.project.id,expectedSceneRevision:workspace.revision});
 await call('scene.entity.create',{...mutation(),name:'Player'});const entityId=workspace.project.scene.entities[0].id;
 await call('asset.import',{...mutation(),name:'player.png',base64:imageFixture().toString('base64')});const assetId=workspace.project.scene.assets[0].id;
 const bad=await call('scene.component.add',{...mutation(),entityId,component:'Renderable',value:{kind:'mesh',assetId}});assert.equal(bad.kind,'error');assert.equal(workspace.project.scene.entities[0].renderable,undefined);
 assert.equal((await call('scene.component.add',{...mutation(),entityId,component:'Renderable',value:{kind:'sprite',assetId}})).kind,'event');
 const stale=mutation();await call('scene.entity.update',{...mutation(),entityId,transform:{position:[1,2,0]}});assert.equal((await call('scene.entity.delete',{...stale,entityId})).payload.code,'AX_SCENE_0002');
 const entities=(await call('entity.query',{...mutation(),component:'Renderable',maxBytes:1024})).payload.data;assert.equal(entities.items.length,1);assert.deepEqual(entities.items[0].transform.position,[1,2,0]);
 assert.equal((await call('project.query')).payload.data.items.length,1);
 assert.equal((await call('play.start',mutation())).kind,'event');assert.equal((await call('runtime.status')).payload.data.playing,true);await call('play.stop',mutation());
 assert.ok((await call('diagnostics.query')).payload.data.items.some(e=>e.code==='AX_SCENE_0002'));
 const summary=(await call('scene.query',{id:workspace.project.id})).payload.data;assert.equal(summary.entityCount,1);assert.ok(!JSON.stringify(summary).includes('base64'));
 await call('scene.component.remove',{...mutation(),entityId,component:'Renderable'});assert.equal(workspace.project.scene.entities[0].renderable,undefined);
});
test('tool schemas reject excess authority and budgets before mutation',()=>{
 assert.throws(()=>validate(toolMap.get('scene.entity.create').inputSchema,{id:'project://00000000-0000-4000-8000-000000000000',expectedSceneRevision:0,shell:'whoami'}),/Invalid/);
 assert.throws(()=>validate(toolMap.get('entity.query').inputSchema,{id:'project://00000000-0000-4000-8000-000000000000',expectedSceneRevision:0,maxBytes:1000000}),/Invalid/);
 const result=page(Array.from({length:100},(_,i)=>({id:i,name:'x'.repeat(100)})),{limit:100,maxBytes:1024});assert.ok(size(result)<=1024);assert.ok(result.nextOffset>0&&result.nextOffset<100);
 assert.throws(()=>page([{text:'x'.repeat(2000)}],{maxBytes:1024}),/budget/);
});
test('event and diagnostic deltas expose retention gaps without world dumps',async t=>{
 const {bus,call}=await fixture(t);for(let i=0;i<520;i++)bus.execute(envelope('command',{type:'system.ping',data:{echo:'x'}}));
 const d=(await call('events.query',{since:0,maxBytes:1024})).payload.data;assert.equal(d.gap,true);assert.ok(d.nextSince>0);assert.ok(d.items.length<25);assert.ok(!JSON.stringify(d).includes('echo'));
 for(let i=0;i<130;i++)bus.recordError({code:'AX_AGENT_0001',cause:'bad'});assert.equal((await call('diagnostics.query')).payload.data.gap,true);
});
test('renderer bridge denies absent, wrong lease, stale and timed-out captures',async t=>{
 const {bridge,workspace,call}=await fixture(t);await call('project.create',{name:'Capture'});const args={id:workspace.project.id,expectedSceneRevision:workspace.revision};assert.throws(()=>bridge.capture(args),/ready/);
 const clientId='11111111-1111-4111-8111-111111111111',report={clientId,sceneRevision:workspace.revision,status:{projectId:args.id,sceneRevision:workspace.revision,renderer:'webgpu',frame:1}};bridge.sync(report);
 assert.throws(()=>bridge.sync({...report,clientId:'22222222-2222-4222-8222-222222222222'}),/lease/);
 await assert.rejects(bridge.capture(args),/timed out/);
 const pending=bridge.capture(args),request=bridge.sync(report).capture;workspace.revision++;
 bridge.sync({...report,capture:{requestId:request.requestId,value:{sceneRevision:args.expectedSceneRevision,projectId:args.id}}});await assert.rejects(pending,/stale/);
});
test('diagnostic bridge allows Null evidence, binds identities and rejects stale replies',async t=>{
 const {bridge,workspace,call}=await fixture(t);await call('project.create',{name:'Diagnostics'});const args={id:workspace.project.id,expectedSceneRevision:workspace.revision,kind:'whyNotRendered'};
 assert.equal(bridge.explain(args).status,'unavailable');
 const report={clientId:'11111111-1111-4111-8111-111111111111',sceneRevision:workspace.revision,status:{projectId:args.id,sceneRevision:workspace.revision,renderer:'null',frame:1}};bridge.sync(report);
 const pending=bridge.explain(args),request=bridge.sync(report).diagnostic;
 const value={status:'explained',projectId:args.id,workspaceId:null,sceneRevision:args.expectedSceneRevision,nodes:[{code:'AX_CAUSAL_0108'}],edges:[]};
 bridge.sync({...report,diagnostic:{requestId:request.requestId,value}});assert.deepEqual(await pending,value);
 const stale=bridge.explain(args),old=bridge.sync(report).diagnostic;
 bridge.sync({...report,status:{...report.status,sceneRevision:workspace.revision+1},diagnostic:{requestId:old.requestId,value}});await assert.rejects(stale,/stale/);
});
