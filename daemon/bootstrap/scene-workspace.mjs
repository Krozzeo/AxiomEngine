import { randomUUID } from "node:crypto";
import { validateProject, projectError } from "../../protocol/src/project-document.mjs";

const copy = value => structuredClone(value);
const fail = (code, message) => { throw projectError(code, message); };

// One shared authoring workspace per daemon. Every mutation checks its revision.
export class SceneWorkspace {
  constructor(store) {
    this.store = store;
    this.project = null;
    this.revision = 0;
    this.savedScene = null;
    this.past = [];
    this.future = [];
  }
  get dirty() { return this.project !== null && JSON.stringify(this.project.scene) !== this.savedScene; }
  snapshot() {
    return { project: copy(this.project), sceneRevision: this.revision, dirty: this.dirty, canUndo: this.past.length > 0, canRedo: this.future.length > 0 };
  }
  activate(project) {
    this.project = copy(project);
    this.savedScene = JSON.stringify(project.scene);
    this.past = [];
    this.future = [];
    this.revision++;
    return this.snapshot();
  }
  check(data) {
    if (!this.project || data.id !== this.project.id) fail("AX_SCENE_0001", "Open this project in the workspace first");
    if (data.expectedSceneRevision !== this.revision) fail("AX_SCENE_0002", "Scene changed; refresh before editing");
  }
  async run(type, data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) fail("AX_PROJECT_0002", "Expected command data");
    if (type === "project.list") return this.store.run(type, data);
    if (["project.create", "project.open"].includes(type)) {
      if (this.dirty && (data.discardChanges !== true || data.expectedSceneRevision !== this.revision)) fail("AX_SCENE_0003", "Save or explicitly discard unsaved scene changes first");
      const result = await this.store.run(type, data);
      return this.activate(result.project);
    }
    if (type === "project.save") {
      if (this.dirty && data.id === this.project.id) fail("AX_SCENE_0003", "Use scene.save to save the active draft");
      const result = await this.store.run(type, data);
      return this.project?.id === data.id ? this.activate(result.project) : result;
    }
    if (type === "scene.get") return this.snapshot();
    this.check(data);
    if (type === "scene.save") {
      const result = await this.store.run("project.save", { id: this.project.id, expectedRevision: this.project.revision, scene: this.project.scene });
      this.project = result.project;
      this.savedScene = JSON.stringify(this.project.scene);
      this.revision++;
      return this.snapshot();
    }
    if (type === "scene.undo" || type === "scene.redo") {
      const from = type === "scene.undo" ? this.past : this.future;
      const to = type === "scene.undo" ? this.future : this.past;
      if (!from.length) fail("AX_SCENE_0004", "No scene operation available to undo or redo");
      to.push(copy(this.project.scene));
      this.project.scene = from.pop();
      this.revision++;
      return this.snapshot();
    }
    const scene = copy(this.project.scene);
    const index = scene.entities.findIndex(entity => entity.id === data.entityId);
    if (type === "scene.entity.create") {
      scene.entities.push({ id: `entity://${randomUUID()}`, name: data.name ?? "Entity", transform: { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] } });
    } else if (["scene.entity.update", "scene.entity.delete"].includes(type)) {
      if (index < 0) fail("AX_SCENE_0001", "Entity no longer exists");
      if (type === "scene.entity.delete") scene.entities.splice(index, 1);
      else {
        if (data.name !== undefined) scene.entities[index].name = data.name;
        if (data.transform !== undefined) {
          if (!data.transform || typeof data.transform !== "object" || Array.isArray(data.transform)) fail("AX_PROJECT_0002", "Transform must be an object");
          scene.entities[index].transform = { ...scene.entities[index].transform, ...data.transform };
        }
      }
    } else fail("AX_COMMAND_0002", "Command type is not registered");
    validateProject({ ...this.project, scene });
    if (Buffer.byteLength(JSON.stringify({ ...this.project, scene }, null, 2) + "\n") > 192 * 1024) fail("AX_PROJECT_0002", "Project size exceeds limit");
    this.past.push(copy(this.project.scene));
    if (this.past.length > 64) this.past.shift();
    this.future = [];
    this.project.scene = scene;
    this.revision++;
    return this.snapshot();
  }
}
