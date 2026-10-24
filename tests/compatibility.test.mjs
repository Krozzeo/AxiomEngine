import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from '../daemon/bootstrap/server.mjs';
import {compatibilityInventory,queryCompatibility} from '../engine/scripting/compatibility.mjs';
const dir=new URL('../docs/compatibility/',import.meta.url);
const json=async name=>JSON.parse(await readFile(new URL(name,dir),'utf8'));
const lines=async name=>{const raw=gunzipSync(await readFile(new URL(name,dir)));return {raw,rows:raw.toString().trim().split('\n').map(JSON.parse)};};
test('M19 frozen documentation and mapping keep every identity, provenance and assignment',async()=>{
 const {source,records,coverage}=await compatibilityInventory();
 assert.equal(records.length,source.records);assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 assert.equal(coverage.targetRecords,records.length);assert.equal(coverage.nativeSourceVerified,0);
 assert.equal(records.some(r=>r.namespace==='unresolved'),false);
 for(const r of records){assert.match(r.pageSha256,/^[a-f0-9]{64}$/);assert.match(r.milestone,/^M(?:2\d|3\d)$/);assert.ok(['P0','P1','P2'].includes(r.priority));assert.ok(['partial','pending','blocked','out-of-scope'].includes(r.status));assert.ok(r.source.startsWith('https://docs.unity3d.com/6000.3/'));}
 assert.ok(records.some(r=>r.owner==='UnityEngine.Events.UnityEvent`1'));
 assert.ok(records.some(r=>r.kind==='message'));
 assert.ok(records.filter(r=>r.kind==='module').every(r=>r.status==='out-of-scope'));
 for(const [name,hash]of Object.entries(coverage.sdkSourceHashes))assert.equal(createHash('sha256').update(await readFile(new URL('../engine/scripting/templates/'+name,import.meta.url))).digest('hex'),hash,'Stale SDK mapping: '+name);
});
test('M19 declared ABI has a separate hashed denominator and complete member metadata',async()=>{
 const meta=await json('native-snapshot.json'),{raw,rows}=await lines('native-api.jsonl.gz');
 assert.equal(createHash('sha256').update(raw).digest('hex'),meta.inventorySha256);assert.equal(rows.length,meta.records);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 const assemblies=new Set(Object.values(meta.assemblies).map(a=>a.sha256));
 for(const r of rows){assert.ok(r.shape);assert.ok(r.provenance.length);for(const p of r.provenance)assert.ok(assemblies.has(p.assemblySha256));assert.match(r.milestone,/^M(?:2\d|3\d)$/);assert.ok(['partial','pending'].includes(r.status));}
 assert.equal(rows.some(r=>r.kind==='method'&&/^(get_|set_|add_|remove_)/.test(r.member)),false);
 const transform=rows.find(r=>r.kind==='type'&&r.owner==='UnityEngine.Transform');assert.equal(transform.baseType,'UnityEngine.Component');
 assert.ok(rows.some(r=>r.kind==='event'));assert.ok(rows.some(r=>r.kind==='method'&&r.parameters.some(p=>p.startsWith('out '))||r.parameters.some(p=>p.startsWith('ref '))));
 assert.equal(rows.filter(r=>r.status==='partial').length,meta.aliasCandidateRecords);
 assert.equal(Object.values(meta.areas).reduce((n,a)=>n+a.records,0),rows.length);
});
test('M19 packages preserve unavailable inventories rather than crediting names',async()=>{
 const meta=await json('packages.json'),{raw,rows}=await lines('package-api.jsonl.gz');assert.equal(createHash('sha256').update(raw).digest('hex'),meta.inventorySha256);assert.equal(rows.length,meta.records);assert.ok(meta.packages.some(p=>p.status==='blocked'));assert.ok(rows.every(r=>r.status==='pending'));
});
test('M19 bounded query rejects invalid controls and separates overlapping reference scopes',async()=>{
 for(const query of ['limit=0','limit=101','offset=-1','offset=0.5','status=completed','milestone=M40','scope=../../','q='+'a'.repeat(201)])await assert.rejects(queryCompatibility(new URLSearchParams(query)));
 const native=await queryCompatibility(new URLSearchParams('q=UnityEngine.Transform&limit=5'));assert.equal(native.scope,'abi');assert.ok(native.total>5);assert.equal(native.items.length,5);assert.equal(native.nextOffset,5);assert.ok(native.items.every(r=>(r.owner+' '+r.declaration).includes('UnityEngine.Transform')));
 const docs=await queryCompatibility(new URLSearchParams('scope=core&q=UnityEditor.Editor&limit=3'));assert.ok(docs.items.every(r=>r.milestone==='M38'));assert.notEqual(docs.snapshotSha256,native.snapshotSha256);
 const packages=await queryCompatibility(new URLSearchParams('scope=packages&limit=1'));assert.equal(packages.items.length,1);assert.ok(packages.packageStats.blocked>0);assert.equal(packages.coverage.nativeSourceVerifiedPercent,0);
});
test('M19 HTTP inventory requires the existing origin/token boundary and rejects invalid queries',async()=>{
 const root=await mkdtemp(join(tmpdir(),'axiom-m19-api-'));let host;
 try{host=await startServer({projectRoot:root});const url=host.origin+'/v1/compatibility',headers={Origin:host.origin,Authorization:'Bearer '+host.token};
  assert.equal((await fetch(url)).status,403);
  assert.equal((await fetch(url,{headers:{Origin:host.origin}})).status,401);
  assert.equal((await fetch(url,{headers:{...headers,Origin:'https://example.invalid'}})).status,403);
  assert.equal((await fetch(url+'?limit=1000',{headers})).status,400);
  const response=await fetch(url+'?limit=1',{headers});assert.equal(response.status,200);assert.equal((await response.json()).items.length,1);
 }finally{await host?.close();await rm(root,{recursive:true,force:true});}
});
