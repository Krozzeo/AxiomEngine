import {validateTest} from '../testing/session.mjs';
export const replayError=message=>Object.assign(Error('AX_REPLAY_0001: '+message),{code:'AX_REPLAY_0001'});
// Checkpoints retain observable simulation state. Restoration reconstructs the
// bounded input prefix, including private script fields, then verifies equality.
// No arbitrary .NET heap serialization or GPU/audio-clock replay is claimed.
export function canonicalReplayState(state){
 const entities=state.entities.map(e=>({id:e.id,transform:e.transform,rigidBody:e.rigidBody??null})).sort((a,b)=>a.id.localeCompare(b.id));
 const physics=state.physics?{bodies:state.physics.bodies,contacts:state.physics.contacts,steps:state.physics.steps}:null;
 const result={entities,physics,animation:state.animation??[],time:state.time??0};
 if(entities.length>64||JSON.stringify(result).length>96000)throw replayError('Checkpoint state exceeds budget');
 return structuredClone(result);
}
export class ReplaySession {
 constructor(adapter){this.adapter=adapter;this.recording=null;this.job=null;this.flight=null;this.active=false;}
 control(args){
  if(args.action==='query')return this.result();
  if(args.action==='cancel'){if(this.active)this.job.cancel=true;return this.result();}
  if(args.action==='clear'){if(this.active)throw replayError('Cancel before clearing');this.recording=null;this.job=null;return this.result();}
  if(args.action==='export'){if(!this.recording)throw replayError('No recording');return {status:'completed',recording:structuredClone(this.recording)};}
  if(this.active||this.flight)throw replayError('Replay is already active');
  if(args.action==='import'){
   const r=validateRecording(args.recordingJson);if(JSON.stringify(r.scope)!==JSON.stringify(this.adapter.scope()))throw replayError('Imported recording does not match this project revision/resources');this.recording=r;this.job={status:'completed',kind:'import',frames:0,diagnostics:[]};return this.result();
  }
  if(args.action==='record'){
   const suite=validateTest(args.suite);const inputs=suite.steps.flatMap(s=>Array.from({length:s.frames},()=>[...new Set(s.keys??[])].sort()));
   if(!inputs.length||inputs.length>600)throw replayError('Record 1–600 frames');
   if(!Number.isSafeInteger(args.seed)||args.seed<0||args.seed>4294967295)throw replayError('Invalid uint32 random seed');
   const recording={version:1,id:crypto.randomUUID(),name:suite.name,scope:this.adapter.scope(),seed:args.seed,delta:1/60,inputs,checkpoints:[]};
   this.start('record',async()=>{await this.adapter.begin({seed:recording.seed});this.check(recording,0);for(let f=1;f<=inputs.length;f++){await this.advance(inputs[f-1]);if(f%60===0||f===inputs.length)this.check(recording,f);}this.recording=recording;});return this.result();
  }
  if(args.action==='replay'){
   const r=this.recording;if(!r)throw replayError('No recording');
   if(JSON.stringify(r.scope)!==JSON.stringify(this.adapter.scope()))throw replayError('Recording belongs to a different project revision or resource scope');
   const {from=0,to=r.inputs.length}=args;if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<=from||to>r.inputs.length)throw replayError('Invalid recorded frame range');
   const checkpoint=r.checkpoints.filter(c=>c.frame<=from).at(-1);this.start('replay',async()=>{await this.adapter.begin({seed:r.seed});this.verify(r,0);for(let f=1;f<=to;f++){await this.advance(r.inputs[f-1]);this.verify(r,f);if(f>=from&&this.job.diagnostics.length<32&&(f===from||f===to||f%15===0)){const d={frame:f,recordingId:r.id,sourceRevision:r.scope.sceneRevision,...this.adapter.diagnostic(args.diagnostic)};if(JSON.stringify([...this.job.diagnostics,d]).length<=196000)this.job.diagnostics.push(d);else this.job.omittedDiagnostics=(this.job.omittedDiagnostics??0)+1;};}this.job.range={from,to};this.job.checkpoint=checkpoint?.frame??0;this.job.restoration='verified input-prefix reconstruction';});return this.result();
  }
  throw replayError('Unknown replay action');
 }
 start(kind,execute){this.active=true;this.job={id:crypto.randomUUID(),kind,status:'running',frames:0,verifiedCheckpoints:0,diagnostics:[]};this.deadline=performance.now()+30000;this.flight=(async()=>{let outcome='completed';try{await execute();if(this.job.cancel)outcome='cancelled';}catch(error){outcome=this.job.cancel?'cancelled':'failed';this.job.error=String(error.message).slice(0,1024);}finally{try{await this.adapter.end();}catch(error){outcome='failed';this.job.error=String(error.message).slice(0,1024);}this.job.status=outcome;this.active=false;this.flight=null;}})();}
 async advance(keys){if(this.job.cancel)throw replayError('Cancelled');if(performance.now()>this.deadline)throw replayError('Active time budget exhausted');await this.adapter.step({delta:1/60,keys});this.job.frames++;if(this.job.cancel)throw replayError('Cancelled');}
 check(r,frame){const checkpoint={frame,state:canonicalReplayState(this.adapter.snapshot())};if(JSON.stringify({...r,checkpoints:[...r.checkpoints,checkpoint]}).length>240000)throw replayError('Recording exceeds 240 KiB; reduce scene or frames');r.checkpoints.push(checkpoint);}
 verify(r,frame){const c=r.checkpoints.find(c=>c.frame===frame);if(c){if(JSON.stringify(c.state)!==JSON.stringify(canonicalReplayState(this.adapter.snapshot())))throw replayError('Checkpoint divergence at frame '+frame);this.job.verifiedCheckpoints++;}}
 result(){return structuredClone({...(this.job??{status:'idle'}),cancel:undefined,recording:this.recording?{id:this.recording.id,name:this.recording.name,scope:this.recording.scope,seed:this.recording.seed,frames:this.recording.inputs.length,checkpoints:this.recording.checkpoints.map(c=>c.frame)}:null});}
}

export function validateRecording(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>240000)throw replayError('Recording file exceeds 240 KiB');
 let r;try{r=JSON.parse(text);}catch{throw replayError('Invalid recording JSON');}
 if(!r||r.version!==1||typeof r.id!=='string'||typeof r.name!=='string'||r.name.length>128||r.delta!==1/60||!Number.isSafeInteger(r.seed)||r.seed<0||r.seed>4294967295||!r.scope||!Array.isArray(r.inputs)||!r.inputs.length||r.inputs.length>600||!Array.isArray(r.checkpoints)||r.checkpoints.length<2||r.checkpoints.length>11)throw replayError('Invalid recording structure');
 for(const keys of r.inputs)validateTest({name:'Imported frame',steps:[{frames:1,keys}]});
 let previous=-1;for(const c of r.checkpoints){if(!Number.isSafeInteger(c.frame)||c.frame<=previous||c.frame>r.inputs.length||!c.state||!Array.isArray(c.state.entities)||!Array.isArray(c.state.animation)||!Number.isFinite(c.state.time))throw replayError('Invalid checkpoint');canonicalReplayState(c.state);previous=c.frame;}
 if(r.checkpoints[0].frame!==0||r.checkpoints.at(-1).frame!==r.inputs.length)throw replayError('Missing boundary checkpoints');
 return structuredClone(r);
}
