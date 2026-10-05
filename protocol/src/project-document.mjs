import {activeGameCamera} from '../../engine/scene/camera.mjs';
import {audioDefaults} from '../../engine/audio/plan.mjs';
import {worldTransforms} from '../../engine/scene/hierarchy.mjs';
import { readFileSync } from "node:fs";

const schema = JSON.parse(readFileSync(new URL("../schema/project-document.schema.json", import.meta.url)));
export const projectError = (code, message) => Object.assign(new Error(message), { code });

function checkVocabulary(rule) {
  const supported = ["$schema", "$id", "type", "required", "properties", "const", "pattern", "minLength", "maxLength", "minimum", "minItems", "maxItems", "items", "enum", "maximum", "uniqueItems", "additionalProperties"];
  for (const key of Object.keys(rule)) if (!supported.includes(key)) throw new Error(`Unsupported project schema keyword: ${key}`);
  for (const child of Object.values(rule.properties ?? {})) checkVocabulary(child);
  if (rule.items) checkVocabulary(rule.items);
}
checkVocabulary(schema);

// Validator for the closed vocabulary used in this version's canonical schema.
function validate(value, rule, path) {
  const fail = () => { throw projectError("AX_PROJECT_0002", `Invalid project field: ${path}`); };
  if (rule.enum && !rule.enum.includes(value)) fail();
  if ("const" in rule && value !== rule.const) fail();
  if (rule.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail();
    if(rule.additionalProperties===false&&Object.keys(value).some(k=>!Object.hasOwn(rule.properties??{},k)))fail();
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) fail();
    for (const [key, child] of Object.entries(rule.properties ?? {})) {
      if (Object.hasOwn(value, key)) validate(value[key], child, `${path}.${key}`);
    }
  }
  if (rule.type === "array") {
    if (!Array.isArray(value) || value.length < (rule.minItems ?? 0) || value.length > (rule.maxItems ?? Infinity)) fail();
    if(rule.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail();
    value.forEach((entry, i) => validate(entry, rule.items, `${path}[${i}]`));
  }
  if (rule.type === "string" && (typeof value !== "string" || value.length < (rule.minLength ?? 0) || value.length > (rule.maxLength ?? Infinity) || (rule.pattern && !new RegExp(rule.pattern).test(value)))) fail();
  if (rule.type === "number" && (!Number.isFinite(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) fail();
  if (rule.type === "integer" && (!Number.isSafeInteger(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) fail();
  if (rule.type === "boolean" && typeof value !== "boolean") fail();
}

export function validateProject(document) {
  if((document.scene?.entities??[]).filter(e=>e.camera?.active).length>1)throw projectError('AX_PROJECT_0002','Only one Camera can be active');

  const inspect = (value, depth = 0) => {
    if (depth > 32) throw projectError("AX_PROJECT_0002", "Project nesting exceeds 32 levels");
    if (typeof value === "number" && !Number.isFinite(value)) throw projectError("AX_PROJECT_0002", "Non-finite JSON number");
    if (!["string", "number", "boolean", "object"].includes(typeof value)) throw projectError("AX_PROJECT_0002", "Expected JSON data");
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (["__proto__", "constructor", "prototype"].includes(key)) throw projectError("AX_PROJECT_0002", "Unsafe JSON property");
        inspect(child, depth + 1);
      }
    }
  };
  inspect(document);
  validate(document, schema, "project");
  const ids = document.scene.entities.map(entity => entity.id);
  if (new Set(ids).size !== ids.length) throw projectError("AX_PROJECT_0002", "Duplicate entity ID");
  try {worldTransforms(document.scene.entities);}catch(error){throw projectError("AX_PROJECT_0002",error.message);}
  const script=document.scene.script;
  if(script && (new Set(script.attachments).size!==script.attachments.length || script.attachments.some(id=>!ids.includes(id))))throw projectError("AX_PROJECT_0002","Invalid script attachments");
  const assets=document.scene.assets??[];
  if(new Set(assets.map(asset=>asset.id)).size!==assets.length) throw projectError("AX_PROJECT_0002","Duplicate asset ID");
  for(const asset of assets) if(asset.textureId && (asset.kind!=="mesh"||!assets.some(a=>a.id===asset.textureId&&a.kind==="sprite"))) throw projectError("AX_PROJECT_0002","Invalid mesh texture dependency");
  if(document.scene.entities.filter(e=>e.collider).length>256)throw projectError("AX_PROJECT_0002","Physics supports at most 256 colliders");
  for(const entity of document.scene.entities) {
    if(entity.rigidBody&&!entity.collider)throw projectError("AX_PROJECT_0002","RigidBody requires Collider");
    if(Math.hypot(...entity.transform.rotation)<1e-8) throw projectError("AX_PROJECT_0002","Quaternion must not be zero");
    if(entity.renderable && !assets.some(asset=>asset.id===entity.renderable.assetId && asset.kind===entity.renderable.kind)) throw projectError("AX_PROJECT_0002","Renderable references a missing or incompatible asset");
  }
  for(const entity of document.scene.entities) {
    if(entity.light&&(Math.hypot(...entity.light.direction)<1e-6||entity.light.innerAngle>=entity.light.outerAngle))throw projectError("AX_PROJECT_0002","Light requires a direction and innerAngle < outerAngle");
    if(entity.lod){if(entity.renderable?.kind!=="mesh")throw projectError("AX_PROJECT_0002","LOD requires a mesh Renderable");let distance=0;for(const level of entity.lod.levels){if(level.distance<=distance||!assets.some(a=>a.id===level.assetId&&a.kind==="mesh"))throw projectError("AX_PROJECT_0002","LOD levels need ascending distances and imported meshes");distance=level.distance;}}
  }
  if(document.scene.entities.filter(e=>e.light).length>64)throw projectError("AX_PROJECT_0002","Renderer supports at most 64 lights");
  const audio=document.scene.audio??audioDefaults,sources=document.scene.entities.filter(e=>e.audioSource),listeners=document.scene.entities.filter(e=>e.audioListener?.enabled);
  if(sources.length>32||listeners.length>1||new Set(audio.buses.map(b=>b.name)).size!==audio.buses.length)throw projectError('AX_PROJECT_0002','Audio source/listener/bus limits exceeded');
  for(const e of sources){const a=e.audioSource;if(!assets.some(r=>r.id===a.assetId&&r.kind==='audio')||!audio.buses.some(b=>b.name===a.bus)||a.maxDistance<a.minDistance)throw projectError('AX_PROJECT_0002','Invalid audio asset, bus or distance range');}
  const animated=document.scene.entities.filter(e=>e.animator);
  if(animated.length>16)throw projectError('AX_PROJECT_0002','At most 16 Animator entities');
  for(const e of animated){
    const a=e.animator,names=a.states.map(s=>s.name),params=a.parameters.map(p=>p.name);
    if(e.renderable?.kind!=='mesh'||e.lod||new Set(names).size!==names.length||new Set(params).size!==params.length||!names.includes(a.initialState))throw projectError('AX_PROJECT_0002','Animator needs a mesh, unique states/parameters and initial state; excludes LOD');
    for(const t of a.transitions)if(!names.includes(t.source)||!names.includes(t.target)||t.source===t.target||t.parameter&&!params.includes(t.parameter))throw projectError('AX_PROJECT_0002','Invalid animation transition');
  }
  const components=['sprite2D','spriteAnimation','tilemap','light2D','particles2D','ui2D'];
  const twoD=document.scene.twoD;
  if(!twoD&&document.scene.entities.some(e=>components.some(k=>e[k])))throw projectError('AX_PROJECT_0002','2D components require 2D scene settings');
  if(twoD){
    if(document.scene.rendering||document.scene.entities.some(e=>e.renderable?.kind==='mesh'))throw projectError('AX_PROJECT_0002','2D mode does not mix mesh/HDR rendering');
    const gameCamera=activeGameCamera(document.scene);if(gameCamera&&gameCamera.projection!=='orthographic')throw projectError('AX_PROJECT_0002','2D Game camera must be orthographic');
    if(twoD.pixelPerfect&&gameCamera){const c=gameCamera;if(Math.abs(c.position[0]-c.target[0])>1e-6||Math.abs(c.position[1]-c.target[1])>1e-6||c.position[2]<=c.target[2])throw projectError('AX_PROJECT_0002','Pixel-perfect Game camera must face the XY plane from positive Z');}
    const entities=document.scene.entities;
    if(entities.filter(e=>e.light2D).length>16||entities.filter(e=>e.particles2D).length>32||entities.filter(e=>e.ui2D).length>128||entities.reduce((n,e)=>n+(e.tilemap?.cells.length??0),0)>4096||entities.reduce((n,e)=>n+(e.particles2D?.capacity??0),0)>2048)throw projectError('AX_PROJECT_0002','2D component budget exceeded');
    if(entities.reduce((n,e)=>n+Number(!!e.renderable)+Number(!!e.tilemap)+Number(!!e.particles2D)+Number(!!e.ui2D),0)>1024)throw projectError('AX_PROJECT_0002','2D batch admission budget exceeded');
    for(const e of entities){
      if(e.sprite2D&&(e.renderable?.kind!=='sprite'||e.sprite2D.frame>=e.sprite2D.columns*e.sprite2D.rows))throw projectError('AX_PROJECT_0002','Sprite2D requires sprite Renderable and valid atlas frame');
      if(e.spriteAnimation&&(!e.sprite2D||e.spriteAnimation.frames.some(f=>f>=e.sprite2D.columns*e.sprite2D.rows)))throw projectError('AX_PROJECT_0002','SpriteAnimation requires Sprite2D and valid atlas frames');
      if(e.tilemap&&(e.tilemap.cells.length!==e.tilemap.width*e.tilemap.height||e.tilemap.cells.some(f=>f>=e.tilemap.columns*e.tilemap.rows)||!assets.some(a=>a.id===e.tilemap.assetId&&a.kind==='sprite')))throw projectError('AX_PROJECT_0002','Invalid tilemap cells or PNG reference');
      if(e.ui2D&&(e.ui2D.rect[2]<=0||e.ui2D.rect[3]<=0||e.ui2D.rect[0]+e.ui2D.rect[2]>1||e.ui2D.rect[1]+e.ui2D.rect[3]>1||e.ui2D.kind==='panel'&&e.ui2D.action!=='none'))throw projectError('AX_PROJECT_0002','UI rectangle/action is invalid');
    }
  }
  const camera=document.scene.camera;
  if(camera && Math.hypot(...camera.position.map((v,i)=>v-camera.target[i]))<1e-6) throw projectError("AX_PROJECT_0002","Camera position and target must differ");
  return document;
}

// An omitted extension field survives a known-field edit. Removed entities stay removed.
export function preserveExtensions(previous, incoming, rule = schema.properties.scene) {
  if (Array.isArray(incoming)) {
    return incoming.map(value => value?.id && Array.isArray(previous)
      ? preserveExtensions(previous.find(old => old?.id === value.id), value, rule.items ?? {}) : value);
  }
  if (incoming && typeof incoming === "object") {
    const result = Object.fromEntries(Object.entries(previous && typeof previous === "object" ? previous : {}).filter(([key]) => !Object.hasOwn(rule.properties ?? {}, key)));
    for (const [key, value] of Object.entries(incoming)) Object.defineProperty(result, key, { value: preserveExtensions(previous?.[key], value, rule.properties?.[key] ?? {}), enumerable: true, writable: true, configurable: true });
    return result;
  }
  return incoming;
}
