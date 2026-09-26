import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,stat} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {PNG} from 'pngjs';
import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';
import {CommandBus} from '../daemon/bootstrap/command-bus.mjs';
import {envelope} from '../protocol/src/protocol.ts';
import {decodeAsset} from '../engine/assets/import.mjs';
import {imageFixture,glbFixture} from './fixtures.mjs';
const mutation=(s,extra={})=>({id:s.project.id,expectedSceneRevision:s.sceneRevision,...extra});
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'axiom-pipeline-'));t.after(()=>rm(root,{recursive:true,force:true}));const store=new ProjectStore(root),workspace=new SceneWorkspace(store),bus=new CommandBus({projects:workspace});const send=async(type,data={})=>{const r=await bus.dispatch(envelope('command',{type,data}));if(r.kind==='error')throw Object.assign(new Error(r.payload.cause),{code:r.payload.code});return r.payload.data;};return {store,workspace,bus,send};}
async function finish(send,id,job){for(let i=0;i<500;i++){const next=(await send('asset.job.get',{id,jobId:job.id})).job;if(!['queued','running'].includes(next.status))return next;await new Promise(r=>setTimeout(r,10));}throw new Error('Job timeout');}
function blue(){const p=PNG.sync.read(imageFixture());for(let i=0;i<p.data.length;i+=4)p.data.set([25,40,245,255],i);return PNG.sync.write(p);}
async function imported(send,s,name,bytes){return send('asset.import',mutation(s,{name,base64:bytes.toString('base64')}));}

test('source update rebuilds only texture dependency closure, keeps IDs and survives restart/undo',async t=>{
 const {send,workspace,store,bus}=await fixture(t);let s=await send('project.create',{name:'M3'});
 s=await imported(send,s,'checker.png',imageFixture());s=await imported(send,s,'cube.glb',glbFixture());s=await imported(send,s,'independent.png',blue());
 const [texture,mesh,independent]=s.project.scene.assets;
 let job=(await send('asset.job.start',mutation(s,{operation:'bindTexture',assetId:mesh.id,textureId:texture.id}))).job;
 assert.equal((await finish(send,s.project.id,job)).status,'completed');s=workspace.snapshot();
 s=await send('scene.asset.place',mutation(s,{assetId:mesh.id}));
 const before=structuredClone(s.project.scene),untouched=await workspace.pipeline.cachePath(s.project.id,independent.buildKey),mtime=(await stat(untouched)).mtimeMs;
 job=(await send('asset.job.start',mutation(s,{operation:'replace',assetId:texture.id,base64:blue().toString('base64')}))).job;
 assert.equal(job.status,'queued');assert.equal((await send('system.ping')).echo,null);
 job=await finish(send,s.project.id,job);assert.equal(job.status,'completed');
 assert.deepEqual(job.build.rebuilt,[mesh.id]);assert.deepEqual(job.build.cacheHits,[texture.id]);assert.deepEqual(job.build.unchanged,[independent.id]);
 s=workspace.snapshot();assert.deepEqual(s.project.scene.assets.map(a=>a.id),before.assets.map(a=>a.id));assert.equal(s.project.scene.entities[0].renderable.assetId,mesh.id);
 assert.equal((await stat(untouched)).mtimeMs,mtime);
 const asset=(await send('asset.get',{id:s.project.id,assetId:mesh.id})).asset;assert.equal(asset.primitives[0].texture,decodeAsset(blue()).dataUrl);
 const why=await send('asset.explain',{id:s.project.id,assetId:texture.id});assert.deepEqual(why.whatUses.assets,[mesh.id]);assert.equal(why.whatUses.entities.length,1);assert.equal(why.whyWasRebuilt.reason,'source_changed');
 const updated=structuredClone(s.project.scene);s=await send('scene.undo',mutation(s));assert.deepEqual(s.project.scene,before);s=await send('scene.redo',mutation(s));assert.deepEqual(s.project.scene,updated);
 s=await send('scene.save',mutation(s));const restarted=new SceneWorkspace(store);const reopened=await restarted.run('project.open',{id:s.project.id});assert.deepEqual(reopened.project,s.project);
 const events=bus.eventsSince(0).filter(e=>e.payload.type==='asset.jobFinished');assert.equal(events.length,2);assert.ok(events.every(e=>e.traceId&&e.causationId));
});

test('failed, cancelled and stale jobs preserve authoring and do not block commands',async t=>{
 const {send,workspace}=await fixture(t);let s=await send('project.create',{name:'Failure'});s=await imported(send,s,'image.png',imageFixture());const assetId=s.project.scene.assets[0].id;
 for(const mode of ['bad','cancel','stale']){
  const before=workspace.snapshot();const job=(await send('asset.job.start',mutation(before,{operation:'replace',assetId,base64:(mode==='bad'?Buffer.from('bad'):blue()).toString('base64')}))).job;
  if(mode==='cancel')await send('asset.job.cancel',{id:s.project.id,jobId:job.id});
  if(mode==='stale')await send('scene.entity.create',mutation(before,{name:'Concurrent'}));
  const expected=workspace.snapshot(),result=await finish(send,s.project.id,job);
  assert.equal(result.status,mode==='cancel'?'cancelled':'failed');assert.deepEqual(workspace.snapshot(),expected);
  if(mode==='stale')assert.equal(result.error.code,'AX_SCENE_0002');
 }
});

test('persistent derived cache recovers corruption and rejects unsafe dependencies',async t=>{
 const {send,workspace}=await fixture(t);let s=await send('project.create',{name:'Cache'});s=await imported(send,s,'image.png',imageFixture());const asset=s.project.scene.assets[0],path=await workspace.pipeline.cachePath(s.project.id,asset.buildKey);
 await writeFile(path,'broken');assert.equal((await send('asset.get',{id:s.project.id,assetId:asset.id})).asset.kind,'sprite');
 const invalid=structuredClone(s.project.scene);invalid.assets[0].textureId=asset.id;assert.throws(()=>workspace.pipeline.keys(invalid),/cyclic/);
 const job=(await send('asset.job.start',mutation(s,{operation:'bindTexture',assetId:asset.id,textureId:asset.id}))).job;assert.equal((await finish(send,s.project.id,job)).status,'failed');assert.deepEqual(workspace.snapshot(),s);
});

test('PCM WAV metadata imports in background and malformed alignment is rejected',async t=>{
 const wav=Buffer.alloc(44+160);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(160,40);
 assert.equal(decodeAsset(wav).durationSeconds,.01);const bad=Buffer.from(wav);bad.writeUInt16LE(3,32);assert.throws(()=>decodeAsset(bad),/alignment/);
 const {send,workspace}=await fixture(t);let s=await send('project.create',{name:'Audio'});const job=(await send('asset.job.start',mutation(s,{operation:'import',name:'tone.wav',base64:wav.toString('base64')}))).job;assert.equal((await finish(send,s.project.id,job)).status,'completed');s=workspace.snapshot();assert.equal(s.project.scene.assets[0].kind,'audio');await assert.rejects(send('scene.asset.place',mutation(s,{assetId:s.project.scene.assets[0].id})),{code:'AX_ASSET_0001'});
});
