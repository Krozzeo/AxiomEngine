import {randomUUID} from 'node:crypto';
import {agentError,size} from './contracts.mjs';
// One short-lived editor lease. Capture requests are never satisfied by stale reports.
export class EditorBridge {
 constructor(workspace,onError,{timeoutMs=5000,leaseMs=5000}={}){this.workspace=workspace;this.onError=onError;this.timeoutMs=timeoutMs;this.leaseMs=leaseMs;this.client=null;this.pending=null;}
 status(){const live=this.client&&Date.now()-this.client.at<this.leaseMs;return {connected:!!live,...(live?{...this.client.status,clientId:this.client.id}:{})};}
 sync(data){
  if(!data||typeof data.clientId!=='string'||!/^[0-9a-f-]{36}$/.test(data.clientId)||size(data)>850000)throw agentError('AX_AGENT_0001','Invalid editor report');
  if(this.client&&this.client.id!==data.clientId&&Date.now()-this.client.at<this.leaseMs)throw agentError('AX_AGENT_0002','Another editor owns the renderer lease');
  const s=data.status??{};
  if(size(s)>65536)throw agentError('AX_AGENT_0001','Editor status exceeds limit');
  this.client={id:data.clientId,at:Date.now(),status:{workspaceId:s.workspaceId??null,sceneRevision:s.sceneRevision??null,projectId:s.projectId??null,frame:s.frame??null,renderer:s.renderer??null,playing:!!s.playing,generation:s.generation??null,fault:typeof s.fault==='string'?s.fault.slice(0,2048):null}};
  for(const error of (Array.isArray(data.errors)?data.errors:[]).slice(0,16))this.onError({code:typeof error.code==='string'?error.code.slice(0,64):'AX_EDITOR_0001',cause:String(error.cause??'Editor failure').slice(0,2048),subsystem:'editor',traceId:error.traceId??null});
  if(data.capture&&this.pending&&this.pending.clientId===data.clientId&&data.capture.requestId===this.pending.id){
   const p=this.pending,c=data.capture;clearTimeout(p.timer);this.pending=null;
   try{
    if(c.error)throw agentError('AX_AGENT_0002',String(c.error).slice(0,512));
    const v=c.value;
    if((this.workspace.workspaceId??null)!==(p.args.workspaceId??null)||v?.workspaceId!== (p.args.workspaceId??null)||this.workspace.project?.id!==p.args.id||this.workspace.revision!==p.args.expectedSceneRevision||v?.sceneRevision!==p.args.expectedSceneRevision||v?.projectId!==p.args.id)throw agentError('AX_SCENE_0002','Capture revision is stale');
    if(v?.width!==p.args.width||v?.height!==p.args.height||typeof v?.base64!=='string'||v.base64.length>700000||!/^iVBORw0KGgo[A-Za-z0-9+/=]+$/.test(v.base64)||size(v.semantic)>16384)throw agentError('AX_AGENT_0001','Invalid capture payload');
    const png=Buffer.from(v.base64,'base64');if(png.length>512*1024||png.length<24||png.readUInt32BE(16)!==v.width||png.readUInt32BE(20)!==v.height)throw agentError('AX_AGENT_0001','Invalid PNG dimensions');
    p.resolve(v);
   }catch(error){p.reject(error);}
  }
  const snapshot=(data.workspaceId??null)!==(this.workspace.workspaceId??null)||data.sceneRevision!==this.workspace.revision?this.workspace.snapshot():null;
  return {snapshot,capture:this.pending?.clientId===data.clientId?{requestId:this.pending.id,...this.pending.args}:null};
 }
 capture(args){
  const status=this.status();
  if((status.workspaceId??null)!==(args.workspaceId??null)||!status.connected||status.renderer!=='webgpu'||status.projectId!==args.id||status.sceneRevision!==args.expectedSceneRevision)throw agentError('AX_AGENT_0002','A ready WebGPU editor at this scene revision is required');
  if(this.pending)throw agentError('AX_AGENT_0002','Capture already in progress');
  return new Promise((resolve,reject)=>{const pending={id:randomUUID(),clientId:this.client.id,args:{width:640,height:360,maxEntities:16,...args},resolve,reject};pending.timer=setTimeout(()=>{if(this.pending===pending)this.pending=null;reject(agentError('AX_AGENT_0002','Editor capture timed out'));},this.timeoutMs);this.pending=pending;});
 }
 close(){if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(agentError('AX_AGENT_0002','Editor bridge closed'));this.pending=null;}}
}
