import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, readFile, writeFile, symlink, link, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectStore } from "../daemon/bootstrap/project-store.mjs";
import { CommandBus } from "../daemon/bootstrap/command-bus.mjs";
import { envelope } from "../protocol/src/protocol.ts";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "axiom-project-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = new ProjectStore(root);
  const bus = new CommandBus({ projects: store });
  const send = (type, data = {}) => bus.dispatch(envelope("command", { type, data }));
  const created = await send("project.create", { name: "Persistent scene" });
  assert.equal(created.kind, "event");
  return { root, store, bus, send, project: created.payload.data.project };
}
const entity = () => ({ id: `entity://${randomUUID()}`, name: "Cube", transform: { position: [1, 2, 3], rotation: [0, 0, 0, 1], scale: [1, 1, 1] } });

test("project commands persist IDs, transforms and extensions across restart", async t => {
  const { root, send, project } = await fixture(t);
  const first = entity();
  first.plugin = { enabled: true };
  first.transform.unit = "meters";
  const scene = { ...project.scene, entities: [first, entity()], plugin: { opaque: ["future"] } };
  const saved = await send("project.save", { id: project.id, expectedRevision: 0, scene });
  assert.equal(saved.kind, "event");
  const edited = { ...project.scene, entities: [{ id: first.id, name: "Moved", transform: { position: [4, 5, 6], rotation: [0, 0, 0, 1], scale: [1, 1, 1] } }] };
  const second = await send("project.save", { id: project.id, expectedRevision: 1, scene: edited });
  assert.equal(second.kind, "event");
  const restarted = new ProjectStore(root);
  const { project: reopened } = await restarted.run("project.open", { id: project.id });
  assert.deepEqual(reopened, second.payload.data.project);
  assert.equal(reopened.revision, 2);
  assert.equal(reopened.scene.entities.length, 1);
  assert.deepEqual(reopened.scene.plugin, scene.plugin);
  assert.deepEqual(reopened.scene.entities[0].plugin, first.plugin);
  assert.equal(reopened.scene.entities[0].transform.unit, "meters");
  assert.deepEqual((await restarted.run("project.list", {})).projects, [{ id: project.id, name: project.name, revision: 2 }]);
});

test("stale saves emit no success event and command queue recovers", async t => {
  const { send, bus, project } = await fixture(t);
  const data = { id: project.id, expectedRevision: 0, scene: project.scene };
  const results = await Promise.all([send("project.save", data), send("project.save", data)]);
  assert.equal(results[0].kind, "event");
  assert.equal(results[1].payload.code, "AX_PROJECT_0003");
  assert.equal(bus.eventsSince(0).length, 2);
  assert.equal(bus.trace(results[1].traceId).steps.at(-1).stage, "command.rejected");
  const ping = await send("system.ping");
  assert.equal(ping.payload.sequence, 3);
  const outgoing = envelope("command", { type: "project.open", data: { id: project.id } });
  const opened = await bus.dispatch(outgoing);
  assert.equal(opened.causationId, outgoing.messageId);
  assert.equal(opened.traceId, outgoing.traceId);
  assert.equal(opened.correlationId, outgoing.correlationId);
});

test("invalid scene, unsupported versions and traversal cannot alter a project", async t => {
  const { send, root, store, project } = await fixture(t);
  const path = join(root, store.filename(project.id));
  const before = await readFile(path, "utf8");
  const item = entity();
  for (const scene of [
    { ...project.scene, entities: [item, item] },
    { ...project.scene, schemaVersion: 2 },
    { ...project.scene, plugin: "x".repeat(192 * 1024) },
    { ...project.scene, entities: Array.from({ length: 1025 }, entity) },
    { ...project.scene, id: `scene://${randomUUID()}` },
    { ...project.scene, entities: [{ ...item, transform: { ...item.transform, position: [NaN, 0, 0] } }] },
    { ...project.scene, extension: JSON.parse('{"__proto__":{"polluted":true}}') }
  ]) {
    assert.equal((await send("project.save", { id: project.id, expectedRevision: 0, scene })).payload.code, "AX_PROJECT_0002");
    assert.equal(await readFile(path, "utf8"), before);
  }
  for (const id of ["../../outside", "C:\\Users\\Jack\\secret.json", "project://../../outside"]) {
    const result = await send("project.open", { id });
    assert.equal(result.payload.code, "AX_FS_0001");
    assert.ok(!JSON.stringify(result).includes(root));
  }
  assert.equal((await send("project.open", { id: `project://${randomUUID()}` })).payload.code, "AX_PROJECT_0001");
  assert.deepEqual(await readdir(root), [store.filename(project.id)]);
});

test("disk corruption and identity mismatch are rejected without repair or overwrite", async t => {
  const { send, root, store, project } = await fixture(t);
  const path = join(root, store.filename(project.id));
  for (const bytes of ["{invalid", JSON.stringify({ ...project, schemaVersion: 2 }), JSON.stringify({ ...project, id: `project://${randomUUID()}` })]) {
    await writeFile(path, bytes);
    assert.equal((await send("project.open", { id: project.id })).payload.code, "AX_PROJECT_0002");
    assert.equal((await send("project.save", { id: project.id, expectedRevision: 0, scene: project.scene })).payload.code, "AX_PROJECT_0002");
    assert.equal(await readFile(path, "utf8"), bytes);
  }
});

test("separate daemon stores cannot commit the same revision twice", async t => {
  const { store, root, project } = await fixture(t);
  const data = { id: project.id, expectedRevision: 0, scene: project.scene };
  const results = await Promise.allSettled([store.run("project.save", data), new ProjectStore(root).run("project.save", data)]);
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  assert.ok(["AX_PROJECT_0003", "AX_PROJECT_0004"].includes(results.find(r => r.status === "rejected").reason.code));
  assert.equal((await store.run("project.open", { id: project.id })).project.revision, 1);
});

test("project links are rejected and locked files remain intact", async t => {
  const { root, store, send, project } = await fixture(t);
  const path = join(root, store.filename(project.id));
  const bytes = await readFile(path, "utf8");
  await writeFile(`${path}.lock`, "other daemon");
  assert.equal((await send("project.save", { id: project.id, expectedRevision: 0, scene: project.scene })).payload.code, "AX_PROJECT_0004");
  assert.equal(await readFile(`${path}.lock`, "utf8"), "other daemon");
  assert.equal(await readFile(path, "utf8"), bytes);
  await rm(`${path}.lock`);
  const alias = join(root, "alias");
  await link(path, alias);
  assert.equal((await send("project.open", { id: project.id })).payload.code, "AX_FS_0001");
  await rm(path);
  try { await symlink(alias, path); }
  catch (error) { if (process.platform === "win32" && error.code === "EPERM") { t.diagnostic("Symlink creation unavailable on this Windows account"); return; } throw error; }
  assert.equal((await send("project.open", { id: project.id })).payload.code, "AX_FS_0001");
  assert.equal(await readFile(alias, "utf8"), bytes);
});
