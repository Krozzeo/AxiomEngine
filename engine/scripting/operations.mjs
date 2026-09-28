import {SCRIPT_CONTRACT as LIMIT} from './contract.mjs';
const fail=message=>{throw new Error('AX_SCRIPT_0003: '+message);};
const entityId=/^entity:\/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Validate the whole response before changing a runtime world or emitting logs.
export function applyScriptOperations(scene,packet,generation,spawned=0) {
 if(!packet||packet.generation!==generation)fail('stale runtime generation');
 if(packet.error)throw new Error('AX_SCRIPT_0004: '+String(packet.error).slice(0,4096));
 if(!Array.isArray(packet.operations)||packet.operations.length>LIMIT.operations)fail('operation limit exceeded');
 const candidate=structuredClone(scene),logs=[],positions=new Map(),velocities=new Map();let changedTopology=false;
 const entities=new Map(candidate.entities.map(e=>[e.id,e]));
 for(const op of packet.operations) {
  if(op.kind==='log') {if(typeof op.message!=='string'||op.message.length>2048||logs.length>=LIMIT.logs)fail('invalid log');logs.push(op.message);continue;}
  if(!Array.isArray(op.position)||op.position.length!==3||op.position.some(v=>!Number.isFinite(v)||Math.abs(v)>1000000))fail('invalid position');
  if(op.kind==='spawn') {
   const template=entities.get(op.template);
   if(!template||!entityId.test(op.id)||entities.has(op.id)||spawned>=LIMIT.spawns||entities.size>=LIMIT.entities)fail('invalid spawn');
   const entity={...structuredClone(template),id:op.id,name:template.name+' (runtime)'};
   entity.transform.position=[...op.position];candidate.entities.push(entity);entities.set(op.id,entity);spawned++;changedTopology=true;
  }else if(op.kind==='velocity') {
   const entity=entities.get(op.id);if(!entity?.rigidBody||op.position.some(v=>Math.abs(v)>10000))fail('invalid rigid body velocity');entity.rigidBody.velocity=[...op.position];velocities.set(op.id,[...op.position]);
  }else if(op.kind==='move') {
   const entity=entities.get(op.id);if(!entity)fail('stale entity handle');
   entity.transform.position=[...op.position];positions.set(op.id,[...op.position]);
  }else fail('unknown operation');
 }
 if(candidate.entities.filter(e=>e.collider).length>256)fail("physics body capacity exceeded");
 return {scene:candidate,logs,positions,velocities,spawned,changedTopology};
}
