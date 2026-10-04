export const diagnosticKinds=['whyNotRendered','whyNotColliding','whyAssetNotLoaded','whyScriptNotRunning'];
export class DecisionEvidence {
 constructor({limit=32,ttlMs=30000,clock=()=>Date.now()}={}){this.limit=limit;this.ttlMs=ttlMs;this.clock=clock;this.deep=false;this.frames=new Map();this.current=null;}
 setDeep(enabled){this.deep=!!enabled;if(!this.deep)this.frames.clear();}
 record(value){this.current={...value,at:this.clock()};if(this.deep){this.frames.set(value.traceId,structuredClone(this.current));while(this.frames.size>this.limit)this.frames.delete(this.frames.keys().next().value);}}
 query(args){const evidence=args.traceId?this.frames.get(args.traceId):this.current;
  if(!evidence)return unavailable(args.traceId?'AX_CAUSAL_0002':'AX_CAUSAL_0001','Evidence unavailable or evicted; enable Deep trace before reproducing.');
  if(this.clock()-evidence.at>this.ttlMs)return unavailable('AX_CAUSAL_0003','Evidence expired; reproduce the frame.');
  if(args.id&&evidence.projectId!==args.id||Object.hasOwn(args,'workspaceId')&&(evidence.workspaceId??null)!==(args.workspaceId??null))return unavailable('AX_CAUSAL_0004','Evidence belongs to another project or workspace.');
  if(args.expectedSceneRevision!==undefined&&evidence.sceneRevision!==args.expectedSceneRevision)return unavailable('AX_CAUSAL_0004','Evidence belongs to another scene revision.');
  return explainDecision(evidence,args);
 }
}
function unavailable(code,message){return {status:'unavailable',code,message,nodes:[],edges:[]};}
export function explainDecision(e,args){
 if(!diagnosticKinds.includes(args.kind))return unavailable('AX_CAUSAL_0001','Unknown diagnostic query.');
 const nodes=[],add=(code,message,facts={})=>{nodes.push({id:'decision-'+nodes.length,code,message,facts});};
 const entity=e.entities.find(x=>x.id===args.entityId),asset=e.assets.find(x=>x.id===(args.assetId??entity?.assetId));let status='explained';
 add('AX_CAUSAL_0100','Evidence scope',{traceId:e.traceId,projectId:e.projectId,workspaceId:e.workspaceId??null,sceneRevision:e.sceneRevision,frame:e.frame,view:e.view,playing:e.playing});
 if(args.kind==='whyAssetNotLoaded'){
  if(!asset)add('AX_CAUSAL_0101','Asset is not registered in this scene',{assetId:args.assetId});
  else if(asset.error)add('AX_CAUSAL_0102','Asset loading failed',{assetId:asset.id,error:asset.error});
  else if(!asset.loaded)add('AX_CAUSAL_0103','Asset is not referenced by a drawable entity; no load was requested',{assetId:asset.id});
  else add('AX_CAUSAL_0104','Asset is loaded',{assetId:asset.id,kind:asset.kind});
 }else if(args.kind==='whyNotRendered'){
  if(entity?.renderDecision)add('AX_CAUSAL_0140','Production renderer decision reference; GPU aggregate samples do not prove per-entity pixels',entity.renderDecision);
  if(!entity)add('AX_CAUSAL_0105','Entity is absent from this frame',{entityId:args.entityId});
  else if(!entity.renderable)add('AX_CAUSAL_0106','Entity has no Renderable component',{entityId:entity.id});
  else if(!asset||asset.error||!asset.loaded)add('AX_CAUSAL_0102','Renderable resource is unavailable',{assetId:entity.assetId,error:asset?.error??'No loaded asset'});
  else if(entity.kind!==asset.kind)add('AX_CAUSAL_0107','Renderable kind does not match the loaded asset',{expected:entity.kind,actual:asset.kind});
  else if(e.renderer==='null')add('AX_CAUSAL_0108','Null renderer submits no pixels',{renderer:e.renderer});
  else if(entity.degenerate)add('AX_CAUSAL_0109','Transform collapses drawable geometry',{scale:entity.scale});
  else if(!entity.inFrustum&&e.rendering?.culling!=='none')add('AX_CAUSAL_0110','Geometry is entirely outside a camera clip plane',{camera:e.camera,view:e.view});
  else{add('AX_CAUSAL_0111','Renderer admitted geometry; submitted draws do not prove visible pixels',{entityId:entity.id,drawCount:entity.drawCount});add('AX_CAUSAL_0112','Pixel visibility is not proven: depth occlusion, partial clipping and texture alpha require pixel evidence');status='inconclusive';}
 }else if(args.kind==='whyScriptNotRunning'){
  if(!e.script?.attached)add('AX_CAUSAL_0113','No compiled script is attached to this scene');
  else if(args.entityId&&!e.script.attachments.includes(args.entityId))add('AX_CAUSAL_0114','Script is not attached to this entity',{attachments:e.script.attachments});
  else if(!e.playing)add('AX_CAUSAL_0115','Simulation is stopped; Game preview does not execute scripts');
  else if(e.script.fault)add('AX_CAUSAL_0116','Script runtime failed',{error:e.script.fault});
  else if(!e.script.active){add('AX_CAUSAL_0117','No active script runtime at this frame');status='inconclusive';}
  else add('AX_CAUSAL_0118','Script runtime is active',{buildId:e.script.buildId});
 }else{
  const other=e.entities.find(x=>x.id===args.otherId),a=entity?.collider,b=other?.collider;
  if(!entity||!other)add('AX_CAUSAL_0105','One or both entities are absent',{entityId:args.entityId,otherId:args.otherId});
  else if(!a||!b)add('AX_CAUSAL_0119','One or both entities have no Collider',{first:!!a,second:!!b});
  else if(!e.playing)add('AX_CAUSAL_0115','Simulation is stopped; collision detection does not run');
  else if(a.dimension!==b.dimension)add('AX_CAUSAL_0120','Colliders belong to different physics dimensions',{first:a.dimension,second:b.dimension});
  else if(!((a.layer&b.mask)&&(b.layer&a.mask)))add('AX_CAUSAL_0121','Layer/mask filter rejects this pair',{first:{layer:a.layer,mask:a.mask},second:{layer:b.layer,mask:b.mask}});
  else if(!e.physics){add('AX_CAUSAL_0122','Physics evidence unavailable at this frame');status='inconclusive';}
  else{
   const contact=e.physics?.contacts?.find(c=>(c.a===entity.id&&c.b===other.id)||(c.b===entity.id&&c.a===other.id));
   if(contact)add(contact.trigger?'AX_CAUSAL_0123':'AX_CAUSAL_0124',contact.trigger?'Trigger contact observed; no collision impulse is applied':'Collision contact observed',{contact});
   else{add('AX_CAUSAL_0125','No contact for this pair in the retained physics frame',{steps:e.physics?.steps??0,omittedContacts:e.physics?.omittedContacts??0});status='inconclusive';}
  }
 }
 return {status,code:nodes.at(-1).code,message:nodes.at(-1).message,projectId:e.projectId,workspaceId:e.workspaceId??null,traceId:e.traceId,correlationId:e.correlationId??null,causationId:e.causationId??null,sceneRevision:e.sceneRevision,nodes,edges:nodes.slice(1).map((n,i)=>({from:nodes[i].id,to:n.id}))};
}
