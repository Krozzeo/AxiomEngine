import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { startServer } from "../daemon/bootstrap/server.mjs";

function headers(instance, overrides = {}) {
  return { Origin: instance.origin, Authorization: `Bearer ${instance.token}`, "Axiom-Protocol-Version": "1", ...overrides };
}

function command(type) {
  const id = randomUUID();
  return {
    protocolVersion: 1,
    messageId: randomUUID(),
    kind: "command",
    timestamp: new Date().toISOString(),
    correlationId: id,
    traceId: id,
    causationId: null,
    actor: { kind: "test", id: "integration" },
    payload: { type, data: { echo: "integration" } }
  };
}

test("daemon rebuilds and serves editor assets when dist is absent", async (context) => {
  await rm(resolve(import.meta.dirname, "../dist/editor"), { recursive: true, force: true });
  const instance = await startServer();
  context.after(() => instance.close());

  const response = await fetch(instance.origin);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>Axiom Engine<\/title>/);
  const profilerModule = await fetch(`${instance.origin}/frame-profiler.js`);
  assert.equal(profilerModule.status, 200);
  assert.match(profilerModule.headers.get("content-type"), /text\/javascript/);
  assert.match(await profilerModule.text(), /export class FrameProfiler/);
  const policy = response.headers.get("content-security-policy");
  assert.ok(policy.includes("'wasm-unsafe-eval'"));
  assert.ok(!policy.includes("'unsafe-eval'"));
  const wasmResponse = await fetch(`${instance.origin}/axiom-kernel.wasm`);
  assert.equal(wasmResponse.status, 200);
  assert.equal(WebAssembly.validate(await wasmResponse.arrayBuffer()), true);
  const favicon = await fetch(`${instance.origin}/favicon.ico`);
  assert.equal(favicon.status, 204);
  assert.equal(await favicon.text(), "");
  const missing = await fetch(`${instance.origin}/missing-editor-asset.js`);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, "AX_HTTP_0002");
});

test("browser-to-daemon walking skeleton negotiates, commands and traces", async (context) => {
  const instance = await startServer();
  context.after(() => instance.close());

  const handshakeResponse = await fetch(`${instance.origin}/v1/handshake`, { headers: headers(instance) });
  assert.equal(handshakeResponse.status, 200);
  const handshake = await handshakeResponse.json();
  assert.equal(handshake.protocol.selected, 1);
  assert.ok(handshake.capabilities.includes("diagnostics.trace"));

  const outgoing = command("system.ping");
  const response = await fetch(`${instance.origin}/v1/commands`, {
    method: "POST",
    headers: { ...headers(instance), "Content-Type": "application/json" },
    body: JSON.stringify(outgoing)
  });
  assert.equal(response.status, 200);
  const event = await response.json();
  assert.equal(event.payload.type, "system.pong");
  assert.equal(event.correlationId, outgoing.correlationId);

  const traceResponse = await fetch(`${instance.origin}/v1/traces/${outgoing.traceId}`, { headers: headers(instance) });
  assert.equal(traceResponse.status, 200);
  const trace = await traceResponse.json();
  assert.equal(trace.traceId, outgoing.traceId);
  assert.equal(trace.steps.at(-1).stage, "event.emitted");
});

test("daemon rejects unauthorized origins and invalid tokens", async (context) => {
  const instance = await startServer();
  context.after(() => instance.close());
  const wrongOrigin = await fetch(`${instance.origin}/v1/handshake`, { headers: headers(instance, { Origin: "https://attacker.example" }) });
  assert.equal(wrongOrigin.status, 403);
  const wrongToken = await fetch(`${instance.origin}/v1/handshake`, { headers: headers(instance, { Authorization: "Bearer wrong" }) });
  assert.equal(wrongToken.status, 401);
});

test("browser same-origin GET handshake works when Origin is omitted", async (context) => {
  const instance = await startServer();
  context.after(() => instance.close());
  const response = await fetch(`${instance.origin}/v1/handshake`, {
    headers: {
      Authorization: `Bearer ${instance.token}`,
      "Axiom-Protocol-Version": "1",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors"
    }
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).protocol.selected, 1);
});

test("authenticated project commands survive daemon restart and deny cross-origin saves", async context => {
  const { mkdtemp, readdir } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const projectRoot = await mkdtemp(join(tmpdir(), "axiom-http-project-"));
  let instance = await startServer({ projectRoot });
  context.after(async () => { await instance.close(); await rm(projectRoot, { recursive: true, force: true }); });
  const post = (type, data, overrides = {}) => fetch(`${instance.origin}/v1/commands`, {
    method: "POST", headers: { ...headers(instance, overrides), "Content-Type": "application/json" },
    body: JSON.stringify({ ...command(type), payload: { type, data } })
  });
  const capabilities = await (await fetch(`${instance.origin}/v1/handshake`, { headers: headers(instance) })).json();
  assert.ok(capabilities.capabilities.includes("command.project.save"));
  assert.equal((await post("project.create", { name: "Blocked" }, { Authorization: "Bearer wrong" })).status, 401);
  assert.deepEqual(await readdir(projectRoot), []);
  const created = await (await post("project.create", { name: "HTTP scene" })).json();
  assert.equal(created.kind, "event");
  const project = created.payload.data.project;
  const data = { id: project.id, expectedRevision: 0, scene: { ...project.scene, plugin: { saved: true } } };
  assert.equal((await post("project.save", data, { Origin: "https://attacker.example" })).status, 403);
  const saved = await (await post("project.save", data)).json();
  assert.equal(saved.payload.data.project.revision, 1);
  assert.equal((await post("project.save", data)).status, 422);
  await instance.close();
  instance = await startServer({ projectRoot });
  const opened = await (await post("project.open", { id: project.id })).json();
  assert.deepEqual(opened.payload.data.project, saved.payload.data.project);
});

test("HTTP scene editing rejects stale tabs and persists only on save", async context => {
  const { mkdtemp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const projectRoot = await mkdtemp(join(tmpdir(), "axiom-http-scene-"));
  let instance = await startServer({ projectRoot });
  context.after(async () => { await instance.close(); await rm(projectRoot, { recursive: true, force: true }); });
  const post = async (type, data = {}) => {
    const response = await fetch(`${instance.origin}/v1/commands`, {
      method: "POST", headers: { ...headers(instance), "Content-Type": "application/json" },
      body: JSON.stringify({ ...command(type), payload: { type, data } })
    });
    return { status: response.status, result: await response.json() };
  };
  let state = (await post("project.create", { name: "HTTP draft" })).result.payload.data;
  const original = { id: state.project.id, expectedSceneRevision: state.sceneRevision };
  state = (await post("scene.entity.create", { ...original, name: "Player" })).result.payload.data;
  assert.equal(state.dirty, true);
  assert.equal((await post("scene.entity.create", original)).result.payload.code, "AX_SCENE_0002");
  state = (await post("scene.save", { id: state.project.id, expectedSceneRevision: state.sceneRevision })).result.payload.data;
  assert.equal(state.dirty, false);
  await instance.close();
  instance = await startServer({ projectRoot });
  const opened = await post("project.open", { id: state.project.id });
  assert.deepEqual(opened.result.payload.data.project, state.project);
  const module = await fetch(`${instance.origin}/project-editor.js`);
  assert.equal(module.status, 200);
  assert.match(await module.text(), /export function mountProjectEditor/);
});
