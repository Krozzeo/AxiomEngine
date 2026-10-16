import test from 'node:test';
import assert from 'node:assert/strict';
import {applyScriptOperations,runtimeScriptEntities} from '../engine/scripting/operations.mjs';
const a='entity://11111111-1111-4111-8111-111111111111',b='entity://22222222-2222-4222-8222-222222222222';
const scene=()=>({entities:[{id:a,name:'Root',transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]}}]});
test('runtime creation, component structural edits, metadata and hierarchy publish atomically',()=>{
 const source=scene(),result=applyScriptOperations(source,{generation:1,operations:[{kind:'create',id:b,name:'Child'},{kind:'parent',id:b,name:a},{kind:'property',id:b,name:'runtimeTag',data:'Player'},{kind:'property',id:b,name:'collider',data:{dimension:3,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295}}]},1);
 assert.equal(source.entities.length,1);assert.equal(result.scene.entities[1].runtimeParentId,a);assert.equal(result.scene.entities[1].runtimeTag,'Player');assert.equal(result.changedTopology,true);assert.equal(runtimeScriptEntities(result.scene.entities,[])[1].parentId,a);
 const removed=applyScriptOperations(result.scene,{generation:1,operations:[{kind:'property',id:b,name:'collider',data:null},{kind:'parent',id:b}]},1,result.spawned);assert.equal(removed.scene.entities[1].collider,undefined);assert.equal(runtimeScriptEntities(removed.scene.entities,[{id:b,parentId:a}])[1].parentId,undefined);
 assert.throws(()=>applyScriptOperations(result.scene,{generation:1,operations:[{kind:'parent',id:a,name:b}]},1),/cycle/);assert.throws(()=>applyScriptOperations(source,{generation:1,operations:[{kind:'property',id:a,name:'collider',data:{dimension:4}}]},1),/Missing|Invalid/);assert.equal(source.entities[0].collider,undefined);
});
test('component snapshots reject unsupported fields; sibling reorder and runtime unparent preserve identity',()=>{
 const source=scene();source.entities.push({id:b,name:'B',transform:{position:[2,0,0],rotation:[0,0,0,1],scale:[1,1,1]}});
 assert.throws(()=>applyScriptOperations(source,{generation:1,operations:[{kind:'property',id:a,name:'scriptComponents',data:[{path:'Scripts/Unknown.cs',typeName:'Fake',values:{}}]}]},1),/Invalid/);
 const next=applyScriptOperations(source,{generation:1,operations:[{kind:'sibling',id:b,index:0}]},1);assert.deepEqual(next.scene.entities.map(e=>e.id),[b,a]);assert.deepEqual(source.entities.map(e=>e.id),[a,b]);
});
