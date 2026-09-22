import { AssetStore } from "./asset-store.mjs";
import { randomUUID } from "node:crypto";
import { validateProject, projectError } from "../../protocol/src/project-document.mjs";

const copy = value => structuredClone(value);
const fail = (code, message) => { throw projectError(code, message); };

// One shared authoring workspace per daemon. Every mutation checks its revision.
export class SceneWorkspace {
  constructor(store) {
    this.store = store;
    this.assets = new AssetStore(store);
    this.playing = false;
    this.project = null;
    this.revision = 0;
    this.savedScene = null;
    this.past = [];
    this.future = [];
  }
  async validateResources(scene) {
    const resources=new Map();let vertices=0,draws=0;
    for(const entity of scene.entities) {
      if(!entity.renderable)continue;
      const id=entity.renderable.assetId;
      if(!resources.has(id))resources.set(id,await this.assets.read(this.project.id,id));
      const resource=resources.get(id);
      if(resource.kind!==entity.renderable.kind)fail("AX_ASSET_0001","Asset kind does not match the entity component");
      vertices+=resource.kind==="sprite"?6:resource.vertexCount;
      draws+=resource.kind==="sprite"?1:resource.primitives.length;
      if(vertices>300000||draws>1024)fail("AX_SCENE_0006","Scene exceeds 300000 vertices or 1024 draw items");
    }
  }
  get dirty() { return this.project !== null && JSON.stringify(this.project.scene) !== this.savedScene; }
  snapshot() {
    return { project: copy(this.project), sceneRevision: this.revision, dirty: this.dirty, canUndo: this.past.length > 0, canRedo: this.future.length > 0, playing: this.playing };
  }
  activate(project) {
    this.project = copy(project);
    this.playing = false;
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
    if (type === "asset.get") {
      if(!this.project || data.id!==this.project.id || !this.project.scene.assets?.some(asset=>asset.id===data.assetId)) fail("AX_ASSET_0001","Asset is not part of this project");
      return {assetId:data.assetId, asset:await this.assets.read(data.id,data.assetId)};
    }
    if (this.playing && !["scene.get", "play.stop", "project.list"].includes(type)) fail("AX_SCENE_0005", "Stop Play before editing or switching projects");
    if (type === "project.list") return this.store.run(type, data);
    if (["project.create", "project.open"].includes(type)) {
      if (this.dirty && (data.discardChanges !== true || data.expectedSceneRevision !== this.revision)) fail("AX_SCENE_0003", "Save or explicitly discard unsaved scene changes first");
      const result = await this.store.run(type, data);
      for(const asset of result.project.scene.assets??[]) await this.assets.read(result.project.id,asset.id);
      return this.activate(result.project);
    }
    if (type === "project.save") {
      if (this.dirty && data.id === this.project.id) fail("AX_SCENE_0003", "Use scene.save to save the active draft");
      const result = await this.store.run(type, data);
      return this.project?.id === data.id ? this.activate(result.project) : result;
    }
    if (type === "scene.get") return this.snapshot();
    this.check(data);
    if(type==="play.start" || type==="play.stop") {
      if(type==="play.start")await this.validateResources(this.project.scene);
      this.playing=type==="play.start";
      this.revision++;
      return this.snapshot();
    }
    if(type==="project.close") {
      if(this.dirty && data.discardChanges!==true) fail("AX_SCENE_0003","Save or discard changes before closing");
      this.project=null;this.savedScene=null;this.past=[];this.future=[];this.revision++;
      return this.snapshot();
    }
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
    if(type==="asset.import") {
      if((scene.assets?.length??0)>=128) fail("AX_ASSET_0001","Project asset limit is 128");
      const asset=await this.assets.put(this.project.id,data.name,data.base64);
      scene.assets??=[];
      if(!scene.assets.some(item=>item.id===asset.id)) scene.assets.push(asset);
    } else if(type==="scene.asset.place") {
      const asset=scene.assets?.find(item=>item.id===data.assetId);
      if(!asset) fail("AX_ASSET_0001","Import the asset before placing it");
      const resource=await this.assets.read(this.project.id,asset.id);
      const center=resource.bounds?resource.bounds.minimum.map((v,i)=>(v+resource.bounds.maximum[i])/2):[0,0,0];
      const size=resource.bounds?Math.max(...resource.bounds.maximum.map((v,i)=>v-resource.bounds.minimum[i])):2*Math.max(1,resource.width/resource.height);
      const scale=size>1e-6?2/size:1;
      scene.entities.push({id:`entity://${randomUUID()}`,name:asset.name,transform:{position:[(asset.kind==="sprite"?-1.5:1.5)-center[0]*scale,-center[1]*scale,-center[2]*scale],rotation:[0,0,0,1],scale:[scale,scale,scale]},renderable:{kind:asset.kind,assetId:asset.id}});
    } else if(type==="scene.camera.update") {
      if(!data.camera||typeof data.camera!=="object"||Array.isArray(data.camera))fail("AX_PROJECT_0002","Camera update must be an object");
      scene.camera={projection:"perspective",position:[0,0,6],target:[0,0,0],orthoHeight:6,fov:60,...scene.camera,...data.camera};
    } else if (type === "scene.entity.create") {
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
    if(type==="scene.asset.place")await this.validateResources(scene);
    if (Buffer.byteLength(JSON.stringify({ ...this.project, scene }, null, 2) + "\n") > 192 * 1024) fail("AX_PROJECT_0002", "Project size exceeds limit");
    this.past.push(copy(this.project.scene));
    if (this.past.length > 64) this.past.shift();
    this.future = [];
    this.project.scene = scene;
    this.revision++;
    return this.snapshot();
  }
}
