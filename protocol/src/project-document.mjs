import { readFileSync } from "node:fs";

const schema = JSON.parse(readFileSync(new URL("../schema/project-document.schema.json", import.meta.url)));
export const projectError = (code, message) => Object.assign(new Error(message), { code });

function checkVocabulary(rule) {
  const supported = ["$schema", "$id", "type", "required", "properties", "const", "pattern", "minLength", "maxLength", "minimum", "minItems", "maxItems", "items", "enum", "maximum"];
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
    for (const key of rule.required ?? []) if (!Object.hasOwn(value, key)) fail();
    for (const [key, child] of Object.entries(rule.properties ?? {})) {
      if (Object.hasOwn(value, key)) validate(value[key], child, `${path}.${key}`);
    }
  }
  if (rule.type === "array") {
    if (!Array.isArray(value) || value.length < (rule.minItems ?? 0) || value.length > (rule.maxItems ?? Infinity)) fail();
    value.forEach((entry, i) => validate(entry, rule.items, `${path}[${i}]`));
  }
  if (rule.type === "string" && (typeof value !== "string" || value.length < (rule.minLength ?? 0) || value.length > (rule.maxLength ?? Infinity) || (rule.pattern && !new RegExp(rule.pattern).test(value)))) fail();
  if (rule.type === "number" && (!Number.isFinite(value) || value < (rule.minimum ?? -Infinity) || value > (rule.maximum ?? Infinity))) fail();
  if (rule.type === "integer" && (!Number.isSafeInteger(value) || value < (rule.minimum ?? -Infinity))) fail();
}

export function validateProject(document) {
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
  const assets=document.scene.assets??[];
  if(new Set(assets.map(asset=>asset.id)).size!==assets.length) throw projectError("AX_PROJECT_0002","Duplicate asset ID");
  for(const entity of document.scene.entities) {
    if(Math.hypot(...entity.transform.rotation)<1e-8) throw projectError("AX_PROJECT_0002","Quaternion must not be zero");
    if(entity.renderable && !assets.some(asset=>asset.id===entity.renderable.assetId && asset.kind===entity.renderable.kind)) throw projectError("AX_PROJECT_0002","Renderable references a missing or incompatible asset");
  }
  const camera=document.scene.camera;
  if(camera && Math.hypot(...camera.position.map((v,i)=>v-camera.target[i]))<1e-6) throw projectError("AX_PROJECT_0002","Camera position and target must differ");
  return document;
}

// An omitted extension field survives a known-field edit. Removed entities stay removed.
export function preserveExtensions(previous, incoming) {
  if (Array.isArray(incoming)) {
    return incoming.map(value => value?.id && Array.isArray(previous)
      ? preserveExtensions(previous.find(old => old?.id === value.id), value) : value);
  }
  if (incoming && typeof incoming === "object") {
    const result = { ...(previous && typeof previous === "object" ? previous : {}) };
    for (const [key, value] of Object.entries(incoming)) Object.defineProperty(result, key, { value: preserveExtensions(previous?.[key], value), enumerable: true, writable: true, configurable: true });
    return result;
  }
  return incoming;
}
