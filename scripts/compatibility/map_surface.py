"""Deterministic conservative mapping. A name match is never verified conformance."""
import argparse,collections,gzip,hashlib,json,re
from pathlib import Path
from inventory import ROOT,encode,digest

def member_name(record):
    if record['kind']=='type': return record['owner'].split('.')[-1]
    declaration=record['declaration']
    if record['kind']=='constructors': return '.ctor'
    if 'operator ' in declaration:
        op=re.search(r'operator\s*([^\s(]+)',declaration)
        return 'operator '+op[1] if op else 'unresolved-operator'
    if '(' in declaration:
        found=re.search(r'([\w]+)(<[^()]+>)?\s*\(',declaration)
        if found:return found[1]+('`'+str(found[2].count(',')+1) if found[2] else '')
    return re.sub(r'\(\)$','',record['member'] or '').split('<')[0]

def build(directory,sdk_path):
    snapshot=json.loads((directory/'snapshot.json').read_text(encoding='utf-8'))
    sdk=json.loads(sdk_path.read_text(encoding='utf-8-sig'));index=collections.defaultdict(list)
    for item in sdk['records']:index[(item['owner'],item['name'])].append(item)
    records=[json.loads(l)for l in gzip.decompress((directory/'unity-6000.3-api.jsonl.gz').read_bytes()).splitlines()]
    assert digest(b''.join(encode(r)for r in records))==snapshot['inventorySha256']
    mappings=[];areas={}
    for record in records:
        alias=record['owner'].replace('UnityEngine','Axiom.Gameplay',1) if record['owner'].startswith('UnityEngine') else None
        name=member_name(record);candidates=index.get((alias,name),[]) if alias else []
        if record['kind']=='type':candidates=[v for v in candidates if v['kind']=='type']
        else:candidates=[v for v in candidates if v['kind']!='type']
        status='out-of-scope' if record.get('publicApi') is False or record['kind']=='module' else 'blocked' if record['status']=='blocked' or record['kind']=='documentation-contract' else 'partial' if candidates else 'pending'
        reason='Confirmed non-public declaration or module metadata; retained in the catalog' if status=='out-of-scope' else 'Public code shape is unavailable in the frozen sources; identity and denominator are retained for explicit audit' if status=='blocked' else 'Explicit alias surface exists; namespace, overload, numeric and behavior compatibility are not certified' if candidates else 'No matching explicit declaration in the mapped SDK namespace'
        mappings.append({'id':record['id'],'status':status,'name':name,'reason':reason,'candidateDeclarations':candidates,'nativeUnitySourceVerified':False,'behaviorVerified':False})
        area=areas.setdefault(record['milestone'],{'records':0,'types':0,'partial':0,'pending':0,'blocked':0,'out-of-scope':0,'P0':0,'P1':0,'P2':0,'nativeVerified':0,'behaviorVerified':0})
        area['records']+=1;area['types']+=record['kind']=='type';area[status]+=1;area[record['priority']]+=1
    sources={p.name:digest(p.read_bytes())for p in sorted((ROOT/'engine/scripting/templates').glob('*.cs'))}
    summary={'schemaVersion':1,'unitySnapshotSha256':snapshot['inventorySha256'],'sdkVersion':8,'sdkDeclarationCount':len(sdk['records']),'sdkSourceHashes':sources,'targetRecords':len(records),'nativeSourceVerified':0,'behaviorSignatureVerified':0,'nativeSourceVerifiedPercent':0,'behaviorSignatureVerifiedPercent':0,'aliasCandidateRecords':sum(m['status']=='partial' for m in mappings),'areas':dict(sorted(areas.items())),'classificationRules':{'partial':'Exact owner alias and member name/generic arity candidate; not an overload or behavior acceptance','pending':'No explicit mapped declaration','blocked':'Reference identity unresolved; never removed from denominator','verified':'Requires exact mapped signature and attributed positive, negative and lifecycle results; currently zero'},'effortBasis':'Audited target record counts per assigned milestone; relative scope only, not hours or complexity estimates','corePackageSeparation':'Core documentation snapshot retained in full. External package versions/inventories are separate; never reduce this denominator.'}
    (directory/'mapping.jsonl.gz').write_bytes(gzip.compress(b''.join(encode(r)for r in mappings),mtime=0))
    (directory/'sdk8-surface.json').write_bytes(encode(sdk))
    (directory/'coverage.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'records':len(records),'aliasCandidates':summary['aliasCandidateRecords'],'nativeVerified':0,'areas':len(areas)}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('sdk',type=Path);p.add_argument('--directory',type=Path,default=ROOT/'docs/compatibility');a=p.parse_args();build(a.directory,a.sdk)
