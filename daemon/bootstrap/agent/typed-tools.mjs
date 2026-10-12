import {toolMap} from './contracts.mjs';
import {assistantSchema,privateSchemas} from './assistant-contracts.mjs';
import {workSchemas} from './work-orders.mjs';
export const functionName=name=>name.replaceAll('.','_');
export const privateToolSchemas={...privateSchemas,...workSchemas,
 'project.master.read':{type:'object',additionalProperties:false,properties:{sectionId:{type:'string'},topic:{type:'string',enum:['roadmap','decisions','questions','index']},offset:{type:'integer',minimum:0},maxCharacters:{type:'integer',minimum:1,maximum:24000}}},
 'project.master.edit':{type:'object',additionalProperties:false,properties:{sections:{type:'array',items:{type:'object'}},upsertSections:{type:'array',items:{type:'object'}},removeSectionIds:{type:'array',items:{type:'string'}},decisions:{type:'array',items:{type:'object'}},questions:{type:'array',items:{type:'string'}},roadmap:{type:'array',items:{type:'object'}}}}
};
export const initialContracts=['work.plan','work.status','work.check','work.block','work.evidence.read','entity.query','scene.query','scene.entity.update','scene.primitive.create','scene.material.set','project.master.read','api.describe','api.search','context.read'];
export const domainTools={scene:['scene.example.create','scene.dimension.convert','scene.entities.update','scene.entity.delete','scene.entity.reparent'],scripting:['project.file.read','project.file.patch','project.files.edit','script.sdk.read','script.compile'],physics:['scene.collider.set','scene.rigidBody.set','gameTest.control'],lighting:['scene.light.set','scene.light2D.set','scene.rendering.update'],audio:['scene.audioSource.set','scene.audioListener.set','scene.audio.update','asset.query'],animation:['scene.animator.set','animation.query'],ui2d:['scene.ui2D.set','scene.sprite2D.set','scene.twoD.update','scene.dimension.convert'],files:['project.file.read','project.file.patch','project.files.edit'],pmd:['project.master.read','project.master.edit'],diagnostics:['diagnostics.query','diagnostics.explain','runtime.status','gameTest.control']};
export function toolFunctions(contracts,channel,allowed){
 const names=channel==='pmd'?['project.master.read','project.master.edit','project.master.transition','context.read']:Array.from(contracts).filter(n=>allowed.has(n)||privateToolSchemas[n]);
 const funcs=names.map(name=>({type:'function',name:functionName(name),description:(toolMap.get(name)?.description??'Axiom '+name)+'. Host pins project/workspace/revision; arguments are an object. '+(name==='work.plan'?'Record deliverables and checks once; use discussion mode for questions.':name==='work.check'?'Host evaluates expected authored/compile/runtime results before advancing.':''),strict:false,parameters:privateToolSchemas[name]??assistantSchema(name)}));
 if(channel!=='pmd')funcs.push({type:'function',name:'axiom_batch',description:'Up to 12 sequential operations using the typed contracts above; arguments is an object. References {$ref:"0.entityId"} refer to previous results. Stops on error; never repeat successful writes.',strict:false,parameters:{type:'object',additionalProperties:false,properties:{operations:{type:'array',minItems:1,maxItems:12,items:{type:'object',additionalProperties:false,properties:{name:{type:'string',enum:names},arguments:{type:'object'}},required:['name','arguments']}}},required:['operations']}});
 return funcs;
}
export function normalizeCall(call,contracts){
 if(call.name==='axiom_tool')return {...call,legacy:call.legacy!==false}; // Existing retained trajectories can resume.
 if(call.name==='axiom_batch'){const a=JSON.parse(call.arguments);return {...call,legacy:typeof a.operations==='string',arguments:JSON.stringify({operations:typeof a.operations==='string'?a.operations:JSON.stringify(a.operations)})};}
 const name=[...contracts,...Object.keys(privateToolSchemas)].find(n=>functionName(n)===call.name);if(!name)throw Error('Tool contract is not loaded; describe an available tool first');
 return {...call,legacy:false,name:'axiom_tool',arguments:JSON.stringify({name,arguments:call.arguments})};
}
