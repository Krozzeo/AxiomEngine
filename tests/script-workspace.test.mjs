import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {CommandBus} from '../daemon/bootstrap/command-bus.mjs';
import {envelope} from '../protocol/src/protocol.ts';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'axiom-script-job-'));t.after(()=>rm(root,{force:true,recursive:true}));const workspace=new SceneWorkspace(new ProjectStore(root)),bus=new CommandBus({projects:workspace});const send=async(type,data={})=>bus.dispatch(envelope('command',{type,data}));await send('project.create',{name:'Scripts'});await send('scene.entity.create',{id:workspace.project.id,expectedSceneRevision:workspace.revision});return {workspace,bus,send};}
const mutation=w=>({id:w.project.id,expectedSceneRevision:w.revision,source:'using Axiom.Gameplay; namespace Game; public sealed class GameScript : Script {}',attachments:[w.project.scene.entities[0].id]});
async function settled(workspace){for(let i=0;i<100&&workspace.activeScriptJob;i++)await new Promise(r=>setImmediate(r));assert.equal(workspace.activeScriptJob,null);}
test('script jobs retain last good build on failure and emit causal audit events',async t=>{
 const {workspace,send,bus}=await fixture(t);
 workspace.compiler.build=async(_id,source)=>({id:randomUUID(),mode:'development',sourceHash:createHash('sha256').update(source).digest('hex')});
 const receipt=await send('script.compile',mutation(workspace));await settled(workspace);
 const good=workspace.snapshot();assert.ok(good.project.scene.script.build);
 const finished=bus.eventsSince(0).find(e=>e.payload.type==='script.jobFinished');assert.equal(finished.correlationId,receipt.correlationId);assert.equal(finished.payload.data.capability,'script.compile.csharp');
 workspace.compiler.build=async()=>{throw Object.assign(new Error('bad source'),{diagnostics:[{file:'Game.cs',line:1,column:2,code:'CS1002'}]});};
 const failed=await send('script.compile',{...mutation(workspace),source:'using Axiom.Gameplay; namespace Game; public sealed class GameScript : Script { // bad\n}'});await settled(workspace);
 assert.deepEqual(workspace.snapshot(),good);
 const job=(await send('script.job.get',{id:workspace.project.id,jobId:failed.payload.data.job.id})).payload.data.job;assert.equal(job.status,'failed');assert.equal(job.error.diagnostics[0].line,1);
});
test('cancelled or stale compilation cannot overwrite current authoring',async t=>{
 const {workspace,send}=await fixture(t);let release;
 workspace.compiler.build=async()=>new Promise(r=>{release=()=>r({id:randomUUID(),mode:'development',sourceHash:'a'.repeat(64)});});
 const receipt=await send('script.compile',mutation(workspace));await new Promise(r=>setImmediate(r));
 assert.equal((await send('scene.save',mutation(workspace))).kind,'error');
 await send('scene.entity.create',mutation(workspace));const current=workspace.snapshot();release();await settled(workspace);assert.deepEqual(workspace.snapshot(),current);
 assert.equal(workspace.scriptJobs.get(receipt.payload.data.job.id).status,'failed');
 const cancelled=await send('script.compile',mutation(workspace));await new Promise(r=>setImmediate(r));await send('script.job.cancel',{id:workspace.project.id,jobId:cancelled.payload.data.job.id});release();await settled(workspace);assert.deepEqual(workspace.snapshot(),current);
 assert.equal(workspace.scriptJobs.get(cancelled.payload.data.job.id).status,'cancelled');
});

test('script compilation is rejected during Play before invoking the compiler capability',async t=>{const {workspace,send}=await fixture(t);let calls=0;workspace.compiler.build=async()=>{calls++;return {id:randomUUID(),mode:'development',sourceHash:'a'.repeat(64)};};await send('play.start',mutation(workspace));const before=workspace.snapshot();const result=await send('script.compile',mutation(workspace));assert.equal(result.kind,'error');assert.equal(result.payload.code,'AX_SCENE_0005');assert.equal(calls,0);assert.deepEqual(workspace.snapshot(),before);await send('play.stop',mutation(workspace));await send('script.compile',mutation(workspace));await settled(workspace);assert.equal(calls,1);});
