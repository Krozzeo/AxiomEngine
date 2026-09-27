import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,symlink,link} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {scriptDirectory,writeNew,collectBundle,readPublished,readManifest} from '../daemon/bootstrap/scripting/files.mjs';

async function fixture(t){const root=await mkdtemp(join(tmpdir(),'axiom-scripts-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
test('script builds use project identities and serve only published framework files',async t=>{
 const root=await fixture(t),store=new ProjectStore(join(root,'projects'));
 const build=await scriptDirectory(store,'project://'+randomUUID(),randomUUID());
 await assert.rejects(scriptDirectory(store,'../../escape',randomUUID()));
 await assert.rejects(scriptDirectory(store,'project://'+randomUUID(),'../escape'));
 const output=join(build,'publish'),framework=join(output,'wwwroot','_framework');await mkdir(framework,{recursive:true});
 await writeNew(join(framework,'dotnet.js'),'export const dotnet={};');
 await writeNew(join(framework,'runtime.wasm'),'wasm');
 await writeNew(join(framework,'runtime.wasm.gz'),'compressed');
 await writeNew(join(output,'Game.cs'),'private source');
 const manifest=await collectBundle(output);
 assert.deepEqual(manifest.files.sort(),['dotnet.js','runtime.wasm']);
 await writeNew(join(build,'manifest.json'),JSON.stringify(manifest));
 assert.deepEqual(await readManifest(join(build,'manifest.json')),manifest);
 assert.equal((await readPublished(build,manifest,'runtime.wasm')).toString(),'wasm');
 for(const name of ['../Game.cs','Game.cs','runtime.wasm.gz'])await assert.rejects(readPublished(build,manifest,name));
 await assert.rejects(writeNew(join(framework,'dotnet.js'),'replace'));
});
test('script output rejects linked files, linked roots and malformed manifests',async t=>{
 const root=await fixture(t),outside=join(root,'outside');await mkdir(outside);
 const store=new ProjectStore(join(root,'projects'));await store.directory();const id=randomUUID();
 await symlink(outside,join(store.root,id+'.scripts'),process.platform==='win32'?'junction':'dir');
 await assert.rejects(scriptDirectory(store,'project://'+id,randomUUID()),/link/);
 const output=join(root,'publish');await mkdir(output);await writeFile(join(root,'source'),'x');await link(join(root,'source'),join(output,'linked'));
 await assert.rejects(collectBundle(output),/Invalid compiler output/);
 const manifest=join(root,'manifest.json');
 for(const value of [{files:['dotnet.js'],framework:'../_framework/'},{files:['dotnet.js','../secret'],framework:'_framework/'},{files:['dotnet.js','dotnet.js'],framework:'_framework/'}]){
  await writeFile(manifest,JSON.stringify(value));await assert.rejects(readManifest(manifest),/manifest format/);
 }
});
