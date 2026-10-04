import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ProjectStore } from "../daemon/bootstrap/project-store.mjs";
import { SceneWorkspace } from "../daemon/bootstrap/scene-workspace.mjs";
import { CommandBus } from "../daemon/bootstrap/command-bus.mjs";
import { envelope } from "../protocol/src/protocol.ts";
import { mountProjectEditor } from "../apps/editor/src/project-editor.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "axiom-scene-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = new ProjectStore(root);
  const workspace = new SceneWorkspace(store);
  const bus = new CommandBus({ projects: workspace });
  const send = async (type, data = {}) => {
    const response = await bus.dispatch(envelope("command", { type, data }));
    if (response.kind === "error") throw Object.assign(new Error(response.payload.cause), { code: response.payload.code });
    return response;
  };
  return { store, workspace, bus, send };
}
const input = (state, extra = {}) => ({ id: state.project.id, expectedSceneRevision: state.sceneRevision, ...extra });

test("scene edits, undo and redo survive explicit save and reopen with stable IDs", async t => {
  const { send, store } = await fixture(t);
  let state = (await send("project.create", { name: "Authoring" })).payload.data;
  state = (await send("scene.entity.create", input(state, { name: "Original" }))).payload.data;
  const entityId = state.project.scene.entities[0].id;
  assert.equal((await store.run("project.open", { id: state.project.id })).project.scene.entities.length, 0);
  state = (await send("scene.entity.update", input(state, { entityId, name: "Moved", transform: { position: [2, 3, 4], scale: [2, 2, 2] } }))).payload.data;
  state = (await send("scene.undo", input(state))).payload.data;
  assert.equal(state.project.scene.entities[0].name, "Original");
  state = (await send("scene.redo", input(state))).payload.data;
  assert.deepEqual(state.project.scene.entities[0].transform.position, [2, 3, 4]);
  state = (await send("scene.save", input(state))).payload.data;
  assert.equal(state.dirty, false);
  const restarted = new SceneWorkspace(store);
  const reopened = await restarted.run("project.open", { id: state.project.id });
  assert.deepEqual(reopened.project, state.project);
  assert.equal(reopened.project.scene.entities[0].id, entityId);
  state = (await send("scene.entity.delete", input(state, { entityId }))).payload.data;
  assert.equal(state.project.scene.entities.length, 0);
  state = (await send("scene.undo", input(state))).payload.data;
  assert.equal(state.dirty, false);
  assert.equal(state.project.scene.entities[0].id, entityId);
});

test("stale clients, invalid edits and unsaved switches leave the draft intact", async t => {
  const { send, workspace, bus } = await fixture(t);
  const original = (await send("project.create", { name: "Draft" })).payload.data;
  const current = (await send("scene.entity.create", input(original))).payload.data;
  const events = bus.eventsSince(0).length;
  await assert.rejects(send("scene.entity.create", input(original)), { code: "AX_SCENE_0002" });
  await assert.rejects(send("scene.entity.update", input(current, { entityId: current.project.scene.entities[0].id, transform: { position: [NaN, 0, 0] } })), { code: "AX_PROJECT_0002" });
  await assert.rejects(send("project.create", { name: "Other" }), { code: "AX_SCENE_0003" });
  await assert.rejects(send("project.create", { name: "Other", discardChanges: true, expectedSceneRevision: original.sceneRevision }), { code: "AX_SCENE_0003" });
  await assert.rejects(send("project.save", { id: current.project.id, scene: current.project.scene, expectedRevision: 0 }), { code: "AX_SCENE_0003" });
  assert.deepEqual(workspace.snapshot(), current);
  assert.equal(bus.eventsSince(0).length, events);
  const next = (await send("project.create", { name: "Other", discardChanges: true, expectedSceneRevision: current.sceneRevision })).payload.data;
  assert.equal(next.dirty, false);
  await assert.rejects(send("scene.undo", input(next)), { code: "AX_SCENE_0004" });
});

test("failed disk save preserves dirty workspace and undo history", async t => {
  const { send, workspace, store } = await fixture(t);
  let state = (await send("project.create", { name: "Conflict" })).payload.data;
  await store.run("project.save", { id: state.project.id, expectedRevision: 0, scene: state.project.scene });
  state = (await send("scene.entity.create", input(state))).payload.data;
  await assert.rejects(send("scene.save", input(state)), { code: "AX_PROJECT_0003" });
  assert.deepEqual(workspace.snapshot(), state);
  state = (await send("scene.undo", input(state))).payload.data;
  assert.equal(state.dirty, false);
});

test("history is bounded and a new edit invalidates redo", async t => {
  const { send, workspace } = await fixture(t);
  let state = (await send("project.create", { name: "History" })).payload.data;
  for (let i = 0; i < 66; i++) state = (await send("scene.entity.create", input(state))).payload.data;
  assert.equal(workspace.past.length, 64);
  state = (await send("scene.undo", input(state))).payload.data;
  assert.equal(state.canRedo, true);
  state = (await send("scene.entity.create", input(state))).payload.data;
  assert.equal(state.canRedo, false);
});

async function fakeDocument() {
  const html = await readFile(new URL("../apps/editor/index.html", import.meta.url), "utf8");
  class Element {
    constructor(tag = "div") { this.tag = tag; this.children = []; this.value = ""; this.disabled = false; this.listeners = {}; this.style={};this.dataset={}; }
    addEventListener(type, callback) { this.listeners[type] = callback; }
    querySelectorAll(selector) { const tags=selector.split(','); return this.children.flatMap(child=>[...(tags.includes(child.tag)?[child]:[]),...(child.querySelectorAll?.(selector)??[])]); }
    querySelector() { return null; }
    setAttribute() {}
    append(...children) { this.children.push(...children);const child=children[0]; if (this.tag === "select" && !this.value) this.value = child.value; }
    replaceChildren() { this.children = []; if (this.tag === "select") this.value = ""; }
    async fire(type) { assert.equal(this.disabled, false, "UI action is disabled"); await this.listeners[type]({ preventDefault() {} }); }
  }
  const nodes = new Map([...html.matchAll(/<(\w+)[^>]*\bid="([^"]+)"/g)].map(match => [`#${match[2]}`, new Element(match[1])]));
  return { querySelectorAll:()=>[],querySelector: selector => { assert.ok(nodes.has(selector), `Missing HTML selector ${selector}`); return nodes.get(selector); }, createElement: tag => new Element(tag) };
}
const caps = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo", "asset.import", "asset.get", "scene.asset.place", "scene.camera.update", "play.start", "play.stop", "project.close"].map(name => "command." + name);

test("editor controls create, edit, undo, save and reopen the real command workspace", async t => {
  const { send, store } = await fixture(t);
  const document = await fakeDocument();
  const $ = id => document.querySelector("#" + id);
  const errors = [];
  let discard = false, held=null;
  const editor = mountProjectEditor({ document, send:async(...args)=>{if(held)await held;return send(...args);}, reportError: error => errors.push(error), confirmDiscard: () => discard });
  await editor.connect(caps);
  $("project-name").value = "UI Project";
  await $("project-new").fire("click");
  assert.match($("project-status").textContent, /UI Project/);
  await $("scene-add").fire("click");
  assert.equal($("entities").children.filter(n=>n.className==='tree-row').length, 1);
  $("entity-name").value = "Player";
  $("position-0").value = "5";
  await $("entity-form").fire("submit");
  assert.equal($("entities").children.find(n=>n.className==='tree-row').children[1].textContent, "Player");
  await $("scene-undo").fire("click");
  assert.equal($("entity-name").value, "Entity");
  await $("scene-redo").fire("click");
  assert.equal($("position-0").value, "5");
  $("project-name").value = "Do not create";
  await $("project-new").fire("click");
  assert.equal((await store.run("project.list", {})).projects.length, 1);
  await $("scene-save").fire("click");
  assert.equal($("scene-save").disabled, true);
  await $("project-open").fire("click");
  assert.equal($("position-0").value, "5");
  assert.equal($("entity-name").value, "Player");
  assert.equal($("scene-undo").disabled, true);
  let release;held=new Promise(resolve=>{release=resolve;});
  const refreshing=editor.refreshAssets();
  assert.equal(await editor.refreshAssets(),false,"A busy editor must retain refresh for retry");
  release();assert.equal(await refreshing,true);held=null;
  assert.equal(await editor.refreshAssets(),true);
  assert.deepEqual(errors, []);
});
test('Scene/Game view switches never start or stop Play and selection works both ways',async t=>{
 const {send}=await fixture(t),document=await fakeDocument(),$=id=>document.querySelector('#'+id),views=[],selection=[];
 const editor=mountProjectEditor({document,send,reportError:error=>{throw error;},onView:value=>views.push(value),onSelection:value=>selection.push(value)});await editor.connect(caps);$('project-name').value='View separation';await $('project-new').fire('click');await $('scene-add').fire('click');await $('scene-add').fire('click');
 const initial=(await send('scene.get')).payload.data,first=initial.project.scene.entities[0];editor.selectEntity(first.id);assert.equal($('entity-name').value,first.name);assert.deepEqual(selection.at(-1),[first.id]);
 await $('entities').children.filter(n=>n.className==='tree-row')[1].children[1].fire('click');assert.equal(editor.selectedEntity(),initial.project.scene.entities[1].id);
 await $('game-tab').fire('click');assert.equal((await send('scene.get')).payload.data.playing,false);assert.equal(views.at(-1),'game');await $('play-start').fire('click');assert.equal((await send('scene.get')).payload.data.playing,true);await $('scene-tab').fire('click');assert.equal((await send('scene.get')).payload.data.playing,true);assert.equal(views.at(-1),'scene');await $('play-stop').fire('click');assert.equal((await send('scene.get')).payload.data.playing,false);
});

test("editor respects unsupported daemon capabilities and reports stale-scene conflicts", async t => {
  const { send } = await fixture(t);
  const document = await fakeDocument();
  const $ = id => document.querySelector("#" + id);
  const errors = [];
  const editor = mountProjectEditor({ document, send, reportError: error => errors.push(error) });
  await editor.connect([]);
  assert.equal($("project-new").disabled, true);
  await editor.connect(caps);
  $("project-name").value = "Shared";
  await $("project-new").fire("click");
  const state = (await send("scene.get")).payload.data;
  await send("scene.entity.create", input(state));
  await $("scene-add").fire("click");
  assert.equal(errors[0].code, "AX_SCENE_0002");
  assert.match($("project-error").textContent, /refresh/);
  await $("workspace-refresh").fire("click");
  assert.equal($("entities").children.filter(n=>n.className==='tree-row').length, 1);
});
