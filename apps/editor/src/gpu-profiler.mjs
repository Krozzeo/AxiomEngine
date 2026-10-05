// At most one bounded asynchronous timestamp readback; no per-frame queue wait.
export function createGpuProfiler(device,onSample,onUnavailable){
 const enabled=!!device?.features?.has('timestamp-query');let pending=false,disposed=false;
 const set=enabled?device.createQuerySet({type:'timestamp',count:32}):null;
 const resolve=enabled?device.createBuffer({size:256,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}):null;
 const read=enabled?device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ}):null;
 function begin(sequence,generation){const selected=enabled&&!pending&&(sequence===1||sequence%10===0);let names=[],sent=false;
  return {reason:!device?'Null renderer has no GPU timestamps':!enabled?'timestamp-query is unavailable':!selected?'Not sampled / readback in flight':'Waiting for readback',
   writes(name){if(!selected||names.length>=16)return undefined;const index=names.length*2;names.push(name);return {querySet:set,beginningOfPassWriteIndex:index,endOfPassWriteIndex:index+1};},
   resolve(encoder){if(selected&&names.length){encoder.resolveQuerySet(set,0,names.length*2,resolve,0);encoder.copyBufferToBuffer(resolve,0,read,0,names.length*16);sent=true;pending=true;}},
   submitted(){if(!sent)return;read.mapAsync(GPUMapMode.READ).then(()=>{const data=new BigUint64Array(read.getMappedRange().slice(0,names.length*16));read.unmap();if(disposed)return;const scopes=names.map((name,i)=>({name,milliseconds:data[i*2+1]>=data[i*2]?Number(data[i*2+1]-data[i*2])/1e6:NaN}));if(scopes.some(s=>!Number.isFinite(s.milliseconds)||s.milliseconds>60000))onUnavailable(sequence,'Invalid GPU timestamp range',generation);else onSample(sequence,scopes.reduce((n,s)=>n+s.milliseconds,0),scopes,generation);}).catch(()=>{if(!disposed)onUnavailable(sequence,'GPU readback unavailable',generation);}).finally(()=>{pending=false;});}
  };
 }
 return {begin,dispose(){disposed=true;set?.destroy();resolve?.destroy();read?.destroy();}};
}
