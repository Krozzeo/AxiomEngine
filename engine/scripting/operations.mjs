import {validateRuntimeComponent} from '../scene/runtime-edit.mjs';
import {scriptFields,scriptValue} from './fields.mjs';
import {SCRIPT_CONTRACT as LIMIT} from './contract.mjs';
const fail=message=>{throw new Error('AX_SCRIPT_0003: '+message);};
const entityId=/^entity:\/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Validate the whole response before changing a runtime world or emitting logs.
export function applyScriptOperations(scene,packet,generation,spawned=0) {
 if(!packet||packet.generation!==generation)fail('stale runtime generation');
 if(packet.error)throw new Error('AX_SCRIPT_0004: '+String(packet.error).slice(0,4096));
 if(!Array.isArray(packet.operations)||packet.operations.length>LIMIT.operations)fail('operation limit exceeded');
 const candidate=structuredClone(scene),logs=[],audio=[] ,animations=[],positions=new Map(),rotations=new Map(),velocities=new Map();let changedTopology=false;
 const entities=new Map(candidate.entities.map(e=>[e.id,e]));
 for(const op of packet.operations) {
  if(op.kind==='log') {if(typeof op.message!=='string'||op.message.length>2048||logs.length>=LIMIT.logs)fail('invalid log');logs.push(op.message);continue;}
  if(op.kind==='audio'){if(!entities.get(op.id)?.audioSource||!['play','pause','resume','stop','volume'].includes(op.action)||op.action==='volume'&&(!Number.isFinite(op.value)||op.value<0||op.value>1))fail('invalid audio source/action/volume');audio.push({entityId:op.id,action:op.action,value:op.value});continue;}
  if(op.kind==='animation'){const e=entities.get(op.id),a=e?.animator;if(!a||!['pause','resume','state','parameter'].includes(op.action))fail('invalid Animator target/action');if(op.action==='state'&&(!a.states.some(s=>s.name===op.name)||!Number.isFinite(op.duration)||op.duration<0||op.duration>5))fail('invalid animation state/fade');if(op.action==='parameter'&&(!a.parameters.some(p=>p.name===op.name)||!Number.isFinite(op.value)||Math.abs(op.value)>1e6))fail('invalid animation parameter');animations.push({entityId:op.id,action:op.action,name:op.name,value:op.value,duration:op.duration});continue;}
  if(op.kind==='create'){if(!entityId.test(op.id)||entities.has(op.id)||spawned>=LIMIT.spawns||entities.size>=LIMIT.entities||typeof op.name!=='string'||!op.name.trim()||op.name.length>128)fail('Invalid runtime creation');const e={id:op.id,name:op.name,transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]},runtimeParentId:null};candidate.entities.push(e);entities.set(e.id,e);spawned++;changedTopology=true;continue;}
  if(op.kind==='parent'){const e=entities.get(op.id);if(!e||op.name!=null&&!entities.has(op.name))fail('Invalid runtime parent');let id=op.name;for(let depth=0;id!=null;depth++){if(id===op.id||depth>=LIMIT.entities)fail('Runtime hierarchy cycle');const p=entities.get(id);id=Object.hasOwn(p,'runtimeParentId')?p.runtimeParentId:p.parentId;}e.runtimeParentId=op.name??null;delete e.parentId;changedTopology=true;continue;}
  if(op.kind==='property'){const e=entities.get(op.id);if(!e)fail('Stale property target');const key=op.name,value=op.data;
   if(key==='runtimeTag'||key==='name'){if(typeof value!=='string'||!value.trim()||value.length>128)fail('Invalid runtime name/tag');e[key]=value;}
   else if(key==='runtimeLayer'){if(!Number.isInteger(value)||value<0||value>31)fail('Invalid layer');e[key]=value;}
   else if(['collider','rigidBody','camera','audioSource','audioListener','animator','scriptComponents'].includes(key)){
    if(value===null)delete e[key];else {validateRuntimeComponent(key,value);if(key==='scriptComponents')for(const c of value){const meta=scriptFields(candidate,c.path);if(c.typeName!==meta.typeName)fail('Uncompiled component type');for(const [name,v]of Object.entries(c.values)){const field=meta.fields.find(f=>f.name===name);if(!field)fail('Unknown script field');scriptValue(field,v);}}e[key]=structuredClone(value);}changedTopology=true;
   }else fail('Unsupported runtime property');continue;
  }
  if(op.kind==='active'){const entity=entities.get(op.id);if(!entity||typeof op.active!=='boolean')fail('invalid activation');entity.runtimeActive=op.active;changedTopology=true;continue;}
  if(op.kind==='destroy'){if(!entities.has(op.id))fail('stale entity handle');const removed=new Set([op.id]);let added=true;while(added){added=false;for(const e of candidate.entities)if(removed.has(Object.hasOwn(e,'runtimeParentId')?e.runtimeParentId:e.parentId)&&!removed.has(e.id)){removed.add(e.id);added=true;}}candidate.entities=candidate.entities.filter(e=>!removed.has(e.id));for(const id of removed){entities.delete(id);positions.delete(id);rotations.delete(id);velocities.delete(id);}changedTopology=true;continue;}
  if(op.kind==='rotation'){const e=entities.get(op.id),q=op.rotation;if(!e||!Array.isArray(q)||q.length!==4||q.some(v=>!Number.isFinite(v))||Math.abs(Math.hypot(...q)-1)>1e-5)fail('invalid rotation');e.transform.rotation=[...q];rotations.set(op.id,[...q]);continue;}
  if(!Array.isArray(op.position)||op.position.length!==3||op.position.some(v=>!Number.isFinite(v)||Math.abs(v)>1000000))fail('invalid position');
  if(op.kind==='scale'){const entity=entities.get(op.id);if(!entity)fail('stale entity handle');entity.transform.scale=[...op.position];changedTopology=true;continue;}
  if(op.kind==='spawn') {
   const template=entities.get(op.template);
   if(!template||!entityId.test(op.id)||entities.has(op.id)||spawned>=LIMIT.spawns||entities.size>=LIMIT.entities)fail('invalid spawn');
   const entity={...structuredClone(template),id:op.id,name:template.name+' (runtime)',runtimeParentId:null};delete entity.parentId;
   entity.transform.position=[...op.position];candidate.entities.push(entity);entities.set(op.id,entity);spawned++;changedTopology=true;
  }else if(op.kind==='velocity') {
   const entity=entities.get(op.id);if(!entity?.rigidBody||op.position.some(v=>Math.abs(v)>10000))fail('invalid rigid body velocity');entity.rigidBody.velocity=[...op.position];velocities.set(op.id,[...op.position]);
  }else if(op.kind==='move') {
   const entity=entities.get(op.id);if(!entity)fail('stale entity handle');
   entity.transform.position=[...op.position];positions.set(op.id,[...op.position]);
  }else fail('unknown operation');
 }
 if(packet.scriptValues!==undefined){if(!Array.isArray(packet.scriptValues)||packet.scriptValues.length>32)fail('Invalid script field snapshots');const seen=new Set();for(const snapshot of packet.scriptValues){const key=snapshot.entityId+'|'+snapshot.path,component=entities.get(snapshot.entityId)?.scriptComponents?.find(c=>c.path===snapshot.path);if(!component||seen.has(key)||!snapshot.values||typeof snapshot.values!=='object'||Array.isArray(snapshot.values))fail('Invalid script component snapshot');seen.add(key);const meta=scriptFields(candidate,snapshot.path);for(const[name,value]of Object.entries(snapshot.values)){const f=meta.fields.find(f=>f.name===name);if(!f)fail('Unknown runtime field');component.values[name]=scriptValue({...f,minimum:undefined,maximum:undefined},value);}}}
 if(candidate.entities.filter(e=>e.collider).length>256)fail("physics body capacity exceeded");
 if(candidate.entities.filter(e=>e.audioSource).length>32)fail('audio voice capacity exceeded');
 return {scene:candidate,logs,audio,animations,positions,rotations,velocities,spawned,changedTopology};
}

// Runtime transforms are world-space; SDK child lookup still needs authored parent identities.
export function runtimeScriptEntities(entities,hierarchy){const parents=new Map(hierarchy.map(e=>[e.id,e.parentId]));return entities.map(entity=>{const {parentId,...value}=entity,parent=Object.hasOwn(entity,'runtimeParentId')?entity.runtimeParentId:parents.get(entity.id);return {...value,...(parent?{parentId:parent}:{})};});}
