"""Freeze a declared-ABI profile from interface-only PE facts. No vendor DLL is shipped."""
import argparse,collections,gzip,json,re
from pathlib import Path
from inventory import ROOT,encode,digest,ownership

def main():
 p=argparse.ArgumentParser();p.add_argument('metadata',type=Path);p.add_argument('sources',type=Path);p.add_argument('sdk',type=Path);a=p.parse_args();raw=json.loads(a.metadata.read_text(encoding='utf-8-sig'));sdk=json.loads(a.sdk.read_text(encoding='utf-8-sig'));index=collections.defaultdict(list)
 for s in sdk['records']:index[(s['owner'],s['name'])].append(s)
 unique={};assemblies={}
 for r in raw:
  assemblies[r['source']]={'assembly':r['assembly'],'version':r['assemblyVersion'],'sha256':r['assemblySha256'],'mvid':r['mvid']}
  if not r['publicContract']:continue
  arity=len(r.get('shape',{}).get('genericParameters',[]));symbolName=r['name']+('`'+str(arity)if r['kind']=='method'and arity else '')
  identity='|'.join([r['ownerCanonical'],r['kind'],r['name'],str(arity),r['returns'],','.join(r['parameters']),str(r['static'])])
  rid='unity63abi:'+digest(identity.encode())[:24]
  proof={'source':r['source'],'assemblySha256':r['assemblySha256'],'mvid':r['mvid']}
  if rid in unique:
   prior=unique[rid];prior['provenance'].append(proof)
   if prior['shape']!=r['shape'] or prior['declaration']!=r['declaration'] or prior['obsolete']!=r['obsolete']:prior.setdefault('profileVariants',[]).append({'declaration':r['declaration'],'shape':r['shape'],'obsolete':r['obsolete'],**proof})
   continue
  alias=r['owner'].replace('UnityEngine','Axiom.Gameplay',1)if r['owner'].startswith('UnityEngine.')else None
  name=re.sub(r'`\d+$','',r['name'])if r['kind']=='type'else symbolName
  candidates=index.get((alias,name),[])if alias else []
  candidates=[c for c in candidates if (c['kind']=='type')==(r['kind']=='type')]
  milestone=ownership(r['ownerCanonical']);ns=r['namespace'];priority='P0'if milestone in {'M20','M21','M22','M23','M24','M25','M27'}and ns in {'UnityEngine','UnityEngine.SceneManagement','UnityEngine.Events'}else 'P2'if milestone=='M39'else 'P1'
  unique[rid]={'id':rid,'owner':r['ownerCanonical'],'namespace':ns,'member':r['name'],'kind':r['kind'],'declaration':r['declaration'],'parameters':r['parameters'],'returns':r['returns'],'shape':r['shape'],'obsolete':r['obsolete'],'baseType':r['baseType'],'milestone':milestone,'priority':priority,'status':'partial'if candidates else 'pending','reason':'Alias declaration candidate only; no matching-signature or behavior credit'if candidates else 'No explicit mapped SDK declaration','candidateDeclarations':candidates,'provenance':[proof],'source':'https://unity.com/releases/editor/whats-new/6000.3.27f1'}
 records=sorted(unique.values(),key=lambda r:r['id']);data=b''.join(encode(r)for r in records);output=ROOT/'docs/compatibility';(output/'native-api.jsonl.gz').write_bytes(gzip.compress(data,mtime=0));areas={}
 for r in records:
  area=areas.setdefault(r['milestone'],{'records':0,'partial':0,'pending':0,'P0':0,'P1':0,'P2':0,'nativeVerified':0,'behaviorVerified':0});area['records']+=1;area[r['status']]+=1;area[r['priority']]+=1
 sources={name:json.loads((a.sources/(name+'-binary.json')).read_text())for name in ['editor','android','ios']}
 result={'schemaVersion':1,'unityVersion':'6000.3.27f1','profile':'Windows editor managed exports plus Android/iOS editor extensions; declared public/protected members in Unity namespaces; inherited members and property/event accessors are not duplicated','sourceMetadataSha256':digest(a.metadata.read_bytes()),'inventorySha256':digest(data),'records':len(records),'aliasCandidateRecords':sum(r['status']=='partial'for r in records),'nativeSourceVerified':0,'behaviorSignatureVerified':0,'nativeSourceVerifiedPercent':0,'behaviorSignatureVerifiedPercent':0,'kindCounts':dict(collections.Counter(r['kind']for r in records)),'areas':dict(sorted(areas.items())),'assemblies':assemblies,'binarySources':sources,'rawDeclaredRecords':sum(r['publicContract']for r in raw),'deduplication':'Canonical owner, kind, name, generic arity, parameter/return types and static flag; all source assembly hashes retained','scopeLimits':['Other target-platform assembly deltas remain separate M37 profiles','External package UIDs have a separate inventory/version registry','No Unity executable, vendor method body or live account is used by this inventory or shipped with Engine'],'effortBasis':'Assigned declared-target signature counts; relative scope, not development hours or measured complexity'}
 (output/'native-snapshot.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({'records':len(records),'aliasCandidates':result['aliasCandidateRecords'],'assemblies':len(assemblies),'sha256':digest(data)}))
if __name__=='__main__':main()
