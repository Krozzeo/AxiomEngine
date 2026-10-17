import test from 'node:test';
import assert from 'node:assert/strict';
import {applyScriptOperations} from '../engine/scripting/operations.mjs';
import {ScriptRuntime} from '../engine/scripting/runtime.mjs';
const id='entity://11111111-1111-4111-8111-111111111111',spawn='entity://22222222-2222-4222-8222-222222222222';
const scene={entities:[{id,name:'Player',transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]}}]};
test('script operations are atomic, generation-scoped and isolated from authoring',()=>{
 const result=applyScriptOperations(scene,{generation:3,operations:[{kind:'move',id,position:[1,0,0]},{kind:'spawn',id:spawn,template:id,position:[2,0,0]},{kind:'log',message:'spawned'}]},3);
 assert.deepEqual(scene.entities[0].transform.position,[0,0,0]);assert.equal(scene.entities.length,1);
 assert.equal(result.scene.entities.length,2);assert.equal(result.spawned,1);assert.deepEqual(result.logs,['spawned']);
 for(const packet of [{generation:2,operations:[]},{generation:3,operations:[{kind:'move',id,position:[1,0,0]},{kind:'move',id:spawn,position:[1,0,0]}]},{generation:3,operations:[{kind:'move',id,position:[NaN,0,0]}]}])assert.throws(()=>applyScriptOperations(scene,packet,3));
 assert.deepEqual(scene.entities[0].transform.position,[0,0,0]);
 assert.equal(applyScriptOperations(scene,{generation:3,operations:[{kind:'spawn',id:spawn,template:id,position:[0,0,0]}]},3,64).spawned,65);
});
test('runtime kills unresponsive workers and rejects late or overlapping requests',async()=>{
 let worker;class FakeWorker{constructor(){worker=this;}postMessage(data){this.sent=data;}terminate(){this.terminated=true;}}
 const runtime=new ScriptRuntime({WorkerClass:FakeWorker});const first=runtime.request({request:{}},20);
 await assert.rejects(runtime.request({request:{}}),/pending/);
 worker.onmessage({data:{id:999,result:{operations:[]}}});
 await assert.rejects(first,/timed out/);assert.equal(worker.terminated,true);
 await assert.rejects(runtime.request({}),/disposed/);
 const replacement=new ScriptRuntime({WorkerClass:FakeWorker});const next=replacement.request({});
 worker.onmessage({data:{id:worker.sent.id,result:{generation:2,operations:[]}}});assert.equal((await next).generation,2);replacement.dispose();
});
test('rotation operations validate normalized quaternions atomically and preserve authored transforms',()=>{const result=applyScriptOperations(scene,{generation:1,operations:[{kind:'rotation',id,rotation:[0,Math.sin(.2),0,Math.cos(.2)]}]},1);assert.equal(result.rotations.size,1);assert.notDeepEqual(result.scene.entities[0].transform.rotation,scene.entities[0].transform.rotation);assert.throws(()=>applyScriptOperations(scene,{generation:1,operations:[{kind:'rotation',id,rotation:[0,0,0,0]}]},1),/invalid rotation/);assert.deepEqual(scene.entities[0].transform.rotation,[0,0,0,1]);});

test('SDK packets restore parent identities without converting world transforms or mutating the runtime scene',async()=>{
 const {runtimeScriptEntities}=await import('../engine/scripting/operations.mjs');const entities=[{id:'root',transform:{position:[0,1,0]}},{id:'camera',camera:{active:true},transform:{position:[0,1.65,-.35]}}],hierarchy=[{id:'root'},{id:'camera',parentId:'root'}];const packet=runtimeScriptEntities(entities,hierarchy);assert.equal(packet[1].parentId,'root');assert.deepEqual(packet[1].transform.position,[0,1.65,-.35]);assert.equal(entities[1].parentId,undefined);
});
test('destroy removes an entire runtime hierarchy atomically and scale rebuilds topology without changing authoring',()=>{
 const child={...structuredClone(scene.entities[0]),id:spawn,parentId:id};const source={entities:[...scene.entities,child]};
 const removed=applyScriptOperations(source,{generation:1,operations:[{kind:'destroy',id}]},1);assert.equal(removed.scene.entities.length,0);assert.equal(source.entities.length,2);assert.equal(removed.changedTopology,true);
 assert.throws(()=>applyScriptOperations(source,{generation:1,operations:[{kind:'destroy',id},{kind:'move',id:spawn,position:[1,0,0]}]},1),/stale/);assert.equal(source.entities.length,2);
 const scaled=applyScriptOperations(source,{generation:1,operations:[{kind:'scale',id,position:[2,3,4]}]},1);assert.deepEqual(scaled.scene.entities[0].transform.scale,[2,3,4]);assert.equal(scaled.changedTopology,true);assert.deepEqual(source.entities[0].transform.scale,[1,1,1]);
});
test('runtime activation excludes entire hierarchies from world rendering/physics and re-enables without losing entities',async()=>{
 const {worldScene}=await import('../engine/scene/hierarchy.mjs');const child={...structuredClone(scene.entities[0]),id:spawn,parentId:id};const source={entities:[...scene.entities,child]};const disabled=applyScriptOperations(source,{generation:1,operations:[{kind:'active',id,active:false}]},1);assert.equal(disabled.scene.entities.length,2);assert.equal(worldScene(disabled.scene).entities.length,0);const enabled=applyScriptOperations(disabled.scene,{generation:1,operations:[{kind:'active',id,active:true}]},1);assert.equal(worldScene(enabled.scene).entities.length,2);assert.throws(()=>applyScriptOperations(source,{generation:1,operations:[{kind:'active',id,active:'yes'}]},1),/activation/);
});
