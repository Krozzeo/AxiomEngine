import {readSessionToken} from '../apps/editor/src/session-token.mjs';
import {createEditorDocument} from '../apps/editor/src/dock-layout.mjs';
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { mountProposalEditor } from "../apps/editor/src/proposal-editor.mjs";
import { mountProjectEditor } from "../apps/editor/src/project-editor.mjs";
import { createAudioSession } from '../apps/editor/src/audio-session.mjs';
import {createGpuProfiler} from "../apps/editor/src/gpu-profiler.mjs";
import { FrameProfiler } from "../apps/editor/src/frame-profiler.mjs";
import { loadKernel } from "../engine/wasm/host.mjs";
import {DecisionEvidence} from '../apps/editor/src/causal-diagnostics.mjs';
import {cameraMatrix,matrixMultiply,modelMatrix,clipVisible,collapsedGeometry} from '../apps/editor/src/view-math.mjs';

import {worldScene} from '../engine/scene/hierarchy.mjs';
import {renderPlan} from '../engine/renderer/render-plan.mjs';
import {createProductionGPU} from '../engine/renderer/production-gpu.mjs';
const bytes = await readFile(new URL("../target/wasm32-unknown-unknown/release/axiom_wasm.wasm", import.meta.url));
const rendererSource=(await readFile(new URL("../apps/editor/src/scene-renderer.mjs",import.meta.url),"utf8")).replace(/^import .*;\n/gm,"").replace("export async function createSceneRenderer","async function createSceneRenderer");
const source = (await readFile(new URL("../apps/editor/src/main.ts", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "").replace(/boot\(\);\s*$/, "globalThis.ready = boot();");

for (const mode of ["forced", "unavailable"]) {
  test(`editor runs real Wasm Null frames when GPU is ${mode}`, async () => {
    const elements = new Map();
    const callbacks = [];
    const pagehide=[];
    let replacedUrl;
    function element() {
      return { dataset:{},style:{}, width: 960, height: 540, textContent: "", append() {}, prepend() {}, setAttribute() {},addEventListener() {}, replaceChildren() {}, classList: { add() {} } };
    }
    const context = vm.createContext({
      readSessionToken,createEditorDocument,createGpuProfiler,mountProfilerEditor:()=>()=>{},createAudioSession,worldScene,renderPlan,createProductionGPU,FrameProfiler, loadKernel, mountProjectEditor, mountProposalEditor,DecisionEvidence,cameraMatrix,matrixMultiply,modelMatrix,clipVisible,collapsedGeometry,mountSceneTools:()=>({select(){},dispose(){}}), URLSearchParams, TextEncoder, crypto: webcrypto, performance, structuredClone,
      location: { hash: "#token=test", pathname: "/", search: mode === "forced" ? "?renderer=null" : "" },
      history: { replaceState(_state, _title, url) { replacedUrl = url; } },
      navigator: mode === "forced" ? { gpu: { requestAdapter() { throw new Error("forced Null must bypass GPU"); } } } : {},
      document: { addEventListener(){},querySelectorAll:()=>[],createElement: element, querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, element());
        return elements.get(selector);
      } },
      addEventListener(name, fn) { if (name === "pagehide") pagehide.push(fn); },
      requestAnimationFrame(fn) { callbacks.push(fn); return callbacks.length; },
      cancelAnimationFrame() {},
      fetch: async (path) => ({ ok: true,
        arrayBuffer: async () => bytes,
        json: async () => ({ protocol: { selected: 1 }, schemaHash: "abc", capabilities: [], limits: { retainedEvents: 512 }, server: {} })
      })
    });
    vm.runInContext(rendererSource, context);
    vm.runInContext(source, context);
    await context.ready;
    assert.match(elements.get("#gpu-state").textContent, /Null Renderer/);
    assert.equal(replacedUrl, mode === "forced" ? "/?renderer=null" : "/");
    callbacks.shift()(100);
    const trace = JSON.parse(elements.get("#frame-trace").textContent);
    assert.equal(trace.kernel.renderer, "null");
    assert.equal(trace.kernel.meshes, 0);
    assert.equal(trace.kernel.frame, 1);
    assert.ok(trace.stages.includes("render.null"));
    assert.equal(trace.gpuTimeMs, null);
    assert.ok(Number.isFinite(trace.cpuTimeMs));
    // RAF must not record the previous world under a new snapshot lease while
    // asynchronous kernel/resource preparation is still pending.
    const loading=vm.runInContext(`renderer.setSnapshot({project:{id:'project://11111111-1111-4111-8111-111111111111',scene:{entities:[]}},sceneRevision:1,playing:false})`,context);
    callbacks.shift()(116);
    assert.equal(JSON.parse(elements.get("#frame-trace").textContent).frameSequence,trace.frameSequence);
    await loading;
    callbacks.shift()(132);
    const replaced=JSON.parse(elements.get("#frame-trace").textContent);
    assert.equal(replaced.profileContext.sceneRevision,1);
    assert.equal(replaced.profileContext.projectId,'project://11111111-1111-4111-8111-111111111111');
    for(const fn of pagehide)fn();
    const queued = callbacks.shift();
    queued(116);
    assert.equal(callbacks.length, 0);
  });
}
