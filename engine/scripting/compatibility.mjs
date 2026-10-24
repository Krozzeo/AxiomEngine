import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const directory=new URL('../../docs/compatibility/',import.meta.url);
let loading,packageLoading,nativeLoading;
async function nativeInventory(){
 if(!nativeLoading)nativeLoading=(async()=>{const [index,compressed]=await Promise.all([readFile(new URL('native-snapshot.json',directory)),readFile(new URL('native-api.jsonl.gz',directory))]),meta=JSON.parse(index),raw=gunzipSync(compressed);if(createHash('sha256').update(raw).digest('hex')!==meta.inventorySha256)throw Error('ABI inventory hash mismatch');const records=raw.toString().trim().split('\n').map(line=>JSON.parse(line));if(records.length!==meta.records)throw Error('ABI denominator mismatch');return {meta,records};})();
 return nativeLoading;
}
async function packageInventory(){
 if(!packageLoading)packageLoading=(async()=>{const [index,compressed]=await Promise.all([readFile(new URL('packages.json',directory)),readFile(new URL('package-api.jsonl.gz',directory))]),meta=JSON.parse(index),raw=gunzipSync(compressed);if(createHash('sha256').update(raw).digest('hex')!==meta.inventorySha256)throw Error('Package inventory hash mismatch');const packages=new Map(meta.packages.map(p=>[p.name,p]));return {meta,records:raw.toString().trim().split('\n').map(line=>{const r=JSON.parse(line);return {...r,owner:r.package+'@'+r.version,declaration:r.commentId,kind:'package-api-identity',priority:'P1',reason:'Versioned package identity; return/accessor shape and binary/behavior conformance remain unverified',source:packages.get(r.package).docs+'/'+r.href};})};})();
 return packageLoading;
}
export async function compatibilityInventory(){
 if(!loading)loading=(async()=>{
  const [raw,patch,summary,snapshot]=await Promise.all(['unity-6000.3-api.jsonl.gz','mapping.jsonl.gz','coverage.json','snapshot.json'].map(name=>readFile(new URL(name,directory))));
  const data=gunzipSync(raw),source=JSON.parse(snapshot),coverage=JSON.parse(summary);
  if(createHash('sha256').update(data).digest('hex')!==source.inventorySha256)throw Error('Compatibility snapshot hash mismatch');
  const mapping=new Map(gunzipSync(patch).toString().trim().split('\n').map(line=>{const r=JSON.parse(line);return [r.id,r];}));
  const records=data.toString().trim().split('\n').map(line=>{const record=JSON.parse(line),match=mapping.get(record.id);if(!match)throw Error('Missing compatibility classification');return {...record,...match};});
  if(records.length!==source.records||mapping.size!==records.length)throw Error('Compatibility denominator mismatch');
  return {source,coverage,records};
 })().catch(error=>{loading=null;throw error;});
 return loading;
}
export async function queryCompatibility(params){
 const q=params.get('q')??'',status=params.get('status')??'',milestone=params.get('milestone')??'',priority=params.get('priority')??'',scope=params.get('scope')??'abi',offset=Number(params.get('offset')??0),limit=Number(params.get('limit')??30);
 if(q.length>200||!Number.isInteger(offset)||offset<0||offset>100000||!Number.isInteger(limit)||limit<1||limit>100||status&&!['partial','pending','blocked','compatible','out-of-scope'].includes(status)||milestone&&!/^M(?:2\d|3\d)$/.test(milestone)||priority&&!['P0','P1','P2'].includes(priority))throw Object.assign(Error('Invalid bounded compatibility query'),{status:400});
 if(!['abi','core','packages'].includes(scope))throw Object.assign(Error('Invalid inventory scope'),{status:400});
 const inventory=await compatibilityInventory(),query=q.toLowerCase(),pack=scope==='packages'?await packageInventory():null;
 const abi=scope==='abi'?await nativeInventory():null;
 const rows=(abi?.records??pack?.records??inventory.records).filter(r=>(!query||(r.owner+' '+r.declaration).toLowerCase().includes(query))&&(!status||r.status===status)&&(!milestone||r.milestone===milestone)&&(!priority||r.priority===priority));
 return {scope,packageStats:pack?{packages:pack.meta.packages.length,blocked:pack.meta.packages.filter(p=>p.status==='blocked').length}:null,snapshotSha256:abi?.meta.inventorySha256??pack?.meta.inventorySha256??inventory.source.inventorySha256,coverage:abi?{...abi.meta,targetRecords:abi.meta.records}:pack?{...inventory.coverage,targetRecords:pack.meta.records,aliasCandidateRecords:0}:inventory.coverage,total:rows.length,offset,items:rows.slice(offset,offset+limit),nextOffset:offset+limit<rows.length?offset+limit:null};
}
