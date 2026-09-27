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
 assert.throws(()=>applyScriptOperations(scene,{generation:3,operations:[{kind:'spawn',id:spawn,template:id,position:[0,0,0]}]},3,64),/invalid spawn/);
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
