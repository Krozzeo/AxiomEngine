import schema from '../../protocol/schema/game-test.schema.json' with {type:'json'};
export const testError=(message,code='AX_TEST_0001')=>Object.assign(Error(code+': '+message),{code});
export function validateTest(value,rule=schema,path='suite') {
 const fail=()=>{throw testError('Invalid '+path);};
 if(rule.type==='object'){if(!value||typeof value!=='object'||Array.isArray(value))fail();for(const k of rule.required??[])if(!Object.hasOwn(value,k))fail();for(const [k,v]of Object.entries(value)){if(!Object.hasOwn(rule.properties,k))fail();validateTest(v,rule.properties[k],path+'.'+k);}}
 if(rule.type==='array'){if(!Array.isArray(value)||value.length<(rule.minItems??0)||value.length>(rule.maxItems??100))fail();value.forEach(v=>validateTest(v,rule.items,path+'[]'));}
 if(rule.type==='string'&&(typeof value!=='string'||value.length<(rule.minLength??0)||value.length>(rule.maxLength??1000)||(rule.pattern&&!new RegExp(rule.pattern).test(value))))fail();
 if(['number','integer'].includes(rule.type)&&(!Number.isFinite(value)||rule.type==='integer'&&!Number.isSafeInteger(value)||value<(rule.minimum??-Infinity)||value>(rule.maximum??Infinity)))fail();
 if(rule.type==='boolean'&&typeof value!=='boolean')fail();if(rule.enum&&!rule.enum.includes(value))fail();
 if(rule===schema)for(const step of value.steps)for(const a of step.assertions??[]){const required={entityCount:['count'],position:['entityId','value'],rotation:['entityId','value'],collision:['entityId','otherId'],pixel:['x','y','rgba'],animation:['entityId','state']}[a.kind];if(required.some(k=>!Object.hasOwn(a,k))||a.kind==='collision'&&a.entityId===a.otherId)throw testError('Assertion requires its target and expected value');}
 return structuredClone(value);
}
export function assertRuntime(a,state) {
 let actual,expected,passed=false,reason;
 if(a.kind==='entityCount'){actual=state.entities.length;expected=a.count;passed=actual===expected;}
 if(a.kind==='position'||a.kind==='rotation'){const entity=state.entities.find(e=>e.id===a.entityId);actual=entity?.transform[a.kind];expected=a.value;passed=Array.isArray(expected)&&expected.length===(a.kind==='position'?3:4)&&actual?.every((v,i)=>Math.abs(v-expected[i])<=(a.tolerance??.001));if(!entity)reason='Entity missing';}
 if(a.kind==='collision'){actual=state.contacts.some(c=>[c.a,c.b].includes(a.entityId)&&[c.a,c.b].includes(a.otherId)&&(a.trigger===undefined||c.trigger===a.trigger));expected=a.expected??true;passed=actual===expected;}
 if(a.kind==='pixel'){actual=state.pixels?.[a.x+','+a.y];expected=a.rgba;reason=!state.pixels?'Pixels unavailable for Null renderer':undefined;passed=Array.isArray(expected)&&expected.length===4&&actual?.every((v,i)=>Math.abs(v-expected[i])<=(a.tolerance??8));}
 if(a.kind==='animation'){actual=state.animation.find(e=>e.entityId===a.entityId)?.state;expected=a.state;passed=typeof expected==='string'&&actual===expected;}
 return {kind:a.kind,passed:!!passed,actual:actual??null,expected:expected??null,...(reason?{reason}:{})};
}
// All adapters must own an isolated runtime, never an authored scene. Fixed delta
// governs simulation; GPU pixels and wall-clock/audio timing are not deterministic.
export class GameTestSession {
 constructor(adapter){this.adapter=adapter;this.job=null;this.active=false;this.flight=null;}
 control(args){const action=args.action;if(action==='query')return this.result();if(action==='cancel'){if(this.job?.status==='running'||this.job?.status==='paused'){this.job.cancel=true;this.job.status='cancelling';if(!this.flight)this.launch(()=>this.finish('cancelled'));}return this.result();}
 if(action==='finish'){if(!this.active||this.flight)throw testError('No paused session');this.launch(()=>this.finish('completed'));return this.result();}
 if(action==='run'||action==='begin'){if(this.active||this.flight)throw testError('A test session is already active');const suite=validateTest(args.suite);if(suite.steps.reduce((n,s)=>n+s.frames,0)>600||suite.steps.reduce((n,s)=>n+(s.assertions?.length??0),0)>48)throw testError('Suite exceeds total budget');this.job={id:crypto.randomUUID(),name:suite.name,status:'running',frames:0,results:[],delta:1/60,determinism:'fixed-delta CPU/Wasm and controlled input; no GPU, audio-clock or arbitrary C# wall-clock guarantee'};this.active=true;this.deadline=performance.now()+30000;this.launch(async()=>{await this.adapter.begin();if(this.job.cancel)throw testError('Cancelled','AX_TEST_0002');if(action==='begin'){this.job.status='paused';return;}for(const step of suite.steps)await this.step(step);await this.finish('completed');});return this.result();}
 if(action==='step'){if(!this.active||this.flight||this.job.status!=='paused')throw testError('Begin a paused session first');const step=validateTest({name:'Step',steps:[args.step]}).steps[0];this.job.status='running';this.deadline=performance.now()+30000;this.launch(async()=>{await this.step(step);this.job.status='paused';});return this.result();}throw testError('Unknown test action');}
 launch(fn){this.flight=(async()=>{try{await fn();}catch(e){this.job.error=String(e.message).slice(0,1024);try{await this.finish(this.job.cancel?'cancelled':'failed');}catch(cleanup){this.job.status='failed';this.job.error=String(cleanup.message).slice(0,1024);}}finally{this.flight=null;}})();}
 async step(step){if(this.job.frames+step.frames>600||this.job.results.length+(step.assertions?.length??0)>48)throw testError('Test budget exhausted');for(let i=0;i<step.frames;i++){if(this.job.cancel)throw testError('Cancelled','AX_TEST_0002');if(performance.now()>this.deadline)throw testError('Test time budget exhausted','AX_TEST_0002');await this.adapter.step({delta:1/60,keys:step.keys??[]});this.job.frames++;}if(this.job.cancel)throw testError('Cancelled','AX_TEST_0002');const state=await this.adapter.state(step.assertions??[]);for(const assertion of step.assertions??[])this.job.results.push({...assertRuntime(assertion,state),frame:this.job.frames});}
 async finish(status){try{if(this.active)await this.adapter.end();}finally{this.active=false;if(this.job)this.job.status=status==='completed'&&this.job.results.some(r=>!r.passed)?'failed':status;}}
 result(){return this.job?structuredClone({...this.job,cancel:undefined}):{status:'idle'};}
}
