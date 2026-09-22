import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { atomicWrite, resolveInside } from "../daemon/bootstrap/atomic-file.mjs";

test("atomic writes persist data inside the workspace", async (context) => {
  const root = await mkdtemp(join(tmpdir(), "axiom-atomic-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  await atomicWrite(root, "Scenes/demo.axscene", "{\"schemaVersion\":1}");
  assert.equal(await readFile(join(root, "Scenes/demo.axscene"), "utf8"), "{\"schemaVersion\":1}");
});

test("workspace paths cannot escape their capability root", () => {
  assert.throws(() => resolveInside("/tmp/project", "../secret"), (error) => error.code === "AX_FS_0001");
});

