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
