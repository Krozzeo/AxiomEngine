import {toolMap} from './contracts.mjs';
export const pinnedFields=new Set(['id','workspaceId','expectedSceneRevision','expectedWorkspaceRevision']);
export function assistantSchema(name){
 const schema=structuredClone(toolMap.get(name)?.inputSchema??{});
 for(const key of pinnedFields)delete schema.properties?.[key];
 schema.required=(schema.required??[]).filter(k=>!pinnedFields.has(k));
 return schema;
}
const common=['api.describe','api.search','scene.query','entity.query','scene.entity.update','scene.primitive.create','scene.material.set','project.files.edit','script.compile','script.job.get'];
export const commonSchemas=Object.fromEntries(common.map(n=>[n,assistantSchema(n)]));
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
export function usageDetails(response){const u=response.usage??{};return {inputTokens:u.input_tokens??0,cachedInputTokens:u.input_tokens_details?.cached_tokens??0,outputTokens:u.output_tokens??0,reasoningTokens:u.output_tokens_details?.reasoning_tokens??0,totalTokens:u.total_tokens??null};}
export function compactEntities(result){
 if(!Array.isArray(result?.items))return result;
 return {...result,items:result.items.map(e=>e?.transform?Object.fromEntries(Object.entries(e).filter(([k])=>['id','name','parentId','transform','material','renderable','collider','rigidBody','scriptComponents','camera','light','sprite2D'].includes(k))):e)};
}
