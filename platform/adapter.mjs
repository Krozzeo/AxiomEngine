import {readFile,lstat,realpath,readdir} from 'node:fs/promises';
import {resolve,relative,dirname,sep,isAbsolute,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import manifest from './product.json' with {type:'json'};
import {acquireLease} from './lease.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {startServer} from '../daemon/bootstrap/server.mjs';

const fail=(code,message)=>{throw Object.assign(Error(message),{code});};
export class GameEngineAdapter {
  constructor(){this.receipts=new Map();}
  async path(value,directory=false){
    if(typeof value!=='string'||value.length>2048)fail('invalidRequest','A local project path is required.');
    const path=resolve(value),real=await realpath(path),rel=relative(this.root,real),info=await lstat(path);
    if(isAbsolute(rel)||rel==='..'||rel.startsWith('..'+sep)||info.isSymbolicLink()||!(directory?info.isDirectory():info.isFile()&&info.nlink===1))fail('permissionDenied','Project path is outside the authorized root or is not an ordinary file.');
    return real;
  }
  async detect(value){
    const path=await this.path(value),info=await lstat(path);
    if(info.size>4*1024*1024)fail('invalidRequest','Project exceeds the supported size.');
    let doc;try{doc=JSON.parse(await readFile(path,'utf8'));}catch{fail('invalidRequest','Project JSON cannot be parsed.');}
    if(doc.schemaVersion!==1 || doc.axiom?.applicationId && doc.axiom.applicationId!=='game-engine')fail('incompatibleVersion','Unsupported Game Engine project format (version 1). No migration was attempted.');
    await new ProjectStore(dirname(path)).read(path);
    return {path,projectId:doc.id,formatId:'axiom.game-project',formatVersion:1};
  }
  async handle(method,params={}){
    if(method==='initialize'){
      if(this.root)fail('invalidRequest','Session already initialized.');
      if(!/^0\.1\.\d+$/.test(params.platformVersion))fail('incompatibleVersion','Game Engine requires Platform API 0.1.');
      this.root=await realpath(params.authorizedRoot);
      return {protocolVersion:1,productId:manifest.productId,productVersion:manifest.productVersion,capabilities:manifest.capabilities};
    }
    if(!this.root)fail('invalidRequest','Initialize this session first.');
    if(!manifest.capabilities.includes(method))fail('unsupportedCapability','Unsupported product capability.');
    if(method==='project.detect')return this.detect(params.path);
    if(method==='project.open'||method==='project.create'){
      if(this.runtime)fail('projectBusy','A project is already active in this session.');
      const creating=method==='project.create',entry=creating?null:await this.detect(params.path);
      const folder=creating?await this.path(params.path,true):dirname(entry.path);
      if(creating&&(await readdir(folder)).length!==0)fail('projectBusy','New projects require an empty directory.');
      this.release=await acquireLease(folder,this.sessionId);
      try{
        this.runtime=await startServer({projectRoot:folder,platformSession:true});
        const status=creating?await this.runtime.platform.create(params.name):await this.runtime.platform.open(entry.projectId);
        this.projectId=status.projectId;
        return {path:join(folder,status.projectId.slice('project://'.length)+'.json'),status,editorUrl:this.runtime.editorUrl};
      }catch(error){await this.shutdown();throw error;}
    }
    if(!this.runtime)fail('operationFailed','Open a project before using this capability.');
    if(method==='project.status')return this.runtime.platform.status();
    if(method==='project.save')return this.runtime.platform.save(params.expectedRevision);
    if(method==='project.close'){
      const result=await this.runtime.platform.close(params.expectedRevision,params.decision);
      if(result.closed)await this.shutdown();return result;
    }
  }
  async request(message){
    if(message?.protocolVersion!==1||typeof message.requestId!=='string'||typeof message.sessionId!=='string')fail('incompatibleVersion','Unsupported IPC envelope.');
    if(message.productId!==manifest.productId||message.correlationId!==message.requestId||message.actor?.kind!=='human')fail('permissionDenied','Invalid product identity, actor or correlation.');
    if(message.projectId&&this.projectId!==message.projectId)fail('permissionDenied','Foreign project identity.');
    if(this.sessionId&&this.sessionId!==message.sessionId)fail('permissionDenied','Foreign product session.');
    this.sessionId=message.sessionId;
    const mutates=['project.create','project.open','project.save','project.close'].includes(message.method);
    const id=message.params?.operationId,key=JSON.stringify([message.method,message.params]);
    if(mutates){
      if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(id))fail('invalidRequest','A unique operationId is required.');
      const prior=this.receipts.get(id);
      if(prior){if(prior.key!==key)fail('invalidRequest','Operation ID reused with different arguments.');if(prior.error)throw prior.error;return structuredClone(prior.result);}
      if(this.receipts.size>=256)fail('projectBusy','Session receipt limit reached.');
    }
    try{const result=await this.handle(message.method,message.params);if(mutates)this.receipts.set(id,{key,result:structuredClone(result)});return result;}
    catch(error){if(mutates)this.receipts.set(id,{key,error});throw error;}
  }
  async shutdown(){const runtime=this.runtime;this.runtime=null;try{await runtime?.close();}finally{await this.release?.();this.release=null;}}
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  if(!process.send)throw Error('Launch this adapter through the registered Platform IPC host.');
  const adapter=new GameEngineAdapter();let queue=Promise.resolve(),closing=false;
  process.on('message',message=>{
    if(closing)return;
    queue=queue.then(async()=>{
      let reply;
      try{reply={ok:true,result:await adapter.request(message)};}catch(error){
        const map={AX_PROJECT_0004:'projectBusy',AX_PROJECT_0003:'revisionConflict',AX_SCENE_0002:'revisionConflict',AX_FS_0001:'permissionDenied'},code=map[error.code]??error.code;
        const known=['incompatibleVersion','unsupportedCapability','permissionDenied','projectBusy','revisionConflict','cancelled','operationFailed','invalidRequest'];
        reply={ok:false,error:{code:known.includes(code)?code:'operationFailed',message:known.includes(code)?error.message:'Game Engine could not complete the operation. Inspect its project and diagnostics.'}};
      }
      if(process.connected)process.send({protocolVersion:1,requestId:message?.requestId,correlationId:message?.correlationId,sessionId:message?.sessionId,productId:manifest.productId,...reply});
    }).catch(()=>{});
  });
  const stop=()=>{if(closing)return;closing=true;void queue.finally(()=>adapter.shutdown()).finally(()=>process.exit(0));};
  process.on('disconnect',stop);process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
