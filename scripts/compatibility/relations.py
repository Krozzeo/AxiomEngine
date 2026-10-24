"""Generate independent type-delta and declared inheritance planning artifacts."""
import argparse,gzip,json,collections
from pathlib import Path
from inventory import ROOT,encode,digest,toc_types,canonical_type
def main():
 p=argparse.ArgumentParser();p.add_argument('latest_toc',type=Path);a=p.parse_args();out=ROOT/'docs/compatibility';raw=a.latest_toc.read_bytes();toc=json.loads(raw[raw.index(b'{'):].strip().rstrip(b';'))
 latest={canonical_type(key,t['namespace']) for key,t in toc_types(toc)}
 docs=[json.loads(x)for x in gzip.decompress((out/'unity-6000.3-api.jsonl.gz').read_bytes()).splitlines()]
 baseline={r['owner']for r in docs if r['kind']=='type'}
 delta={'schemaVersion':1,'source':'https://docs.unity3d.com/6000.6/Documentation/ScriptReference/docdata/toc.js','capturedDate':'2026-10-24','sourceSha256':digest(raw),'scope':'Type-name navigation delta only, not a member/signature or behavior comparison. The frozen 6.3 denominator is unchanged. Missing TOC names are not proof of removal.','baselineSnapshotSha256':json.loads((out/'snapshot.json').read_text())['inventorySha256'],'latestTocTypes':len(latest),'onlyLatestToc':sorted(latest-baseline),'onlyBaselineCatalog':sorted(baseline-latest)}
 (out/'unity-6.6-type-delta.json').write_bytes(encode(delta))
 abi=[json.loads(x)for x in gzip.decompress((out/'native-api.jsonl.gz').read_bytes()).splitlines()];types={r['owner']:r for r in abi if r['kind']=='type'}
 relations=[{'owner':r['owner'],'id':r['id'],'baseType':r['baseType'],'interfaces':r['shape'].get('interfaces',[]),'resolution':'in-profile'if r['baseType'] in types else 'external-or-generic-base'}for r in types.values()]
 (out/'inheritance.json').write_bytes(encode({'schemaVersion':1,'basis':'Declared ABI; inheritance is an edge, not copied inherited-member credit','types':sorted(relations,key=lambda r:r['owner'])}))
 meta=json.loads((out/'native-snapshot.json').read_text());total=meta['records'];table=['# M19 measured scope and relative implementation weight','','These are declared signature counts, not implemented percentages, hours or complexity. Cross-cutting GPU/shader/export gates add work beyond these counts. No conversion to historical MVP points is valid. Whole-project effort remains unestimated until vertical batches supply measured throughput.','','| Area | Declared signatures | Share of profile | P0 | Partial name candidates | Verified source / behavior |','| --- | ---: | ---: | ---: | ---: | --- |']
 for name,row in meta['areas'].items():table.append(f"| {name} | {row['records']} | {row['records']/total*100:.2f}% | {row['P0']} | {row['partial']} | 0 / 0 |")
 table+=['','Implementation priority: first M20 object identity/lifetime and M21 numeric contracts, then M22 scheduling, M23 serialization and M24 scenes/resources. Follow roadmap dependencies for physics, renderer, devices and editor APIs. A large signature share is not a priority override.','','M20 first batches: Object equality/null/destroyed wrappers and instance IDs; GameObject/Component ownership/lookups; Transform hierarchy and parenting. Reproduce and close the two corpus discrepancies before widening claims. Keep batches around20–40 audited signatures with exact overloads, bridge, tests and editable examples.']
 (out/'SCOPE_WEIGHTS.md').write_text('\n'.join(table)+'\n',encoding='utf-8');print(json.dumps({'types':len(types),'onlyLatest':len(delta['onlyLatestToc']),'onlyBaseline':len(delta['onlyBaselineCatalog'])}))
if __name__=='__main__':main()
