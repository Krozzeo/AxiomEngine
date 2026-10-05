const finite=v=>Number.isFinite(v)&&v>=0;
const median=values=>{const s=[...values].sort((a,b)=>a-b),n=s.length;return n?n%2?s[n>>1]:(s[n/2-1]+s[n/2])/2:null;};
export class FrameProfiler {
 #capacity;#frames=[];#records=[];#nextSequence=1;#dropped=0;#lease={};#paused=false;#captures=[];
 constructor(capacity=120){if(!Number.isInteger(capacity)||capacity<1||capacity>240)throw new RangeError('capacity must be between 1 and 240');this.#capacity=capacity;}
 reset(lease={}){if(this.#records.length){this.#captures.push(this.capture());if(this.#captures.length>8)this.#captures.shift();}this.#frames=[];this.#records=[];this.#dropped=0;this.#lease=structuredClone(lease);}
 capture(){return {format:'axiom-profiler-capture',version:1,id:crypto.randomUUID(),createdAt:new Date().toISOString(),lease:structuredClone(this.#lease),capacity:this.#capacity,dropped:this.#dropped,records:structuredClone(this.#records)};}
 captures(){return structuredClone(this.#captures);}
 static fromCapture(capture){
  if(!capture||capture.format!=='axiom-profiler-capture'||capture.version!==1||typeof capture.id!=='string'||capture.id.length>128||!capture.lease||typeof capture.lease!=='object'||!Array.isArray(capture.records)||capture.records.length>240||JSON.stringify(capture).length>1000000)throw Error('Invalid profiler capture');
  const result=new FrameProfiler(capture.capacity);result.#lease=structuredClone(capture.lease);result.#dropped=capture.dropped;result.#paused=true;
  let previous=0;
  for(const record of capture.records){if(!Number.isSafeInteger(record.frameSequence)||record.frameSequence<=previous||!finite(record.elapsedMs)||!finite(record.measuredMainMs)||record.gpuTimeMs!==null&&!finite(record.gpuTimeMs)||!Array.isArray(record.scopes)||record.scopes.length>24||!Array.isArray(record.gpuScopes)||record.gpuScopes.length>16||[...record.scopes,...record.gpuScopes].some(s=>typeof s.name!=='string'||!finite(s.milliseconds))||['projectId','workspaceId','sceneRevision','generation'].some(k=>(record[k]??null)!==(capture.lease[k]??null)))throw Error('Invalid profiler capture records');previous=record.frameSequence;}
  result.#records=structuredClone(capture.records);return result;
 }
 pause(value){this.#paused=!!value;}
 begin(cpuStartMs,traceId=crypto.randomUUID(),context={}){if(!finite(cpuStartMs))throw RangeError('Invalid frame start');return {frameSequence:this.#nextSequence++,traceId,cpuStartMs,cpuTimeMs:null,gpuTimeMs:null,stages:['frame.begin'],scopes:[],profileContext:{...this.#lease,...context}};}
 scope(frame,name,start,end,kind='main'){if(!/^[a-z][a-z0-9.-]{0,63}$/.test(name)||!finite(start)||!finite(end)||end<start||!['main','worker','wall'].includes(kind)||frame.scopes.length>=24)throw RangeError('Invalid profiler scope');frame.scopes.push({name,kind,milliseconds:end-start});}
 finish(frame,cpuEndMs,renderer='webgpu'){
  if(!finite(cpuEndMs)||cpuEndMs<frame.cpuStartMs)throw RangeError('Invalid frame end');frame.cpuTimeMs=cpuEndMs-frame.cpuStartMs;frame.elapsedMs=frame.cpuTimeMs;
  frame.measuredMainMs=frame.scopes.filter(s=>s.kind==='main').reduce((n,s)=>n+s.milliseconds,0);frame.stages.push(renderer==='null'?'render.null':'render.submitted','frame.end');delete frame.cpuStartMs;
  if(!this.#paused){if(this.#records.length===this.#capacity){this.#records.shift();this.#dropped++;}this.#frames=[frame];this.#records.push({frameSequence:frame.frameSequence,traceId:frame.traceId,...frame.profileContext,renderer,elapsedMs:frame.elapsedMs,measuredMainMs:frame.measuredMainMs,scopes:structuredClone(frame.scopes),gpuTimeMs:null,gpuScopes:[],gpuReason:frame.gpuReason??(renderer==='null'?'Null renderer has no GPU timestamps':'Not sampled'),gpuStatus:frame.gpuReason==='Waiting for readback'?'pending':'unavailable'});}
  return frame;
 }
 attachGpuTiming(sequence,milliseconds,scopes=[],generation){if(!finite(milliseconds)||milliseconds>60000||scopes.length>16||scopes.some(s=>!finite(s.milliseconds)||typeof s.name!=='string'))return false;const frame=this.#frames.find(f=>f.frameSequence===sequence),r=this.#records.find(f=>f.frameSequence===sequence);if(!r||generation!==undefined&&r.generation!==generation||r.renderer==='null')return false;if(frame)frame.gpuTimeMs=milliseconds;r.gpuTimeMs=milliseconds;r.gpuScopes=structuredClone(scopes);r.gpuStatus='observed';r.gpuReason=null;if(frame)frame.stages.splice(-1,0,'gpu.timestamp.resolved');return true;}
 gpuUnavailable(sequence,reason,generation){const r=this.#records.find(f=>f.frameSequence===sequence);if(r&&r.generation===generation){r.gpuStatus='unavailable';r.gpuReason=reason;}}
 latest(){return this.#frames.at(-1)??null;}
 get dropped(){return this.#dropped;}
 summary(){const last=this.#records.at(-1);return {...this.#lease,retained:this.#records.length,capacity:this.#capacity,dropped:this.#dropped,paused:this.#paused,latestFrame:last?.frameSequence??null,latestElapsedMs:last?.elapsedMs??null,gpuSamples:this.#records.filter(f=>f.gpuStatus==='observed').length};}
 history({limit=16,beforeFrame=Infinity}={}){if(!Number.isInteger(limit)||limit<1||limit>20||beforeFrame!==Infinity&&(!Number.isSafeInteger(beforeFrame)||beforeFrame<1))throw RangeError('Invalid history bounds');const all=this.#records.filter(f=>f.frameSequence<beforeFrame);let items=all.slice(-limit);const result={status:'observed',...this.summary(),items:[],nextBefore:null,units:'milliseconds',cpuSemantics:'Main synchronous scopes; elapsed includes waits. Worker duration is synchronous dispatch wall time, not OS thread CPU.'};while(items.length&&new TextEncoder().encode(JSON.stringify({...result,items})).length>15000)items=items.slice(1);return {...result,items:structuredClone(items),nextBefore:all.length>items.length?items[0]?.frameSequence??null:null};}
 explainFrameSpike({frameSequence,metric='elapsed',baselineWindow=30}={}){
  if(!Number.isSafeInteger(frameSequence)||frameSequence<1||!['elapsed','main','gpu'].includes(metric)||!Number.isInteger(baselineWindow)||baselineWindow<8||baselineWindow>60)throw RangeError('Invalid spike query');
  const target=this.#records.find(f=>f.frameSequence===frameSequence),base={...this.#lease,frameSequence,metric};if(!target)return {status:'unavailable',...base,message:'Frame not retained in this session',contributors:[]};
  const field={elapsed:'elapsedMs',main:'measuredMainMs',gpu:'gpuTimeMs'}[metric];if(target[field]===null)return {status:'unavailable',...base,message:target.gpuReason,contributors:[]};
  const prior=this.#records.filter(f=>f.frameSequence<frameSequence&&f.view===target.view&&f.playing===target.playing&&f.route===target.route&&f[field]!==null).slice(-baselineWindow);
  if(prior.length<8)return {status:'inconclusive',...base,target:structuredClone(target),message:'At least eight earlier comparable measured frames are required',baselineSamples:prior.length,contributors:[]};
  const center=median(prior.map(f=>f[field])),mad=median(prior.map(f=>Math.abs(f[field]-center))),threshold=Math.max(center*2,center+5,center+6*mad),spike=target[field]>threshold;
  const values=metric==='gpu'?target.gpuScopes:target.scopes.filter(s=>metric!=='main'||s.kind==='main');
  const contributors=values.map(s=>{const samples=prior.map(f=>(metric==='gpu'?f.gpuScopes:f.scopes).find(v=>v.name===s.name&&v.kind===s.kind)?.milliseconds??0),normal=median(samples);return {...s,baselineMs:normal,deltaMs:s.milliseconds-normal,overlap:s.kind==='worker'||s.name==='script.roundtrip'?'Worker dispatch is contained in script roundtrip; these durations must not be added together':null};}).filter(s=>s.deltaMs>.1).sort((a,b)=>b.deltaMs-a.deltaMs).slice(0,8);
  return {status:'explained',...base,traceId:target.traceId,target:structuredClone(target),baseline:{samples:prior.length,firstFrame:prior[0].frameSequence,lastFrame:prior.at(-1).frameSequence,medianMs:center,madMs:mad,thresholdMs:threshold},spike,deltaMs:target[field]-center,contributors,message:spike?'Measured spike compared with earlier frames; contributors show observed increases, not speculative causes':'No spike under the median/MAD threshold',limitations:['Synchronous timings include scheduling/preemption','GPU sum covers instrumented passes, excludes queue wait and uninstrumented skin compute','Elapsed intervals and remote worker scopes can overlap']};
 }
}
