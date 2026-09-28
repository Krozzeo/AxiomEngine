import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadKernel} from '../engine/wasm/host.mjs';
const bytes=await readFile(new URL('../target/wasm32-unknown-unknown/release/axiom_wasm.wasm',import.meta.url));
const entity=(n,y,dynamic,dimension=3,shape='box')=>({id:'entity://00000000-0000-4000-8000-'+String(n).padStart(12,'0'),name:'Body '+n,transform:{position:[0,y,0],rotation:[0,0,0,1],scale:[1,1,1]},collider:{dimension,shape,halfExtents:n===1?[10,0.5,10]:[0.5,0.5,0.5],trigger:false,layer:1,mask:0xffffffff},...(dynamic?{rigidBody:{mass:1,velocity:[0,0,0],restitution:0,friction:0.5,gravityScale:1}}:{})});
test('real Wasm golden scenes repeat in 2D and 3D without changing authoring',async()=>{
 for(const dimension of [2,3])for(const shape of ['box','sphere']){
  const scene={entities:[entity(1,-1,false,dimension),entity(2,3,true,dimension,shape)]},original=structuredClone(scene),runs=[];
  for(let trial=0;trial<2;trial++){const k=await loadKernel(bytes);try{k.compileScene(scene,new Map());k.configurePhysics(scene);for(let i=0;i<75;i++)k.stepPhysics(8);const s=k.physicsSnapshot();assert.equal(s.steps,600);assert.ok(Math.abs(s.bodies[1].position[1])<0.01);assert.ok(Math.abs(s.bodies[1].velocity[1])<0.01);runs.push(s);assert.equal(k.raycast({origin:[0,5,0],direction:[0,-1,0],dimension}).entityId,scene.entities[1].id);}finally{k.dispose();}}
  assert.deepEqual(runs[0],runs[1]);assert.deepEqual(scene,original);
 }
});
test('Wasm frame integration uses bounded fixed steps and explicit velocity',async()=>{
 const k=await loadKernel(bytes),scene={entities:[entity(2,3,true)]};try{k.compileScene(scene,new Map());k.configurePhysics(scene);k.setVelocities(new Map([[scene.entities[0].id,[2,0,0]]]));const packet=k.stepScene(1/60,1n,1);assert.equal(packet.physics.steps,1);assert.ok(packet.physics.bodies[0].position[0]>0);assert.throws(()=>k.stepPhysics(9),/AX_PHYSICS/);assert.throws(()=>k.raycast({origin:[NaN,0,0],direction:[1,0,0]}),/AX_PHYSICS/);const next=k.stepScene(0.25,2n,1);assert.ok(next.physics.steps<=9);}finally{k.dispose();}
});
