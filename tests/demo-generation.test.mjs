import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDemos} from '../demos/create-projects.mjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {ScriptCompiler} from '../daemon/bootstrap/scripting/compiler.mjs';
import {createM8Demos} from '../demos/create-m8-projects.mjs';
async function root(t){const path=await mkdtemp(join(tmpdir(),'axiom-demo-'));t.after(()=>rm(path,{recursive:true,force:true}));return path;}
test('M8 creates two complete editable projects with intentional diagnostic cases',async t=>{
 const path=await root(t),demos=await createM8Demos(path),store=new ProjectStore(path);assert.equal(demos.length,2);assert.equal((await store.run('project.list',{})).projects.length,2);
 const workshop=(await store.run('project.open',{id:demos[0].id})).project.scene,lab=(await store.run('project.open',{id:demos[1].id})).project.scene;
 assert.equal(workshop.entities.length,5);assert.equal(workshop.assets.length,4);assert.equal(lab.entities.length,6);assert.equal(lab.entities.find(e=>e.name.startsWith('Mask 0')).collider.mask,0);assert.ok(lab.entities.some(e=>e.transform.position[0]===1000));assert.ok(lab.assets.some(a=>a.name==='unused-asset.png'));
});
test('C# failure preserves two complete persisted demos and exposes its cause',async t=>{
 const path=await root(t);t.mock.method(ScriptCompiler.prototype,'build',async()=>{throw Error('Install .NET 10 SDK and wasm-tools');});
 const progress=[],demos=await createDemos(path,{onProgress:s=>progress.push(s)}),store=new ProjectStore(path);
 assert.equal((await store.run('project.list',{})).projects.length,2);assert.equal(demos[0].scriptStatus,'failed');assert.match(demos[0].scriptError,/Install .NET/);
 for(const demo of demos){const {project}=await store.run('project.open',{id:demo.id});assert.equal(project.scene.entities.length,7);assert.ok(project.scene.assets.length>=3);assert.ok(project.scene.camera);}
 assert.match(progress.at(-1),/Both scenes remain saved/);
});
test('strict browser acceptance still fails when C# cannot compile',async t=>{
 const path=await root(t);t.mock.method(ScriptCompiler.prototype,'build',async()=>{throw Error('Injected compile failure');});
 await assert.rejects(createDemos(path,{requireScript:true}),/Injected compile failure/);
 const store=new ProjectStore(path);const {projects}=await store.run('project.list',{});assert.equal(projects.length,2);for(const p of projects)assert.equal((await store.run('project.open',{id:p.id})).project.scene.entities.length,7);
});
test('regenerating demos preserves existing projects and saves fresh complete scenes',async t=>{
 const path=await root(t),store=new ProjectStore(path);
 const {project:old}=await store.run('project.create',{name:'Old empty demo'});
 const demos=await createDemos(path,{compile:false});
 assert.equal((await store.run('project.list',{})).projects.length,3);
 assert.equal((await store.run('project.open',{id:old.id})).project.scene.entities.length,0);
 for(const demo of demos){assert.notEqual(demo.id,old.id);assert.match(demo.name,/M7\.1/);assert.equal((await store.run('project.open',{id:demo.id})).project.scene.entities.length,7);}
 assert.equal(demos[0].scriptStatus,'skipped');
});
