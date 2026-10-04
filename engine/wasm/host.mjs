import {worldScene,localTransform,worldTransforms,reparent} from '../scene/hierarchy.mjs';
const sharedVertices=new WeakMap();
function verticesFor(primitive){let value=sharedVertices.get(primitive);if(!value){value=new Float32Array(primitive.vertices);sharedVertices.set(primitive,value);}return value;}
import {animationHost} from './animation-host.mjs';
import {physicsHost} from "./physics-host.mjs";
export async function loadKernel(bytes) {
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const api = instance.exports;
  if (api.axiom_abi_version() !== 1) throw new Error("AX_WASM_0001: incompatible ABI");
  const id = api.axiom_create();
  if (!id) throw new Error("AX_WASM_0002: world allocation failed");
  let disposed = false;
  let compiled = null;
  const physics=physicsHost(api,id);
  const animation=animationHost(api,id);
  return {
    animationStep(delta,playing){return animation.step(delta,playing,compiled?.draws??[]);},
    animationDraws(){return compiled?.draws??[];},
    animationControl(args){return animation.control(args);},
    animationStatus(){return animation.status();},
    twoD(delta){const time=api.axiom_2d_tick(id,delta);if(!Number.isFinite(time))throw Error('AX_TIME_0001: invalid 2D tick');return time;},
    animationFrame(time,animation){return api.axiom_2d_animation(time,animation.fps,animation.frames.length,animation.loop?1:0);},
    particle(time,slot,p){return Array.from({length:3},(_,axis)=>api.axiom_2d_particle(time,slot,p.capacity,p.rate,p.lifetime,p.seed,p.speed,p.spread,p.gravity,axis));},
    step(delta, trace, aspect) {
      if (disposed) throw new Error("AX_WASM_0003: disposed world");
      if (!Number.isFinite(aspect) || aspect <= 0) throw new Error("AX_WASM_0004: invalid aspect");
      if (typeof trace !== "bigint" || trace < 0n || trace > 0xffffffffffffffffn) {
        throw new Error("AX_WASM_0005: trace must fit u64");
      }
      if (api.axiom_tick(id, delta, trace) !== 0) throw new Error("AX_TIME_0001: invalid kernel tick");
      const vertices = new Float32Array(12);
      for (let index = 0; index < 3; index++) {
        for (let axis = 0; axis < 4; axis++) {
          vertices[index * 4 + axis] = api.axiom_vertex(id, index, axis, aspect);
        }
      }
      return {
        frame: Number(api.axiom_frame(id)),
        trace: api.axiom_trace(id).toString(),
        fixedSteps: api.axiom_fixed_steps(id),
        vertices,
        nullProcessedMeshes: api.axiom_null_render(id, aspect)
      };
    },
    compileScene(scene, assets, preserveHierarchy=false) {
      if(disposed) throw new Error("AX_WASM_0003: disposed world");
      const localScene=structuredClone(scene);
      if(preserveHierarchy&&compiled){for(const e of compiled.localScene.entities)if(e.parentId&&localScene.entities.some(n=>n.id===e.id)&&localScene.entities.some(n=>n.id===e.parentId))localScene.entities=reparent(localScene.entities,[e.id],e.parentId);}
      scene=worldScene(localScene);
      const draws=scenePrimitives(scene,assets);
      if(api.axiom_scene_clear(id)!==0) throw new Error("AX_WASM_0006: missing authoring ABI");
      for(const draw of draws) {
        const hex=draw.entityId.slice(9).replaceAll("-", ""), uuid=BigInt("0x"+hex);
        const t=draw.transform;
        draw.handle=api.axiom_scene_add(id,uuid>>64n,uuid&0xffffffffffffffffn,draw.vertices.length/8,...t.position,...t.rotation,...t.scale);
        if(draw.handle===0xffffffff) throw new Error("AX_WASM_0007: invalid runtime instance");
      }
      animation.configure(scene,assets,preserveHierarchy);
      compiled={scene:structuredClone(scene),localScene,draws};
      return draws;
    },
    configurePhysics(scene,preserve=false){physics.configure(worldScene(scene),preserve);},
    physicsSnapshot(){return physics.snapshot();},
    stepPhysics(count){return physics.step(count);},
    raycast(args){return physics.raycast(args);},
    setVelocities(values){physics.velocities(values);},
    setPositions(positions) {
      if(disposed||!compiled)throw new Error("AX_WASM_0003: missing compiled scene");
      for(const [entityId,position]of positions) {
        if(!compiled.scene.entities.some(e=>e.id===entityId)||!Array.isArray(position)||position.length!==3||position.some(v=>!Number.isFinite(v)||Math.abs(v)>1000000))throw new Error("AX_WASM_0007: invalid runtime position");
      }
      physics.positions(positions);
      for(const [entityId,position]of positions) {
        for(const draw of compiled.draws.filter(d=>d.entityId===entityId))if(api.axiom_scene_position(id,draw.handle,...position)!==0)throw new Error("AX_WASM_0007: runtime position rejected");
        const local=compiled.localScene.entities.find(e=>e.id===entityId);local.transform=localTransform(compiled.localScene.entities,entityId,{...compiled.scene.entities.find(e=>e.id===entityId).transform,position:[...position]});compiled.scene.entities.find(e=>e.id===entityId).transform.position=[...position];
      }
    },
    stepScene(delta, trace, aspect) {
      if(disposed||!compiled) throw new Error("AX_WASM_0003: missing compiled scene");
      if(typeof trace!=="bigint"||trace<0n||trace>0xffffffffffffffffn) throw new Error("AX_WASM_0005: invalid trace");
      const c=compiled.scene.camera??{position:[0,0,6],target:[0,0,0],projection:"perspective",fov:60,orthoHeight:6};
      if(api.axiom_scene_camera(id,...c.position,...c.target,aspect,c.projection==="orthographic"?1:0,c.projection==="orthographic"?c.orthoHeight:c.fov)!==0) throw new Error("AX_WASM_0004: invalid camera");
      if(api.axiom_tick(id,delta,trace)!==0) throw new Error("AX_TIME_0001: invalid kernel tick");
      const physical=physics.step(api.axiom_fixed_steps(id));
      if(physical){
        const overrides=new Map(physical.bodies.filter(b=>compiled.localScene.entities.find(e=>e.id===b.id)?.rigidBody).map(b=>[b.id,b]));
        const pending=new Set(compiled.localScene.entities.map(e=>e.id));
        while(pending.size){let progress=false;for(const e of compiled.localScene.entities){if(!pending.has(e.id)||pending.has(e.parentId))continue;const b=overrides.get(e.id);if(b){e.transform=localTransform(compiled.localScene.entities,e.id,{...worldTransforms(compiled.localScene.entities).get(e.id),position:b.position,rotation:b.rotation});}pending.delete(e.id);progress=true;}if(!progress)throw Error('AX_SCENE_0001: Runtime hierarchy cycle');}
        compiled.scene=worldScene(compiled.localScene);
        const transforms=new Map(compiled.scene.entities.map(e=>[e.id,e.transform]));
        for(const draw of compiled.draws){const t=transforms.get(draw.entityId);api.axiom_scene_position(id,draw.handle,...t.position);api.axiom_scene_rotation(id,draw.handle,...t.rotation);}
        // Child static colliders follow their parent for the next fixed step.
        physics.transforms(compiled.scene.entities.filter(e=>e.collider&&!e.rigidBody).map(e=>[e.id,e.transform]));
      }
      const draws=compiled.draws.map(draw=>({handle:draw.handle,mvp:Float32Array.from({length:16},(_,i)=>api.axiom_scene_matrix(id,draw.handle,i,1)),model:Float32Array.from({length:16},(_,i)=>api.axiom_scene_matrix(id,draw.handle,i,0))}));
      return {transforms:compiled.scene.entities.map(e=>({id:e.id,transform:e.transform})),physics:physical,draws,frame:Number(api.axiom_frame(id)),trace:api.axiom_trace(id).toString(),fixedSteps:api.axiom_fixed_steps(id),nullProcessedMeshes:api.axiom_scene_null(id)};
    },
    dispose() {
      if (!disposed) api.axiom_destroy(id);
      disposed = true;
    }
  };
}

// Resource geometry comes from the importer; Rust owns runtime instances and matrices.
export function scenePrimitives(scene, assets) {
  scene=worldScene(scene);
  const draws=[];
  for(const entity of scene.entities) {
    if(!entity.renderable) continue;
    const asset=assets.get(entity.renderable.assetId);
    if(!asset || asset.kind!==entity.renderable.kind) throw new Error("AX_ASSET_0001: missing runtime asset");
    let primitives=asset.primitives;
    if(asset.kind==="sprite") {
      const w=asset.width/asset.height;
      primitives=[{vertices:[-w,-1,0,0,0,1,0,1, w,-1,0,0,0,1,1,1, w,1,0,0,0,1,1,0, -w,-1,0,0,0,1,0,1, w,1,0,0,0,1,1,0, -w,1,0,0,0,1,0,0],texture:asset.dataUrl,color:[1,1,1,1],unlit:true}];
    }
    for(const [primitiveIndex,primitive] of primitives.entries()) draws.push({...primitive,primitiveIndex,assetId:entity.renderable.assetId,entityId:entity.id,transform:entity.transform,vertices:verticesFor(primitive)});
  }
  if(draws.length>1024||draws.reduce((sum,d)=>sum+d.vertices.length/8,0)>300000) throw new Error("AX_SCENE_0006: scene exceeds 1024 draw items or 300000 vertices");
  return draws;
}
