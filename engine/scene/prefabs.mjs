import {selectedRoots} from './editor-operations.mjs';
import {worldTransforms} from './hierarchy.mjs';
import {projectFiles} from './project-files.mjs';
export const isPrefab=file=>file?.kind==='json'&&/\.prefab\.json$/i.test(file.path);
export function capturePrefab(scene,ids){
 const roots=selectedRoots(scene.entities,ids);if(roots.length!==1)throw Error('Drag one entity root (including its children) to create a prefab');
 const included=new Set(roots);for(let changed=true;changed;){changed=false;for(const e of scene.entities)if(included.has(e.parentId)&&!included.has(e.id)){included.add(e.id);changed=true;}}
 const entities=structuredClone(scene.entities.filter(e=>included.has(e.id))),root=entities.find(e=>e.id===roots[0]);root.transform=structuredClone(worldTransforms(scene.entities).get(root.id));delete root.parentId;for(const e of entities)delete e.prefab;
 // External entity references cannot safely bind a reusable prefab to a scene instance.
 const inspect=value=>{if(typeof value==='string'&&value.startsWith('entity://')&&!included.has(value))throw Error('Prefab contains an external entity reference; remove it or include that entity as a child');if(value&&typeof value==='object')for(const child of Object.values(value))inspect(child);};inspect(entities);
 return {format:'axiom-prefab',version:1,name:root.name,entities,scriptAttachments:(scene.script?.attachments??[]).filter(id=>included.has(id))};
}
export function prefabPayload(scene,file,parentId){
 if(!isPrefab(file))throw Error('Select a Project prefab');const value=JSON.parse(file.text);
 if(value.format!=='axiom-prefab'||value.version!==1||!Array.isArray(value.entities)||!value.entities.length||value.entities.length>256)throw Error('Invalid prefab document');
 worldTransforms(value.entities);const ids=new Set(value.entities.map(e=>e.id));if(ids.size!==value.entities.length||value.entities.filter(e=>!e.parentId).length!==1)throw Error('Prefab needs one root and unique entity IDs');
 for(const e of value.entities){for(const id of [e.renderable?.assetId,e.audioSource?.assetId,e.tilemap?.assetId,...(e.lod?.levels??[]).map(l=>l.assetId)])if(id&&!scene.assets?.some(a=>a.id===id))throw Error('Missing prefab asset: '+id);for(const c of e.scriptComponents??[])if(!projectFiles(scene).some(f=>f.kind==='script'&&f.path===c.path))throw Error('Missing prefab script: '+c.path);}
 if(!Array.isArray(value.scriptAttachments)||value.scriptAttachments.some(id=>!ids.has(id)))throw Error('Invalid prefab script attachments');
 const rootId=value.entities.find(e=>!e.parentId).id;return {prefabPath:file.path,entities:value.entities.map(e=>({...e,prefab:{path:file.path,rootId}})),scriptAttachments:value.scriptAttachments,...(parentId?{parentId}:{})};
}
export function remapEntityReferences(value,ids){if(typeof value==='string')return ids.get(value)??value;if(Array.isArray(value))return value.map(v=>remapEntityReferences(v,ids));if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,remapEntityReferences(v,ids)]));return value;}

export function assertPrefabMutation(before,after,type){
 if(type==='scene.undo'||type==='scene.redo')return;
 for(const old of before.entities.filter(e=>e.prefab)){
  const next=after.entities.find(e=>e.id===old.id),root=before.entities.find(e=>e.id===old.prefab.rootId);
  if(!after.entities.some(e=>e.id===root?.id)){if(after.entities.some(e=>e.prefab?.rootId===old.prefab.rootId))throw Error('Cannot delete part of a prefab instance');continue;}
  if(!next)throw Error('Prefab children cannot be deleted. Use Desassemble first.');
  const a=structuredClone(old),b=structuredClone(next);if(['scene.entities.paste','scene.example.create','scene.camera.set','scene.audioListener.set'].includes(type)){if(a.camera&&b.camera){delete a.camera.active;delete b.camera.active;}if(a.audioListener&&b.audioListener){delete a.audioListener.enabled;delete b.audioListener.enabled;}}if(type==='project.files.edit'){delete a.prefab.path;delete b.prefab.path;for(const c of a.scriptComponents??[])delete c.path;for(const c of b.scriptComponents??[])delete c.path;}if(old.id===old.prefab.rootId){delete a.transform;delete b.transform;delete a.parentId;delete b.parentId;}
  // Inspector values are instance overrides; scripts remain physically linked.
  if(a.scriptComponents&&b.scriptComponents){for(const c of a.scriptComponents)delete c.values;for(const c of b.scriptComponents)delete c.values;}
  if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Prefab content is locked. Use Desassemble to edit its components or original children.');
 }
}
