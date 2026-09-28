import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadKernel } from "../engine/wasm/host.mjs";

// Read the compiler output, independent of the HTTP regression rebuilding dist.
const bytes = await readFile(new URL("../target/wasm32-unknown-unknown/release/axiom_wasm.wasm", import.meta.url));

test("real Wasm advances clocks and projects the mesh used by Null and GPU", async () => {
  const kernel = await loadKernel(bytes);
  const packet = kernel.step(1 / 30, 42n, 16 / 9);
  assert.equal(packet.frame, 1);
  assert.equal(packet.fixedSteps, 2);
  assert.equal(packet.trace, "42");
  assert.equal(packet.nullProcessedMeshes, 1);
  assert.equal(packet.vertices.length, 12);
  for (let i = 0; i < 12; i += 4) {
    const [x, y, z, w] = packet.vertices.slice(i, i + 4);
    assert.ok(Math.abs(x) < w && Math.abs(y) < w && z >= 0 && z <= w);
  }
  kernel.dispose();
  assert.throws(() => kernel.step(0, 1n, 1), /disposed/);
});

test("Wasm instances isolate state and reject invalid inputs without ticking", async () => {
  const first = await loadKernel(bytes);
  const second = await loadKernel(bytes);
  assert.throws(() => first.step(NaN, 1n, 1), /AX_TIME_0001/);
  assert.throws(() => first.step(0, 1n, 0), /AX_WASM_0004/);
  assert.equal(first.step(0.01, 2n, 1).frame, 1);
  assert.equal(first.step(0.01, 3n, 1).frame, 2);
  assert.equal(second.step(0.01, 1n, 1).frame, 1);
  first.dispose();
  second.dispose();
});

test('runtime position updates cross the Rust boundary without altering authoring',async()=>{
 const kernel=await loadKernel(bytes),id='entity://11111111-1111-4111-8111-111111111111';
 const scene={entities:[{id,transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]},renderable:{kind:'sprite',assetId:'image'}}]};
 kernel.compileScene(scene,new Map([['image',{kind:'sprite',width:1,height:1,dataUrl:''}]]));
 const first=kernel.stepScene(0,1n,1);
 kernel.setPositions(new Map([[id,[2,3,4]]]));const moved=kernel.stepScene(0,2n,1);
 assert.deepEqual([...moved.draws[0].model.slice(12,15)],[2,3,4]);assert.notDeepEqual(moved.draws[0].mvp,first.draws[0].mvp);
 assert.deepEqual(scene.entities[0].transform.position,[0,0,0]);
 assert.throws(()=>kernel.setPositions(new Map([[id,[NaN,0,0]]])),/invalid/);
 const frame=moved.frame;
 const spawned=structuredClone(scene);spawned.entities.push({...structuredClone(scene.entities[0]),id:'entity://22222222-2222-4222-8222-222222222222'});
 kernel.compileScene(spawned,new Map([['image',{kind:'sprite',width:1,height:1,dataUrl:''}]]));
 const expanded=kernel.stepScene(0,3n,1);assert.equal(expanded.frame,frame+1);assert.equal(expanded.nullProcessedMeshes,2);
 kernel.dispose();assert.throws(()=>kernel.setPositions(new Map()),/missing/);
});
