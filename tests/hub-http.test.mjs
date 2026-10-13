import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../daemon/bootstrap/server.mjs';
import {envelope} from '../protocol/src/protocol.ts';
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
