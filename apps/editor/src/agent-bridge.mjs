// Sync only snapshots accepted by the same public editor path; renderer owns pixels.
export function startAgentBridge({api,projectEditor,getRenderer,getSnapshot,takeErrors,reportError,onProposals=()=>{}}){
 const clientId=crypto.randomUUID();let stopped=false,capture=null,diagnostic=null,timer;
 async function poll(){
  try{
   const snapshot=getSnapshot(),renderer=getRenderer();
   const result=await api('/v1/editor/sync',{method:'POST',body:JSON.stringify({clientId,workspaceId:snapshot?.workspaceId??null,sceneRevision:snapshot?.sceneRevision??-1,status:renderer?.status()??{},errors:takeErrors(),capture,diagnostic})});capture=null;diagnostic=null;onProposals(result.proposals??[]);
   if(result.snapshot)await projectEditor.synchronize(result.snapshot);
   if(result.capture){const requestId=result.capture.requestId;try{capture={requestId,value:await getRenderer().capture(result.capture)};}catch(error){capture={requestId,error:error.message};}}
   if(result.diagnostic){diagnostic={requestId:result.diagnostic.requestId,value:getRenderer().explain(result.diagnostic)};}
  }catch(error){if(!stopped&&error.data?.code!=='AX_AGENT_0002')reportError(error);}
  finally{if(!stopped)timer=setTimeout(poll,300);}
 }
 void poll();return ()=>{stopped=true;clearTimeout(timer);};
}
