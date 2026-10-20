import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as tick} from 'node:timers/promises';
import {startAgentBridge} from '../apps/editor/src/agent-bridge.mjs';

function bridge(t,initial){
 let current=initial,reply;const adopted=[],errors=[];
 const response=new Promise(resolve=>{reply=resolve;});
 const stop=startAgentBridge({document:{},
  api:async path=>path==='/v1/editor/sync'?response:{},
  getSnapshot:()=>current,getRenderer:()=>null,takeErrors:()=>[],
  projectEditor:{async synchronize(snapshot){adopted.push(snapshot);current=snapshot;}},
  reportError:error=>errors.push(error.message)});
 t.after(stop);
 return {reply,adopted,errors,set:snapshot=>{current=snapshot;},stop};
}

test('a delayed sync cannot undo a human preview switch or newer scene edit',async t=>{
 for(const changed of [
  {project:{id:'p'},workspaceId:'preview',sceneRevision:9},
  {project:{id:'p'},workspaceId:null,sceneRevision:7},
  {project:{id:'other'},workspaceId:null,sceneRevision:6}
 ]){
  const initial={project:{id:'p'},workspaceId:null,sceneRevision:6};
  const b=bridge(t,initial);b.set(changed);b.reply({snapshot:initial});await tick();
  assert.deepEqual(b.adopted,[],'A reply to the previous editor state must not replace the newer state');
  assert.deepEqual(b.errors,[]);b.stop();
 }
});

test('sync still adopts an external update when the editor has not changed',async t=>{
 const initial={project:{id:'p'},workspaceId:null,sceneRevision:6};
 const b=bridge(t,initial),external={...initial,workspaceId:'preview',sceneRevision:9};
 b.reply({snapshot:external});await tick();assert.deepEqual(b.adopted,[external]);assert.deepEqual(b.errors,[]);
});

test('disconnect prevents an in-flight sync from modifying a closed editor',async t=>{
 const b=bridge(t,{project:{id:'p'},sceneRevision:6});b.stop();
 b.reply({snapshot:{project:{id:'other'},sceneRevision:7}});await tick();assert.deepEqual(b.adopted,[]);
});
