import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { CommandBus } from "../daemon/bootstrap/command-bus.mjs";

function command(type, data = {}, extra = {}) {
  const id = randomUUID();
  return {
    protocolVersion: 1,
    messageId: randomUUID(),
    kind: "command",
    timestamp: new Date().toISOString(),
    correlationId: id,
    traceId: id,
    causationId: null,
    actor: { kind: "test", id: "command-bus-test" },
    payload: { type, data, ...extra }
  };
}

test("mutation emits an event, trace and reversible state", () => {
  const bus = new CommandBus();
  const changed = bus.execute(command("demo.increment", { amount: 3 }));
  assert.equal(changed.kind, "event");
  assert.equal(changed.payload.type, "demo.counterChanged");
  assert.equal(bus.state.counter, 3);
  assert.equal(bus.trace(changed.traceId).steps.at(-1).stage, "event.emitted");

  const undone = bus.execute(command("editor.undo"));
  assert.equal(undone.payload.type, "editor.commandUndone");
  assert.equal(bus.state.counter, 0);
});

test("unknown commands produce stable structured diagnostics", () => {
  const bus = new CommandBus();
  const result = bus.execute(command("unknown.command"));
  assert.equal(result.kind, "error");
  assert.equal(result.payload.code, "AX_COMMAND_0002");
  assert.ok(result.payload.suggestedInspections.includes("describeError(code)"));
});

test("optimistic revision rejects stale mutations", () => {
  const bus = new CommandBus();
  bus.execute(command("demo.increment", { amount: 1 }));
  const stale = bus.execute(command("demo.increment", { amount: 1 }, { expectedRevision: 0 }));
  assert.equal(stale.payload.code, "AX_COMMAND_0003");
  assert.equal(bus.state.counter, 1);
});

test("bootstrap command bus satisfies shared native parity vectors", async () => {
  const vectors = JSON.parse(await readFile(new URL("../protocol/fixtures/command-parity.json", import.meta.url)));
  const bus = new CommandBus();
  for (const vector of vectors) {
    const extra = vector.expectedRevisionInput === undefined
      ? {}
      : { expectedRevision: vector.expectedRevisionInput };
    const result = bus.execute(command(vector.type, vector.data, extra));
    assert.equal(result.kind, vector.expectedKind, vector.name);
    if (vector.expectedType) assert.equal(result.payload.type, vector.expectedType, vector.name);
    if (vector.expectedCode) assert.equal(result.payload.code, vector.expectedCode, vector.name);
    assert.deepEqual(bus.state, {
      counter: vector.expectedCounter,
      revision: vector.expectedRevision
    }, vector.name);
  }
});
