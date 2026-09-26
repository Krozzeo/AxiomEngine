import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp,rm,readFile,writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ProjectStore } from "../daemon/bootstrap/project-store.mjs";
import { SceneWorkspace } from "../daemon/bootstrap/scene-workspace.mjs";
import { CommandBus } from "../daemon/bootstrap/command-bus.mjs";
import { envelope } from "../protocol/src/protocol.ts";
import { loadKernel } from "../engine/wasm/host.mjs";
import { decodeAsset,parseGlb } from "../engine/assets/import.mjs";
import { imageFixture,glbFixture } from "./fixtures.mjs";
const bytes=await readFile(new URL("../target/wasm32-unknown-unknown/release/axiom_wasm.wasm",import.meta.url));
async function setup(t) {
  const root=await mkdtemp(join(tmpdir(),"axiom-m2-"));t.after(()=>rm(root,{recursive:true,force:true}));
  const store=new ProjectStore(root), workspace=new SceneWorkspace(store),bus=new CommandBus({projects:workspace});
  const send=async(type,data={})=>{const result=await bus.dispatch(envelope("command",{type,data}));if(result.kind==="error")throw Object.assign(new Error(result.payload.cause),{code:result.payload.code});return result.payload.data;};
  return {root,store,workspace,bus,send};
}
const change=(state,extra={})=>({id:state.project.id,expectedSceneRevision:state.sceneRevision,...extra});

test("PNG and static GLB decode into bounded reusable render resources",()=>{
  const image=decodeAsset(imageFixture());assert.equal(image.width,32);assert.equal(image.kind,"sprite");
  const glb=parseGlb(glbFixture());assert.equal(glb.vertexCount,36);assert.equal(glb.primitives.length,1);assert.equal(glb.primitives[0].vertices.length,36*8);
  assert.ok(glb.primitives[0].vertices.every(Number.isFinite));
});

test("malformed assets, external buffers, cycles and accessor overflow are rejected",()=>{
  for(const input of [Buffer.from("not an image"),glbFixture(d=>{d.buffers[0].uri="https://outside.example/data";}),glbFixture(d=>{d.nodes[0].children=[0];}),glbFixture(d=>{d.accessors[0].byteOffset=99999;}),glbFixture(d=>{d.extensionsRequired=["KHR_draco_mesh_compression"];}),glbFixture(d=>{d.accessors[1].count=150001;})])assert.throws(()=>decodeAsset(input),{code:"AX_ASSET_0001"});
  const png=imageFixture();png[40]^=255;assert.throws(()=>decodeAsset(png),{code:"AX_ASSET_0001"});
});

test("complete authored PNG/GLB scene round-trips and compiles identically in real Wasm",async t=>{
  const {store,workspace,bus,send}=await setup(t);
  let state=await send("project.create",{name:"Complete M2"});
  for(const [name,source] of [["checker.png",imageFixture()],["cube.glb",glbFixture()]]) {
    state=await send("asset.import",change(state,{name,base64:source.toString("base64")}));
    state=await send("scene.asset.place",change(state,{assetId:state.project.scene.assets.at(-1).id}));
  }
  assert.equal(state.project.scene.entities.length,2);
  const first=state.project.scene.entities[0];
  state=await send("scene.entity.update",change(state,{entityId:first.id,transform:{position:[-1,0.5,0],scale:[.8,.8,.8]}}));
  state=await send("scene.camera.update",change(state,{camera:{projection:"orthographic"}}));
  state=await send("scene.save",change(state));
  const saved=structuredClone(state.project);
  const assets=new Map();for(const meta of saved.scene.assets)assets.set(meta.id,(await send("asset.get",{id:saved.id,assetId:meta.id})).asset);
  const kernel=await loadKernel(bytes);t.after(()=>kernel.dispose());
  const draws=kernel.compileScene(saved.scene,assets);assert.equal(draws.length,2);
  const before=kernel.stepScene(1/60,1n,16/9);assert.equal(before.nullProcessedMeshes,2);assert.ok(before.draws.every(d=>[...d.mvp].every(Number.isFinite)));
  await send("project.close",change(state));
  const restarted=new SceneWorkspace(store);
  state=await restarted.run("project.open",{id:saved.id});assert.deepEqual(state.project,saved);
  const reopened=await loadKernel(bytes);t.after(()=>reopened.dispose());reopened.compileScene(state.project.scene,assets);
  assert.deepEqual(reopened.stepScene(1/60,1n,16/9).draws,before.draws);
  state=await restarted.run("play.start",change(state));
  assert.equal(state.playing,true);
  await assert.rejects(restarted.run("scene.entity.delete",change(state,{entityId:first.id})),{code:"AX_SCENE_0005"});
  const playKernel=await loadKernel(bytes);t.after(()=>playKernel.dispose());playKernel.compileScene(structuredClone(state.project.scene),assets);playKernel.stepScene(.1,2n,16/9);
  state=await restarted.run("play.stop",change(state));assert.deepEqual(state.project,saved);
  assert.deepEqual((await store.run("project.open",{id:saved.id})).project,saved);
  const loadedEvents=bus.eventsSince(0).filter(e=>e.payload.type==="asset.loaded");assert.ok(loadedEvents.length);assert.ok(loadedEvents.every(e=>!e.payload.data.asset));
  assert.equal(workspace.project,null);
});

test("failed imports leave drafts unchanged and damaged stored assets prevent reopen",async t=>{
  const {send,workspace}=await setup(t);
  let state=await send("project.create",{name:"Safe import"});const original=structuredClone(state);
  await assert.rejects(send("asset.import",change(state,{name:"bad.glb",base64:Buffer.from("bad").toString("base64")})),{code:"AX_ASSET_0001"});assert.deepEqual(workspace.snapshot(),original);
  state=await send("asset.import",change(state,{name:"test.png",base64:imageFixture().toString("base64")}));state=await send("scene.save",change(state));
  const asset=state.project.scene.assets[0];await writeFile(await workspace.assets.path(state.project.id,asset.id),"damaged");
  await assert.rejects(send("project.open",{id:state.project.id}),{code:"AX_ASSET_0001"});assert.deepEqual(workspace.snapshot(),state);
});
