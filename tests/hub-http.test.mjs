import {connectedPlatformFixture} from './connected-platform-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../daemon/bootstrap/server.mjs';
import {envelope} from '../protocol/src/protocol.ts';
test('native folder selection requires the existing local authentication and handles cancellation without editing storage',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-hub-picker-'));let calls=0;const server=await startServer({projectRoot:join(root,'projects'),pickFolder:async()=>{calls++;return {path:null};}});t.after(async()=>{await server.close();await rm(root,{recursive:true,force:true});});
 const body=JSON.stringify({action:'pick-folder',initial:root});assert.equal((await fetch(server.origin+'/v1/hub',{method:'POST',headers:{'Content-Type':'application/json'},body})).status,403);assert.equal(calls,0);
 const response=await fetch(server.origin+'/v1/hub',{method:'POST',headers:{Origin:server.origin,Authorization:'Bearer '+server.token,'Content-Type':'application/json'},body});assert.equal(response.status,200);assert.deepEqual(await response.json(),{path:null});assert.equal(calls,1);
});
test('authenticated Hub API creates persistent projects, requires deletion confirmation and refuses storage switching with an open project',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-hub-http-'));let server=await startServer({projectRoot:join(root,'projects'),projectFolders:true,hubSettings:{settingsRoot:join(root,'settings')}});t.after(async()=>{await server.close();await rm(root,{recursive:true,force:true});});
 const headers={Origin:server.origin,Authorization:'Bearer '+server.token,'Content-Type':'application/json'};
 async function api(path,body){const response=await fetch(server.origin+path,{headers,method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,value:await response.json()};}
 assert.equal((await fetch(server.origin+'/v1/hub')).status,403);const initial=await api('/v1/hub');assert.equal(initial.value.projects.length,0);assert.equal(initial.value.applications.filter(a=>a.available).length,1);
 const created=await api('/v1/commands',envelope('command',{type:'project.create',data:{name:'Hub HTTP',dimension:3}}));assert.equal(created.value.kind,'event');const id=created.value.payload.data.project.id;
 assert.notEqual((await api('/v1/hub',{action:'configure',projectRoot:join(root,'other')})).status,200);
 await api('/v1/commands',envelope('command',{type:'project.close',data:{id,expectedSceneRevision:created.value.payload.data.sceneRevision}}));assert.equal((await api('/v1/hub')).value.projects[0].id,id);assert.notEqual((await api('/v1/hub',{action:'delete',id})).status,200);assert.equal((await api('/v1/hub',{action:'delete',id,confirm:true})).status,200);assert.equal((await api('/v1/hub')).value.projects.length,0);
 assert.equal((await api('/v1/hub',{action:'configure',projectRoot:join(root,'other')})).status,200);assert.equal((await api('/v1/hub')).value.projectRoot,join(root,'other'));
});

test('changing the Hub bank binds new AI journals to that bank and restores task history after restart',async t=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-hub-journal-')),old=join(root,'old'),next=join(root,'new'),settings=join(root,'settings');
 const fetchImpl=async()=>new Response(JSON.stringify({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Project context inspected.'}]}],usage:{input_tokens:1,output_tokens:1,total_tokens:2}}));
 const options={hubSettings:{settingsRoot:settings,defaultRoot:old},assistantOptions:{transport:connectedPlatformFixture(fetchImpl),capabilityProbe:async()=>({compiler:true})}};let server=await startServer(options);t.after(async()=>{await server.close();await rm(root,{recursive:true,force:true});});
 async function api(path,body){const response=await fetch(server.origin+path,{headers:{Origin:server.origin,Authorization:'Bearer '+server.token,'Content-Type':'application/json'},method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});assert.equal(response.status,200);return response.json();}
 await api('/v1/hub',{action:'configure',projectRoot:next});const created=await api('/v1/commands',envelope('command',{type:'project.create',data:{name:'New bank',dimension:3}}));assert.equal(created.kind,'event');
 await api('/v1/ai/configure',{action:'update',model:'gpt-4.1'});const task=await api('/v1/ai/tasks',{text:'Explain the current project'});let finished;for(let i=0;i<100;i++){finished=await api('/v1/ai/tasks?id='+encodeURIComponent(task.id));if(finished.status!=='running')break;await new Promise(r=>setTimeout(r,10));}assert.equal(finished.status,'completed');
 assert.ok((await readdir(join(next,'.assistant-work'))).some(name=>name.endsWith('.json')));assert.deepEqual((await readdir(join(old,'.assistant-work')).catch(e=>e.code==='ENOENT'?[]:Promise.reject(e))).filter(name=>name.endsWith('.json')),[]);
 await server.close();server=await startServer(options);assert.equal((await api('/v1/hub')).projectRoot,next);assert.equal((await api('/v1/ai/tasks?id='+encodeURIComponent(task.id))).status,'completed');
});
