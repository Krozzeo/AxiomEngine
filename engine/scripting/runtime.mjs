export class ScriptRuntime {
 constructor({WorkerClass=Worker,workerUrl='./script-worker.js'}={}) {
  this.worker=new WorkerClass(workerUrl,{type:'module'});this.next=0;this.pending=null;this.closed=false;
  this.worker.onmessage=({data})=>{const request=this.pending;if(!request||data.id!==request.id)return;this.pending=null;clearTimeout(request.timer);data.error?request.reject(new Error(data.error)):request.resolve(data.result??data);};
  this.worker.onerror=event=>{this.dispose(new Error(event.message??'Script worker failed'));};
 }
 request(data,timeout=2000) {
  if(this.closed)return Promise.reject(new Error('AX_SCRIPT_0002: runtime disposed'));
  if(this.pending)return Promise.reject(new Error('AX_SCRIPT_0002: runtime request already pending'));
  return new Promise((resolve,reject)=>{
   const id=++this.next,timer=setTimeout(()=>this.dispose(new Error('AX_SCRIPT_0004: script execution timed out')),timeout);
   this.pending={id,resolve,reject,timer};this.worker.postMessage({...data,id});
  });
 }
 initialize(url){return this.request({type:'initialize',url},60000);}
 execute(request){return this.request({type:'execute',request});}
 dispose(error=new Error('AX_SCRIPT_0002: runtime disposed')) {
  if(this.closed)return;this.closed=true;this.worker.terminate();
  if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(error);this.pending=null;}
 }
}
