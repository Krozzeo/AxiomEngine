import {projectFiles,projectPath} from './project-files.mjs';
import {validateRuntimeEntity} from './runtime-edit.mjs';
import {worldTransforms} from './hierarchy.mjs';
export const isSceneFile=file=>file?.kind==='scene'||/\.scene(?:\.json)?$/i.test(file?.path??'');
export const sceneTitle=path=>path.split('/').at(-1).replace(/\.scene(?:\.json)?$/i,'');
function restoreSceneDevices(scene){const d=scene.sceneDocuments;for(const e of scene.entities){const path=d.owners[e.id];if(e.camera)e.camera.active=path===d.active&&d.cameras?.[path]===e.id;if(e.audioListener)e.audioListener.enabled=path===d.active&&d.listeners?.[path]===e.id;}}
const settings=['camera','cameraMode','rendering','twoD','audio'];
export function readSceneFile(file){
 if(!isSceneFile(file))throw Error('Select a .scene file');let value;try{value=JSON.parse(file.text);}catch{throw Error('Scene is not valid JSON: '+file.path);}
 if(!value||!Array.isArray(value.entities)||value.entities.length>65536)throw Error('Scene must contain at most 65536 entities');
 const ids=new Set();for(const entity of value.entities){validateRuntimeEntity(entity);if(ids.has(entity.id))throw Error('Duplicate scene entity');ids.add(entity.id);}for(const entity of value.entities)if(entity.parentId&&!ids.has(entity.parentId))throw Error('Missing scene parent');worldTransforms(value.entities);return value;
}
export function initializeSceneDocuments(scene){
 if(scene.sceneDocuments)return;scene.projectFiles=projectFiles(scene);let path='Scenes/Main Scene.scene',n=1;while(scene.projectFiles.some(f=>f.path===path))path='Scenes/Main Scene '+n+++'.scene';
 scene.sceneDocuments={active:path,open:[path],owners:Object.fromEntries(scene.entities.map(e=>[e.id,path])),cameras:{[path]:scene.entities.find(e=>e.camera?.active)?.id??null},listeners:{[path]:scene.entities.find(e=>e.audioListener?.enabled)?.id??null}};scene.projectFiles.push({path,kind:'scene',text:'{}'});syncSceneDocuments(scene);
}
export function syncSceneDocuments(scene){
 const state=scene.sceneDocuments;if(!state)return;const ids=new Set(scene.entities.map(e=>e.id));for(const id of Object.keys(state.owners))if(!ids.has(id))delete state.owners[id];
 const byId=new Map(scene.entities.map(e=>[e.id,e]));function owner(e,visited=new Set()){if(visited.has(e.id))throw Error('Scene hierarchy cycle');visited.add(e.id);const path=e.parentId?owner(byId.get(e.parentId)??{},visited):state.owners[e.id]??state.active;if(!path||!state.open.includes(path))throw Error('Open a scene before creating entities');state.owners[e.id]=path;return path;}
 for(const e of scene.entities)owner(e);
 state.cameras??={};state.listeners??={};for(const path of state.open){const members=scene.entities.filter(e=>state.owners[e.id]===path);const camera=members.find(e=>e.camera?.active),listener=members.find(e=>e.audioListener?.enabled);if(path===state.active||camera)state.cameras[path]=camera?.id??null;if(path===state.active||listener)state.listeners[path]=listener?.id??null;}
 for(const path of state.open){const file=scene.projectFiles.find(f=>f.path===path);if(!file)throw Error('An open scene file is missing');const previous=(()=>{try{return JSON.parse(file.text);}catch{return {};}})();const value={format:'axiom-scene',schemaVersion:1,...Object.fromEntries(settings.filter(k=>scene[k]!==undefined&&(path===state.active||previous[k]===undefined)).map(k=>[k,structuredClone(scene[k])])),...Object.fromEntries(settings.filter(k=>path!==state.active&&previous[k]!==undefined).map(k=>[k,previous[k]])),entities:scene.entities.filter(e=>state.owners[e.id]===path).map(e=>{const value=structuredClone(e);if(value.camera)value.camera.active=state.cameras[path]===e.id;if(value.audioListener)value.audioListener.enabled=state.listeners[path]===e.id;return value;})};file.text=JSON.stringify(value,null,2)+'\n';}
}
export function editSceneDocument(scene,data){
 initializeSceneDocuments(scene);syncSceneDocuments(scene);const state=scene.sceneDocuments,path=projectPath(data.path),file=()=>scene.projectFiles.find(f=>f.path===path);
 function activate(){if(!state.open.includes(path))throw Error('Scene is not open');state.active=path;const value=readSceneFile(file());for(const key of settings){if(value[key]!==undefined)scene[key]=structuredClone(value[key]);else delete scene[key];}restoreSceneDevices(scene);}
 if(data.action==='create'){
  if(!path.endsWith('.scene')||scene.projectFiles.some(f=>f.path.toLowerCase()===path.toLowerCase()))throw Error('Create a unique .scene file');const parent=path.slice(0,path.lastIndexOf('/'));if(path.includes('/')&&!scene.projectFiles.some(f=>f.kind==='folder'&&f.path===parent))throw Error('Destination folder does not exist');scene.projectFiles.push({path,kind:'scene',text:data.text??JSON.stringify({format:'axiom-scene',schemaVersion:1,entities:[]},null,2)+'\n'});
 }else if(data.action==='open'){
  if(state.open.includes(path)){activate();return;}if(state.open.length>=16)throw Error('At most 16 scenes may be open');if(state.open.some(p=>sceneTitle(p)===sceneTitle(path)))throw Error('Open scenes must have distinct names');
  const value=readSceneFile(file()),ids=new Set(scene.entities.map(e=>e.id));if(value.entities.some(e=>ids.has(e.id)))throw Error('Scene shares entity IDs with an open scene; close it before opening this copy');
  if(scene.entities.length+value.entities.length>65536)throw Error('Open scenes exceed 65536 live entities');
  state.cameras[path]=value.entities.find(e=>e.camera?.active)?.id??null;state.listeners[path]=value.entities.find(e=>e.audioListener?.enabled)?.id??null;
  scene.entities.push(...structuredClone(value.entities));for(const e of value.entities)state.owners[e.id]=path;state.open.push(path);activate();
 }else if(data.action==='activate')activate();
 else if(data.action==='close'){
  if(!state.open.includes(path))throw Error('Scene is not open');scene.entities=scene.entities.filter(e=>state.owners[e.id]!==path);if(state.alwaysActive)state.alwaysActive=state.alwaysActive.filter(p=>p!==path);state.open=state.open.filter(p=>p!==path);if(state.active===path){state.active=state.open[0]??null;if(state.active){data={...data,path:state.active};const value=readSceneFile(scene.projectFiles.find(f=>f.path===state.active));for(const k of settings){if(value[k]!==undefined)scene[k]=structuredClone(value[k]);else delete scene[k];}}}
  restoreSceneDevices(scene);
 }else if(data.action==='persistent'){
  if(!state.open.includes(path)||typeof data.enabled!=='boolean')throw Error('Select an open scene and a boolean mode');state.alwaysActive??=[];state.alwaysActive=state.alwaysActive.filter(p=>p!==path);if(data.enabled)state.alwaysActive.push(path);
 }else if(data.action==='order'){
  if(!state.open.includes(path)||!state.open.includes(data.beforePath)||path===data.beforePath)throw Error('Reorder two open scenes');state.open=state.open.filter(p=>p!==path);state.open.splice(state.open.indexOf(data.beforePath),0,path);
 }else if(data.action==='move'){
  if(!state.open.includes(path))throw Error('Scene is not open');const selected=new Set(data.entityIds??[]);for(const id of selected){const e=scene.entities.find(e=>e.id===id);if(!e)throw Error('Entity is missing');delete e.parentId;state.owners[id]=path;}
 }else throw Error('Unknown scene document operation');
 if(scene.script)scene.script.attachments=scene.script.attachments.filter(id=>scene.entities.some(e=>e.id===id));syncSceneDocuments(scene);
}
