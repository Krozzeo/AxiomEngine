import test from 'node:test';import assert from 'node:assert/strict';
import {DecisionEvidence,explainDecision} from '../apps/editor/src/causal-diagnostics.mjs';
const collider={dimension:2,layer:1,mask:4294967295};
function frame(){return {traceId:'frame-1',correlationId:'command-correlation',causationId:'command-message',sceneRevision:3,projectId:'project-test',frame:15,view:'game',playing:true,renderer:'webgpu',camera:{},assets:[{id:'asset',kind:'sprite',loaded:true}],entities:[{id:'a',renderable:true,assetId:'asset',kind:'sprite',inFrustum:true,scale:[1,1,1],drawCount:1,collider:{...collider}},{id:'b',collider:{...collider}}],script:{attached:true,attachments:['a'],active:true},physics:{contacts:[],steps:30,omittedContacts:0}};}
const faults=[
 ['no Renderable',e=>e.entities[0].renderable=false,'whyNotRendered','AX_CAUSAL_0106'],
 ['resource load failure',e=>e.assets[0].error='Missing source file','whyNotRendered','AX_CAUSAL_0102'],
 ['wrong resource kind',e=>e.assets[0].kind='mesh','whyNotRendered','AX_CAUSAL_0107'],
 ['Null renderer',e=>e.renderer='null','whyNotRendered','AX_CAUSAL_0108'],
 ['collapsed geometry',e=>e.entities[0].degenerate=true,'whyNotRendered','AX_CAUSAL_0109'],
 ['outside clip planes',e=>e.entities[0].inFrustum=false,'whyNotRendered','AX_CAUSAL_0110'],
 ['missing collider',e=>delete e.entities[0].collider,'whyNotColliding','AX_CAUSAL_0119'],
 ['dimension mismatch',e=>e.entities[1].collider.dimension=3,'whyNotColliding','AX_CAUSAL_0120'],
 ['collision mask rejection',e=>e.entities[0].collider.mask=0,'whyNotColliding','AX_CAUSAL_0121'],
 ['script runtime failure',e=>e.script.fault='actual script exception','whyScriptNotRunning','AX_CAUSAL_0116']
];
for(const [name,inject,kind,code]of faults)test('causal fault: '+name,()=>{const e=frame();inject(e);const result=explainDecision(e,{kind,entityId:'a',otherId:'b'});assert.equal(result.code,code);assert.equal(result.status,'explained');assert.equal(result.correlationId,e.correlationId);assert.equal(result.causationId,e.causationId);assert.equal(result.edges.length,result.nodes.length-1);});
test('submitted geometry and absent contact never fabricate visibility/collision causes',()=>{const e=frame();assert.equal(explainDecision(e,{kind:'whyNotRendered',entityId:'a'}).status,'inconclusive');assert.equal(explainDecision(e,{kind:'whyNotColliding',entityId:'a',otherId:'b'}).status,'inconclusive');e.physics.contacts=[{a:'a',b:'b',trigger:true}];assert.equal(explainDecision(e,{kind:'whyNotColliding',entityId:'a',otherId:'b'}).code,'AX_CAUSAL_0123');e.playing=false;assert.equal(explainDecision(e,{kind:'whyScriptNotRunning',entityId:'a'}).code,'AX_CAUSAL_0115');e.assets[0].loaded=false;assert.equal(explainDecision(e,{kind:'whyAssetNotLoaded',assetId:'asset'}).code,'AX_CAUSAL_0103');});
test('deep trace is opt-in, bounded, revision-aware and expires',()=>{let now=0;const d=new DecisionEvidence({limit:2,ttlMs:100,clock:()=>now});d.record(frame());assert.equal(d.frames.size,0);assert.equal(d.query({kind:'whyNotRendered',entityId:'a',traceId:'frame-1'}).status,'unavailable');d.setDeep(true);for(let i=0;i<3;i++)d.record({...frame(),traceId:'frame-'+i});assert.equal(d.frames.size,2);assert.equal(d.query({traceId:'frame-0'}).code,'AX_CAUSAL_0002');assert.equal(d.query({traceId:'frame-2',expectedSceneRevision:4}).code,'AX_CAUSAL_0004');now=101;assert.equal(d.query({traceId:'frame-2'}).code,'AX_CAUSAL_0003');d.setDeep(false);assert.equal(d.frames.size,0);});
