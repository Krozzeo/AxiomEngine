import { Worker } from 'node:worker_threads';
import { createHash, randomUUID } from 'node:crypto';
import { lstat, open, rename, rm } from 'node:fs/promises';
import { projectError } from '../../protocol/src/project-document.mjs';
export const IMPORTER_VERSION='axiom-png-glb-wav/4';
const hash=data=>createHash('sha256').update(data).digest('hex');
const fail=message=>projectError('AX_ASSET_0001',message);
// Fixed internal worker module: clients cannot choose executables or modules.
export function importInWorker(bytes,signal) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted)return reject(fail('Import cancelled'));
    const worker=new Worker(new URL('../../engine/assets/import-worker.mjs',import.meta.url),{workerData:bytes,resourceLimits:{maxOldGenerationSizeMb:128}});
    let done=false;
    const finish=(error,asset)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);void worker.terminate();error?reject(error):resolve(asset);};
    const abort=()=>finish(fail('Import cancelled'));
    const timer=setTimeout(()=>finish(fail('Importer exceeded 15 seconds')),15000);
    signal?.addEventListener('abort',abort,{once:true});
    worker.once('message',m=>finish(m.error?fail(m.error):null,m.asset));
    worker.once('error',error=>finish(fail(error.message)));
    worker.once('exit',code=>{if(!done)finish(fail(`Importer exited (${code})`));});
  });
}
export class AssetPipeline {
  constructor(store){this.store=store;}
  source(record){return record.sourceId??record.id;}
  dependencies(record){return record.textureId?[record.textureId]:[];}
  keys(scene) {
    const records=new Map((scene.assets??[]).map(a=>[a.id,a])),keys=new Map(),visiting=new Set();
    const visit=id=>{
      if(keys.has(id))return keys.get(id);
      const item=records.get(id);if(!item||visiting.has(id))throw fail('Missing or cyclic asset dependency');
      visiting.add(id);
      const dependencies=this.dependencies(item).map(dep=>[dep,visit(dep)]);
      const key=hash(JSON.stringify({version:IMPORTER_VERSION,source:this.source(item),dependencies}));
      keys.set(id,key);visiting.delete(id);return key;
    };
    for(const id of records.keys())visit(id);
    return keys;
  }
  async cachePath(projectId,key){return (await this.store.path(projectId,'asset://'+key)).replace(/\.bin$/,'.derived.json');}
  async cached(projectId,key) {
    const path=await this.cachePath(projectId,key);
    try {
      const info=await lstat(path);if(info.isSymbolicLink()||!info.isFile()||info.nlink!==1)throw fail('Invalid cache file');
      if(info.size>32*1024*1024)return null;
      const file=await open(path,'r');let text;
      try{const stat=await file.stat();if(stat.ino!==info.ino||stat.nlink!==1||stat.size>32*1024*1024)throw fail('Cache changed during read');text=await file.readFile('utf8');}finally{await file.close();}
      let entry;try{entry=JSON.parse(text);}catch{return null;}
      if(entry.key!==key||entry.version!==IMPORTER_VERSION||hash(JSON.stringify(entry.asset))!==entry.digest)return null;
      return entry.asset;
    } catch(error){if(error.code==='ENOENT')return null;throw error;}
  }
  async write(projectId,key,asset) {
    const path=await this.cachePath(projectId,key),temporary=path+'.'+randomUUID()+'.tmp';
    const bytes=JSON.stringify({version:IMPORTER_VERSION,key,digest:hash(JSON.stringify(asset)),asset});
    if(Buffer.byteLength(bytes)>32*1024*1024)throw fail('Derived resource exceeds 32 MiB');
    try {const file=await open(temporary,'wx',0o600);try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}await rename(temporary,path);}finally{await rm(temporary,{force:true});}
  }
  async resource(projectId,scene,id,signal,stats=null,keys=this.keys(scene)) {
    const record=scene.assets?.find(a=>a.id===id);if(!record)throw fail('Asset is not in this project');
    const bytes=await this.store.readBytes(projectId,this.source(record));
    const key=keys.get(id),cached=await this.cached(projectId,key);
    if(signal?.aborted)throw fail('Import cancelled');
    if(cached){if(stats)stats.cacheHits.push(id);return cached;}
    const asset=await importInWorker(bytes,signal);
    if(asset.kind!==record.kind)throw fail('Replacement source changes asset kind');
    if(record.textureId) {
      if(asset.kind!=='mesh')throw fail('Only meshes accept texture dependencies');
      const texture=await this.resource(projectId,scene,record.textureId,signal,null,keys);
      if(texture.kind!=='sprite')throw fail('Mesh texture must reference an image');
      for(const primitive of asset.primitives){primitive.texture=texture.dataUrl;primitive.color=[1,1,1,1];}
    }
    if(signal?.aborted)throw fail('Import cancelled');
    await this.write(projectId,key,asset);
    if(stats)stats.rebuilt.push(id);
    return asset;
  }
  async build(projectId,scene,previous=[],signal) {
    const keys=this.keys(scene),stats={rebuilt:[],cacheHits:[],unchanged:[]};
    for(const [id,key] of keys) {
      const record=scene.assets.find(a=>a.id===id),old=previous.find(a=>a.id===id);
      // Verify sources even when reusing a derived artifact.
      await this.store.readBytes(projectId,this.source(record));
      if(old?.buildKey===key && await this.cached(projectId,key)){stats.unchanged.push(id);record.buildKey=key;continue;}
      await this.resource(projectId,scene,id,signal,stats,keys);
      record.sourceId=this.source(record);record.buildKey=key;
      record.lastBuild={reason:!old?'import':this.source(old)!==this.source(record)?'source_changed':old.buildKey===key?'cache_recovery':'dependency_or_importer_changed',importer:IMPORTER_VERSION};
    }
    scene.assetDbVersion=1;
    return stats;
  }
  async explain(projectId,scene,id,jobs=[]) {
    const record=scene.assets?.find(a=>a.id===id);
    const direct=(scene.assets??[]).filter(a=>this.dependencies(a).includes(id)).map(a=>a.id);
    const transitive=new Set(direct);for(const dependency of transitive)for(const a of scene.assets??[])if(this.dependencies(a).includes(dependency))transitive.add(a.id);
    let availability=record?'available (renderer loads only referenced scene assets)':'asset_not_registered';
    if(record)try{await this.store.readBytes(projectId,this.source(record));for(const dependency of this.dependencies(record)){const item=scene.assets.find(a=>a.id===dependency);if(!item)throw fail('Missing dependency');await this.store.readBytes(projectId,this.source(item));}}catch(error){availability=`source_unavailable: ${error.code??'AX_ASSET_0001'}: ${error.message}`;}
    return {asset:record??null,whyAssetNotLoaded:availability,whyWasRebuilt:record?.lastBuild??{reason:'legacy_asset_not_built'},whatUses:{assets:[...transitive],entities:scene.entities.filter(e=>e.renderable&&(e.renderable.assetId===id||transitive.has(e.renderable.assetId))).map(e=>e.id)},jobs:jobs.filter(j=>j.assetId===id).map(j=>({...j}))};
  }
}
