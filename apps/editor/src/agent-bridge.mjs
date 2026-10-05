// Sync only snapshots accepted by the same public editor path; renderer owns pixels.
export function startAgentBridge({api,projectEditor,getRenderer,getSnapshot,takeErrors,reportError,onProposals=()=>{}}){
 const clientId=crypto.randomUUID();let stopped=false,capture=null,diagnostic=null,animation=null,audio=null,profiler=null,gameTest=null,replay=null,timer;
 async function poll(){
  try{
   const snapshot=getSnapshot(),renderer=getRenderer();
   const result=await api('/v1/editor/sync',{method:'POST',body:JSON.stringify({clientId,workspaceId:snapshot?.workspaceId??null,sceneRevision:snapshot?.sceneRevision??-1,status:renderer?.status()??{},errors:takeErrors(),capture,diagnostic,animation,audio,profiler,gameTest,replay})});capture=null;diagnostic=null;animation=null;audio=null;profiler=null;gameTest=null;replay=null;onProposals(result.proposals??[]);
   if(result.snapshot)await projectEditor.synchronize(result.snapshot);
   if(result.replay){const requestId=result.replay.requestId;try{replay={requestId,value:getRenderer().replayControl(result.replay)};}catch(error){replay={requestId,error:error.message};}}
   if(result.gameTest){const requestId=result.gameTest.requestId;try{gameTest={requestId,value:getRenderer().gameTestControl(result.gameTest)};}catch(error){gameTest={requestId,error:error.message};}}
   if(result.animation){const requestId=result.animation.requestId;try{animation={requestId,value:getRenderer().animationControl(result.animation)};}catch(error){animation={requestId,error:error.message};}}
   if(result.profiler){const requestId=result.profiler.requestId;try{profiler={requestId,value:getRenderer().profilerQuery(result.profiler)};}catch(error){profiler={requestId,error:error.message};}}
   if(result.audio){const requestId=result.audio.requestId;try{audio={requestId,value:getRenderer().audioControl(result.audio)};}catch(error){audio={requestId,error:error.message};}}
   if(result.capture){const requestId=result.capture.requestId;try{capture={requestId,value:await getRenderer().capture(result.capture)};}catch(error){capture={requestId,error:error.message};}}
   if(result.diagnostic){diagnostic={requestId:result.diagnostic.requestId,value:getRenderer().explain(result.diagnostic)};}
  }catch(error){if(!stopped&&error.data?.code!=='AX_AGENT_0002')reportError(error);}
  finally{if(!stopped)timer=setTimeout(poll,300);}
 }
 void poll();return ()=>{stopped=true;clearTimeout(timer);void api('/v1/editor/disconnect',{method:'POST',keepalive:true,body:JSON.stringify({clientId})}).catch(()=>{});};
}
