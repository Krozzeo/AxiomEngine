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
  if(['gameTest.control','profiler.query','profiler.explainFrameSpike','audio.query','audio.control','animation.query','animation.control','scene.query','entity.query','asset.query','renderer.capture','diagnostics.explain'].includes(type)&&(!project||data.id!==project.id))throw agentError('AX_SCENE_0001','Open this project first');
  if(['gameTest.control','profiler.query','profiler.explainFrameSpike','audio.query','audio.control','animation.query','animation.control','entity.query','asset.query','renderer.capture','diagnostics.explain'].includes(type))w.check(data);
  switch(type){
   case 'gameTest.control':return this.bridge.gameTest(data);
   case 'project.query':return page((await w.store.run('project.list',{})).projects,data,{activeProjectId:project?.id??null});
   case 'scene.query':return bounded({...summary,sceneId:project.scene.id,entityCount:project.scene.entities.length,assetCount:project.scene.assets?.length??0,camera:project.scene.camera??null,twoD:project.scene.twoD??null,script:project.scene.script?{attachments:project.scene.script.attachments.length,build:project.scene.script.build.id}:null},data.maxBytes);
   case 'asset.query':return page((project.scene.assets??[]).filter(a=>!data.name||a.name.toLowerCase().includes(data.name.toLowerCase())),data,{sceneRevision:w.revision});
   case 'entity.query':return page(project.scene.entities.filter(e=>(!data.entityId||e.id===data.entityId)&&(!data.name||e.name.toLowerCase().includes(data.name.toLowerCase()))&&(!data.component||data.component==='Transform'||!!e[({AudioSource:'audioSource',AudioListener:'audioListener',Animator:'animator',Sprite2D:'sprite2D',SpriteAnimation:'spriteAnimation',Tilemap:'tilemap',Light2D:'light2D',Particles2D:'particles2D',UI2D:'ui2D',Renderable:'renderable',Collider:'collider',RigidBody:'rigidBody',Material:'material',Light:'light',LOD:'lod'})[data.component]])),data,{sceneRevision:w.revision});
   case 'animation.control':return this.bridge.animation(data);
   case 'profiler.query':return bounded(await this.bridge.profiler({...data,action:'history'}),data.maxBytes??16384);
   case 'profiler.explainFrameSpike':return bounded(await this.bridge.profiler({...data,action:'explain'}),16384);
   case 'audio.control':return this.bridge.audio(data);
   case 'audio.query':{const s=this.bridge.status(),matching=s.connected&&!s.audioFault&&s.projectId===project.id&&s.sceneRevision===w.revision&&(s.workspaceId??null)===(data.workspaceId??null);return matching?page((s.audio?.sources??[]).filter(i=>!data.entityId||i.entityId===data.entityId),data,{status:'observed',frame:s.frame,traceId:s.traceId,generation:s.generation,sceneRevision:w.revision,mixer:s.audio?.mixer,listener:s.audio?.listener,backend:s.audio?.backend,contextState:s.audio?.contextState,masterRms:s.audio?.masterRms,stereoRms:s.audio?.stereoRms,decodedBytes:s.audio?.decodedBytes,reads:s.audio?.reads}):{status:'unavailable',message:'A live editor at this revision is required',items:[]};}
   case 'animation.query':{const s=this.bridge.status(),matching=s.connected&&!s.animationFault&&s.projectId===project.id&&s.sceneRevision===w.revision&&(s.workspaceId??null)===(data.workspaceId??null);return matching?page((s.animation??[]).filter(i=>!data.entityId||i.entityId===data.entityId),data,{status:'observed',frame:s.frame,traceId:s.traceId,generation:s.generation,sceneRevision:w.revision}):{status:'unavailable',message:'A live editor at this revision is required',items:[]};}
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
    else {const key={AudioSource:'audioSource',AudioListener:'audioListener',Animator:'animator',Sprite2D:'sprite2D',SpriteAnimation:'spriteAnimation',Tilemap:'tilemap',Light2D:'light2D',Particles2D:'particles2D',UI2D:'ui2D',Transform:'transform',Renderable:'renderable',Collider:'collider',RigidBody:'rigidBody',Material:'material',Light:'light',LOD:'lod'}[data.name];if(key)value={name:data.name,required:key==='transform',schema:projectSchema.properties.scene.properties.entities.items.properties[key]};}
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
