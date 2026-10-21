import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {GameEngineAdapter} from '../platform/adapter.mjs';
import {startServer} from '../daemon/bootstrap/server.mjs';

async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'axiom-adapter-'));
  const adapter=new GameEngineAdapter();
  t.after(async()=>{await adapter.shutdown();await rm(root,{recursive:true,force:true});});
  await adapter.handle('initialize',{platformVersion:'0.1.0',authorizedRoot:root});
  return {root,adapter};
}
test('P1 adapter refuses unsupported versions and detects future projects without writing',async t=>{
  const {root,adapter}=await fixture(t),path=join(root,'future.json');
  await writeFile(path,JSON.stringify({schemaVersion:99}));const before=await readFile(path),files=await readdir(root);
  await assert.rejects(adapter.detect(path),e=>e.code==='incompatibleVersion');
  assert.deepEqual(await readFile(path),before);assert.deepEqual(await readdir(root),files);
  await assert.rejects(new GameEngineAdapter().handle('initialize',{platformVersion:'1.0.0',authorizedRoot:root}),e=>e.code==='incompatibleVersion');
});
test('P1 hosted lifecycle preserves dirty buffers, rejects stale reports, and keeps native start available',async t=>{
  const {root,adapter}=await fixture(t);
  const opened=await adapter.handle('project.create',{path:root,name:'Buffer protection'});
  const port=adapter.runtime.platform;
  port.reportEditor({clientId:'editor',sequence:2,dirty:true});
  port.reportEditor({clientId:'editor',sequence:1,dirty:false});
  assert.equal((await port.status()).status.pendingBuffers,true);
  await assert.rejects(port.save(opened.status.revision),e=>e.code==='projectBusy');
  await assert.rejects(port.close(opened.status.revision,'save'),e=>e.code==='projectBusy');
  assert.equal((await port.close(opened.status.revision,'cancel')).cancelled,true);
  port.reportEditor({clientId:'editor',sequence:3,dirty:false});
  assert.equal((await port.save(opened.status.revision)).status.pendingBuffers,false);
  const current=(await port.status()).status;
  await adapter.handle('project.close',{expectedRevision:current.revision,decision:'discard'});
  const native=await startServer({projectRoot:root});try{assert.equal(native.platform,undefined);assert.match(native.editorUrl,/127\.0\.0\.1/);}finally{await native.close();}
});

test('P4 starter scene survives hosted create/reopen; rename is atomic, revision guarded and refuses dirty editor buffers',async t=>{
 const {root,adapter}=await fixture(t);let opened=await adapter.handle('project.create',{path:root,name:'Starter'});const file=opened.path,original=JSON.parse(await readFile(file,'utf8'));
 assert.equal(original.scene.entities.length,3);assert.ok(original.scene.entities.some(e=>e.camera));assert.ok(original.scene.entities.some(e=>e.light));assert.ok(original.scene.entities.some(e=>e.renderable));
 const port=adapter.runtime.platform;await assert.rejects(port.rename('Invalid revision',-1),e=>e.code==='revisionConflict');port.reportEditor({clientId:'rename-buffer',sequence:1,dirty:true});await assert.rejects(port.rename('Blocked',opened.status.revision),e=>e.code==='projectBusy');assert.equal(JSON.parse(await readFile(file,'utf8')).name,'Starter');
 port.reportEditor({clientId:'rename-buffer',sequence:2,dirty:false});const renamed=await adapter.handle('project.rename',{name:'Renamed starter',expectedRevision:opened.status.revision});assert.equal(renamed.status.name,'Renamed starter');const saved=JSON.parse(await readFile(file,'utf8'));assert.equal(saved.id,original.id);assert.deepEqual(saved.scene,original.scene);assert.equal(saved.revision,original.revision+1);
 await adapter.handle('project.close',{expectedRevision:renamed.status.revision,decision:'save'});await adapter.handle('project.rename',{path:file,name:'Closed starter'});assert.equal(JSON.parse(await readFile(file,'utf8')).name,'Closed starter');opened=await adapter.handle('project.open',{path:file});assert.equal(opened.status.projectId,original.id);assert.equal(JSON.parse(await readFile(file,'utf8')).scene.entities.length,3);
});
