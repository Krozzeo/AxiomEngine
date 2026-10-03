import {tools,toolMap,validate,bounded,page,agentError} from './contracts.mjs';
import errors from '../../../protocol/error-catalog.json' with {type:'json'};
import projectSchema from '../../../protocol/schema/project-document.schema.json' with {type:'json'};
export class AgentService {
 constructor({workspace,bus,bridge}){Object.assign(this,{workspace,bus,bridge});}
 has(type){return toolMap.get(type)?.route==='agent';}
 async run(type,data,context){
  const tool=toolMap.get(type);validate(tool.inputSchema,data);
  if(type.startsWith('workspace.'))return this.proposals.run(type,data,context);
  const w=data.workspaceId?this.proposals.get(data.workspaceId).child:this.workspace,project=w.project,summary={project:project?{id:project.id,name:project.name,revision:project.revision}:null,sceneRevision:w.revision,dirty:w.dirty,playing:w.playing};
  if(['scene.query','entity.query','asset.query','renderer.capture','diagnostics.explain'].includes(type)&&(!project||data.id!==project.id))throw agentError('AX_SCENE_0001','Open this project first');
  if(['entity.query','asset.query','renderer.capture','diagnostics.explain'].includes(type))w.check(data);
  switch(type){
   case 'project.query':return page((await w.store.run('project.list',{})).projects,data,{activeProjectId:project?.id??null});
   case 'scene.query':return bounded({...summary,sceneId:project.scene.id,entityCount:project.scene.entities.length,assetCount:project.scene.assets?.length??0,camera:project.scene.camera??null,script:project.scene.script?{attachments:project.scene.script.attachments.length,build:project.scene.script.build.id}:null},data.maxBytes);
   case 'asset.query':return page((project.scene.assets??[]).filter(a=>!data.name||a.name.toLowerCase().includes(data.name.toLowerCase())),data,{sceneRevision:w.revision});
   case 'entity.query':return page(project.scene.entities.filter(e=>(!data.entityId||e.id===data.entityId)&&(!data.name||e.name.toLowerCase().includes(data.name.toLowerCase()))&&(!data.component||data.component==='Transform'||!!e[({Renderable:'renderable',Collider:'collider',RigidBody:'rigidBody'})[data.component]])),data,{sceneRevision:w.revision});
   case 'runtime.status':return bounded({...summary,editor:this.bridge.status()},data.maxBytes);
   case 'renderer.capture':return this.bridge.capture(data);
   case 'events.query':return this.bus.eventPage(data);
   case 'diagnostics.query':return this.bus.errorPage(data);
   case 'diagnostics.explain':return bounded(await this.bridge.explain(data),16384);
   case 'api.search':return page(tools.filter(t=>t.mcp&&(!data.query||(t.name+' '+t.description).toLowerCase().includes(data.query.toLowerCase()))).map(t=>({name:t.name,description:t.description,mutates:t.mutates})),data);
   case 'api.describe':{
    let value;
    if(data.kind==='tool'){value=toolMap.get(data.name);if(!value?.mcp)value=null;}
    else if(data.kind==='error')value=errors.errors.find(e=>e.code===data.name);
    else {const key={Transform:'transform',Renderable:'renderable',Collider:'collider',RigidBody:'rigidBody'}[data.name];if(key)value={name:data.name,required:key==='transform',schema:projectSchema.properties.scene.properties.entities.items.properties[key]};}
    if(!value)throw agentError('AX_AGENT_0004','Requested API is unavailable');return bounded(value,data.maxBytes);
   }
   default:throw agentError('AX_AGENT_0004','Tool unavailable');
  }
 }
}
export function compactResult(event){
 if(event.kind==='error')return event;
 const d=event.payload.data;
 if(d&&Object.hasOwn(d,'project'))return {...event,payload:{...event.payload,data:{project:d.project?{id:d.project.id,name:d.project.name,revision:d.project.revision}:null,sceneRevision:d.sceneRevision,dirty:d.dirty,playing:d.playing,entityCount:d.project?.scene?.entities.length??0}}};
 return event;
}
