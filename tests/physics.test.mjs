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

test('real Wasm angular contacts produce orientation and honor explicit freezeRotation',async()=>{for(const dimension of [2,3])for(const freezeRotation of [false,true]){const k=await loadKernel(bytes),ground=entity(1,-.5,false,dimension),box=entity(2,1,true,dimension);ground.collider.halfExtents=[.5,.5,.5];box.transform.position[0]=.65;box.rigidBody.freezeRotation=freezeRotation;const scene={entities:[ground,box]};try{k.compileScene(scene,new Map());k.configurePhysics(scene);let spin=0;for(let i=0;i<15;i++){k.stepPhysics(6);const s=k.physicsSnapshot();spin=Math.max(spin,Math.hypot(...s.bodies[1].angularVelocity));assert.ok(s.contacts.every(c=>c.point.every(Number.isFinite)));}if(freezeRotation)assert.equal(spin,0);else assert.ok(spin>.1);assert.equal(scene.entities[1].transform.rotation[3],1);}finally{k.dispose();}}});

test('dynamic parent carries an authored child through real Wasm Play transforms',async()=>{const k=await loadKernel(bytes),parent=entity(2,3,true),child=entity(3,1,false);delete child.collider;child.parentId=parent.id;child.transform.position=[1,0,0];const scene={entities:[parent,child]};try{k.compileScene(scene,new Map());k.configurePhysics(scene);const packet=k.stepScene(1/60,1n,1);const p=packet.transforms.find(e=>e.id===parent.id).transform,c=packet.transforms.find(e=>e.id===child.id).transform;assert.ok(p.position[1]<3);assert.deepEqual(c.position,[p.position[0]+1,p.position[1],p.position[2]]);assert.deepEqual(scene.entities[1].transform.position,[1,0,0]);}finally{k.dispose();}});

test('runtime rebuild for script spawns retains parent links and moving descendants',async()=>{const k=await loadKernel(bytes),parent=entity(2,3,true),child=entity(3,0,false);delete child.collider;child.parentId=parent.id;child.transform.position=[1,0,0];const source={entities:[parent,child]};try{k.compileScene(source,new Map());k.configurePhysics(source);const first=k.stepScene(1/60,1n,1);const runtime={entities:source.entities.map(e=>{const item={...e,transform:first.transforms.find(t=>t.id===e.id).transform};delete item.parentId;return item;})};k.compileScene(runtime,new Map(),true);k.configurePhysics(runtime,true);const next=k.stepScene(1/60,2n,1);const p=next.transforms.find(e=>e.id===parent.id).transform,c=next.transforms.find(e=>e.id===child.id).transform;assert.deepEqual(c.position,[p.position[0]+1,p.position[1],p.position[2]]);}finally{k.dispose();}});

test('body-only physics, explicit angular velocity and kinematic rebuild use the actual Wasm solver',async()=>{
 for(const dimension of [2,3]){const k=await loadKernel(bytes),body=entity(2,3,true,dimension);delete body.collider;body.runtimePhysicsDimension=dimension;const scene={entities:[body]};
 try{k.compileScene(scene,new Map());k.configurePhysics(scene);k.setAngularVelocities([[body.id,[0,0,2]]]);const first=k.stepScene(1/60,1n,1);assert.ok(first.transforms[0].transform.position[1]<3);assert.ok(first.transforms[0].transform.rotation[2]>0);assert.equal(k.raycast({origin:[0,5,0],direction:[0,-1,0],dimension}),null);
 const next={entities:[{...body,transform:first.transforms[0].transform,runtimeKinematic:true}]};k.compileScene(next,new Map());k.configurePhysics(next,true);const fixed=k.stepScene(1/60,2n,1);assert.ok(fixed.transforms[0].transform.position[1]<next.entities[0].transform.position[1]);assert.notDeepEqual(fixed.transforms[0].transform.rotation,next.entities[0].transform.rotation);assert.throws(()=>k.setAngularVelocities([[body.id,[0,0,10001]]]),/angular velocity/);
 }finally{k.dispose();}}
});

test('angular batch validation is atomic and a recreated body does not inherit removed momentum',async()=>{
 const k=await loadKernel(bytes),body=entity(2,3,true),scene={entities:[body]};try{k.compileScene(scene,new Map());k.configurePhysics(scene);k.setAngularVelocities([[body.id,[1,2,3]]]);assert.throws(()=>k.setAngularVelocities([[body.id,[5,6,NaN]]]),/angular velocity/);assert.deepEqual(k.physicsSnapshot().bodies[0].angularVelocity,[1,2,3]);
 k.setVelocities([[body.id,[3,2,1]]]);const recreated={entities:[{...body,runtimeBodyEpoch:1}]};k.configurePhysics(recreated,true);assert.deepEqual(k.physicsSnapshot().bodies[0].velocity,[0,0,0]);assert.deepEqual(k.physicsSnapshot().bodies[0].angularVelocity,[0,0,0]);
 k.setVelocities([[body.id,[3,2,1]]]);k.setAngularVelocities([[body.id,[1,2,3]]]);const staticCollider={...body};delete staticCollider.rigidBody;k.configurePhysics({entities:[staticCollider]},true);assert.deepEqual(k.physicsSnapshot().bodies[0].velocity,[0,0,0]);assert.deepEqual(k.physicsSnapshot().bodies[0].angularVelocity,[0,0,0]);
 }finally{k.dispose();}
});

test('expanded Wasm body controls and pre-impact evidence work in 2D and 3D',async()=>{
 for(const dimension of [2,3]){const k=await loadKernel(bytes),body=entity(2,3,true,dimension);body.rigidBody={...body.rigidBody,gravityScale:0,velocity:[6,6,0],angularVelocity:[0,0,2],linearDamping:60,angularDamping:60,constraints:2};try{
  k.configurePhysics({entities:[body]});k.stepPhysics(1);let s=k.physicsSnapshot();assert.equal(s.bodies[0].position[0],0);assert.ok(Math.abs(s.bodies[0].velocity[1]-3)<1e-9);assert.equal(s.bodies[0].angularVelocity[2],1);
  const moving={...body,runtimeKinematic:true,rigidBody:{...body.rigidBody,linearDamping:0,angularDamping:0,constraints:0,velocity:[3,0,0],angularVelocity:[0,0,0]}};k.configurePhysics({entities:[moving]});k.stepPhysics(1);s=k.physicsSnapshot();assert.ok(Math.abs(s.bodies[0].position[0]-.05)<1e-9);assert.equal(s.bodies[0].position[1],3);
  const sleeping={...body,rigidBody:{...body.rigidBody,sleeping:true}};k.configurePhysics({entities:[sleeping]});k.stepPhysics(1);assert.equal(k.physicsSnapshot().bodies[0].sleeping,true);
  k.configurePhysics({entities:[{...body,runtimeSimulated:false}]});assert.equal(k.physicsSnapshot().bodies.length,0);
  const a=entity(2,0,true,dimension),b=entity(3,0,false,dimension);a.rigidBody.gravityScale=0;a.rigidBody.velocity=[6,0,0];b.transform.position=[1,0,0];
  k.configurePhysics({entities:[a,b]});k.stepPhysics(1);s=k.physicsSnapshot();assert.ok(s.contacts.some(c=>c.relativeVelocity[0]===6&&c.impulse>0));
  k.configurePhysics({entities:[a,b],runtimePhysics:{ignoredPairs:[[a.id,b.id].sort().join('|')]}});k.stepPhysics(1);assert.equal(k.physicsSnapshot().contacts.length,0);
  k.configurePhysics({entities:[a,b],runtimePhysics:{ignoredLayers2:['0|0'],ignoredLayers3:['0|0']}});k.stepPhysics(1);assert.equal(k.physicsSnapshot().contacts.length,0);
 }finally{k.dispose();}}
});
