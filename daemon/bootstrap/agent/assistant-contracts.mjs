import {toolMap} from './contracts.mjs';
export const pinnedFields=new Set(['id','workspaceId','expectedSceneRevision','expectedWorkspaceRevision']);
export function assistantSchema(name){
 const schema=structuredClone(toolMap.get(name)?.inputSchema??{});
 for(const key of pinnedFields)delete schema.properties?.[key];
 schema.required=(schema.required??[]).filter(k=>!pinnedFields.has(k));
 return schema;
}
export const privateSchemas={'script.sdk.read':{type:'object',additionalProperties:false,properties:{query:{type:'string',minLength:1,maxLength:80}},required:['query']},'project.file.read':{type:'object',additionalProperties:false,properties:{path:{type:'string'},offset:{type:'integer',minimum:0},maxCharacters:{type:'integer',minimum:1,maximum:24000}},required:['path']}};
const common=['api.describe','api.search','scene.query','entity.query','scene.entity.update','scene.primitive.create','scene.material.set','project.files.edit','script.compile','script.job.get'];
export const commonSchemas={...Object.fromEntries(common.map(n=>[n,assistantSchema(n)])),...privateSchemas};
// References are data paths into earlier results, never executable expressions.
export function resolveReferences(value,results,depth=0){
 if(depth>24)throw Error('Batch reference nesting exceeds limit');
 if(Array.isArray(value))return value.map(v=>resolveReferences(v,results,depth+1));
 if(value&&typeof value==='object'){
  if(Object.hasOwn(value,'$ref')){
   if(Object.keys(value).length!==1||typeof value.$ref!=='string'||!/^\d+(?:\.[A-Za-z0-9_]+)*$/.test(value.$ref))throw Error('Invalid batch reference');
   let result=results;for(const key of value.$ref.split('.')){if(['__proto__','constructor','prototype'].includes(key)||!result||!Object.hasOwn(result,key))throw Error('Batch reference is unavailable');result=result[key];}
   return structuredClone(result);
  }
  return Object.fromEntries(Object.entries(value).map(([k,v])=>{if(['__proto__','constructor','prototype'].includes(k))throw Error('Invalid batch key');return [k,resolveReferences(v,results,depth+1)];}));
 }
 return value;
}
export {usageDetails} from 'axiom-platform/ai/contracts';
export function compactEntities(result){
 if(!Array.isArray(result?.items))return result;
 return {...result,items:result.items.map(e=>e?.transform?Object.fromEntries(Object.entries(e).filter(([k])=>['id','name','parentId','transform','material','renderable','collider','rigidBody','scriptComponents','camera','light','sprite2D'].includes(k))):e)};
}
