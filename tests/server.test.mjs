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
