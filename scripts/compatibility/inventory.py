"""Extract API interface facts, never implementation/example/prose, from frozen official docs.

Raw licensed documentation stays outside Git. No network request occurs during generation.
"""
import argparse, collections, gzip, hashlib, html, json, re, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREFIX = 'Documentation/en/ScriptReference/'
GROUPS = {'Classes':'class','Structs':'struct','Structures':'struct','Enumerations':'enum','Interfaces':'interface','Delegates':'delegate','Attributes':'attribute','Modules':'module'}

def digest(data): return hashlib.sha256(data).hexdigest()
def text(value): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]*>', '', value))).strip()
def hrefs(value): return re.findall(r'href="([^"#]+)\.html"', value)
def encode(value): return (json.dumps(value, ensure_ascii=False, separators=(',',':'))+'\n').encode()

def canonical_type(key, namespace):
    route='.'.join(re.sub(r'_(\d+)$',lambda m:'`'+m[1],p) for p in key.split('.'))
    if route.startswith(('UnityEngine.','UnityEditor.','Unity.')):return route
    ns=namespace.split('.');parts=route.split('.')
    overlap=max([n for n in range(1,min(len(ns),len(parts))+1) if ns[-n:]==parts[:n]] or [0])
    return '.'.join(ns+parts[overlap:])

def toc_types(node, namespace='', parents=(), kind=None):
    title, link = node.get('title',''), node.get('link')
    if link in (None,'null','toc'):
        if title in GROUPS: kind = GROUPS[title]
        elif title.startswith(('UnityEngine','UnityEditor','Unity.')) or title == 'Unity': namespace, parents = title, ()
    else:
        yield link, {'name':'.'.join(filter(None,[namespace,*parents,title])), 'namespace':namespace, 'kind':kind or 'type'}
        parents = (*parents,title)
    for child in node.get('children') or []: yield from toc_types(child,namespace,parents,kind)

def ownership(name, module=''):
    # Ordered rules are the adopted implementation responsibility, not Unity metadata.
    n = name.replace('UnityEngine.','')
    if name.startswith('UnityEditor'): return 'M38'
    if name.startswith('Unity.') or not name.startswith('UnityEngine.'): return 'M39'
    if re.search(r'Android|iOS|Apple|Windows|WSA|XR|VR|Location|Microphone|WebCam|Handheld|SystemInfo|Application|Screen|Cursor|Device|Gizmos',n): return 'M37'
    if re.search(r'Networking|UnityWebRequest|DownloadHandler|UploadHandler|Network|WWW',n): return 'M36'
    if re.search(r'NavMesh|AI\.',n): return 'M35'
    if re.search(r'Particle|Terrain|Tree|Video|Tilemap|Sprite|Grid|WindZone|LODGroup',n): return 'M34'
    if re.search(r'Joint.*2D|Effector2D',n): return 'M28'
    if re.search(r'Physics2D|Rigidbody2D|Collider2D|RaycastHit2D|Contact.*2D|Collision2D|PhysicsScene2D|PhysicsMaterial2D',n): return 'M27'
    if re.search(r'Joint|Articulation|CharacterController|WheelCollider|Cloth|Rigidbody',n): return 'M26'
    if re.search(r'Physics|Collider|Collision|RaycastHit|Contact|PhysicMaterial',n): return 'M25'
    if re.search(r'Audio|AudioClip|AudioListener',n): return 'M32'
    if re.search(r'Animation|Animator|Avatar|Human|Playables|Playable|Motion|Rigging|RigBuilder',n): return 'M31'
    if re.search(r'Canvas|EventSystems|RectTransform',n): return 'M33'
    if re.search(r'Rendering|Render|Shader|Material|Texture|Mesh|Camera|Light|Graphics|Compute|GL\b|Quality|ColorSpace|Cubemap|Buffer',n): return 'M30'
    if re.search(r'(^|\.)UI(\.|$)|Text|Font|GUI(?!D)|GUILayout',n): return 'M33'
    if re.search(r'Input|KeyCode|Touch|Gyro|Accelerometer|Compass|Sensor',n): return 'M29'
    if re.search(r'SceneManagement|Resources|AssetBundle|AsyncOperation|Caching|Unload',n): return 'M24'
    if re.search(r'Serialize|Serialization|ScriptableObject|Prefab|PlayerPrefs|JsonUtility',n): return 'M23'
    if re.search(r'Time|Yield|Wait|Coroutine|Events|Event|Awaitable|Cancellation|Behaviour|Debug|Logger|LogType',n): return 'M22'
    if re.search(r'Vector|Quaternion|Mathf|Matrix|Bounds|Plane|Ray\b|Rect\b|Color|Random|Hash128|Geometry|Pose|LayerMask',n): return 'M21'
    if n in {'Object','GameObject','Component','Transform','Behaviour','MonoBehaviour'}: return 'M20'
    return 'M39'

def parse_archive(path, reference=(), member_reference=()):
    member_index=collections.defaultdict(list)
    for fact in member_reference:member_index[(fact['owner'],re.sub(r'<[^>]+>','',fact['name']))].append(fact)
    z = zipfile.ZipFile(path)
    rawtoc = z.read(PREFIX+'docdata/toc.js')
    toc = json.loads(rawtoc[rawtoc.index(b'{'):].strip().rstrip(b';'))
    types = dict(toc_types(toc)); toc_count=len(types); pages = {}; groups = {}; excluded = []
    for info in z.infolist():
        if not info.filename.startswith(PREFIX) or not info.filename.endswith('.html') or '/' in info.filename[len(PREFIX):]: continue
        key = info.filename[len(PREFIX):-5]; raw = z.read(info); source = raw.decode('utf-8-sig')
        heading = re.search(r'<h1[^>]*>(.*?)</h1>', source, re.S)
        if not heading or key in {'index','toc'}:
            excluded.append({'page':key,'sha256':digest(raw),'reason':'no API heading (navigation/index page)'}); continue
        if not text(heading[1]):
            excluded.append({'page':key,'sha256':digest(raw),'reason':'empty API heading and no declared identity; retained tombstone, no signature invented'}); continue
        ns = re.search(r'<p[^>]*>\s*(class|struct|enum|interface|delegate) in\s*([^<]+)</p>',source,re.S)
        if ns:types[key]={'name':canonical_type(key,text(ns[2])),'namespace':text(ns[2]),'kind':ns[1]}
        elif key in types:
            types[key]['name']=canonical_type(key,types[key]['namespace'])
            if key.startswith(('UnityEngine.','UnityEditor.')) and key.endswith('Module'):types[key]['kind']='module'
        parentlinks = hrefs(heading[1]); parent = parentlinks[0] if parentlinks else (key[:-5] if key.endswith('-ctor') else None)
        signatures = [text(s).removeprefix('Declaration').strip() for s in re.findall(r'<div class="signature-CS sig-block">(.*?)</div>',source,re.S)]
        signatures = list(dict.fromkeys(s for s in signatures if s))
        inherited = re.search(r'Inherits from:(.*?)</p>',source,re.S)
        module = re.search(r'Implemented in:(.*?)</p>',source,re.S)
        page = {'sha256':digest(raw),'heading':text(heading[1]),'member':text(re.sub(r'^.*?</a>\s*\.','',heading[1],count=1,flags=re.S)) if parentlinks else text(heading[1]),'parent':parent,'signatures':signatures,'inherits':hrefs(inherited[1]) if inherited else [],'module':text(module[1]) if module else None,'obsolete':bool(re.search(r'class="obsolete"|class="obsolete-warning"|<strong>Obsolete</strong>',source)), 'groups':{}}
        for group, table in re.findall(r'<h3[^>]*>([^<]+)</h3>\s*(<table class="list">.*?</table>)',source,re.S):
            for href in re.findall(r'<td class="lbl">\s*<a href="([^"]+)\.html"',table):
                groups.setdefault(href,[]).append((key,text(group)))
        pages[key] = page
    resolutions = {}; type_index=collections.defaultdict(list)
    for fact in reference:
        parts=fact.get('ownerCanonical',fact['owner']).split('.')
        for i in range(len(parts)):type_index['.'.join(parts[i:])].append(fact)
    def resolve_type(key, heading=None):
        base = '.'.join(re.sub(r'_(\d+)$',lambda m:'`'+m[1],part) for part in key.split('.'))
        candidates = type_index.get(base,[])
        names = set(t['owner'] for t in candidates)
        if len(names)!=1:return None
        fact=candidates[0]; name=fact.get('ownerCanonical',fact['owner'])
        # Canonical generic arity comes from source, not potentially broken display headings.
        resolutions[key]={'owner':name,'namespace':fact['ns'],'referenceFiles':sorted(set(t['source']for t in candidates))}
        return {'name':name,'namespace':fact['ns'],'kind':fact['kind'].removesuffix('Declaration').lower()}
    for key,p in pages.items():
        if key not in types:
            resolved=resolve_type(key,p['heading'])
            if resolved:types[key]=resolved
    for p in pages.values():
        key=p['parent']
        if key and key not in types:
            resolved=resolve_type(key)
            if resolved:types[key]=resolved
    records=[]
    for key,p in sorted(pages.items()):
        typ = types.get(key); ownerkey = key if typ else p['parent']; owner = types.get(ownerkey)
        if not owner:
            # Preserve every unresolved API page in the denominator, visibly blocked.
            owner = {'name':'unresolved:'+str(ownerkey or key),'namespace':'unresolved','kind':'unresolved'}
        group = next((g for t,g in groups.get(key,[]) if t==ownerkey),None)
        if group and len(group)>80: raise ValueError('Invalid member category')
        name = owner['name']; member = p['member']
        if typ: kind='module' if typ['kind']=='module' else 'type'; declarations=p['signatures'] if typ['kind']=='delegate' and p['signatures'] else [typ['kind']+' '+name]
        elif owner['kind']=='enum': kind='enum-value'; declarations=['enum-value '+name+'.'+member]
        elif p['signatures']: kind=(group or 'declaration').lower().replace(' ','-'); declarations=p['signatures']
        else:
            kind='message' if group=='Messages' else 'documentation-contract'
            short='.ctor' if '-ctor' in key else re.sub(r'<[^>]+>','',member.split('(')[0])
            facts=member_index.get((re.sub(r'<[^>]+>|`[0-9]+','',name),short),[])
            public=[f for f in facts if f.get('publicContract',True)]
            if public:facts=public
            p['publicApi']=bool(public) if facts else None
            if kind!='message' and facts:
                kind='reference-declaration'; declarations=list(dict.fromkeys(text(f['declaration']) for f in facts))
                p['referenceDeclarations']=[{'source':f['source'],'declaration':text(f['declaration']),'assemblySha256':f.get('assemblySha256'),'publicContract':f.get('publicContract',True)}for f in facts]
            else:declarations=[kind+' '+name+'.'+member]
        for declaration in declarations:
            identity=name+'|'+kind+'|'+declaration
            milestone=ownership(name,p['module'] or '')
            record={'id':'unity63:'+digest(identity.encode())[:24], 'owner':name,'namespace':owner['namespace'],'member':None if typ else member,'kind':kind,'declaration':declaration,'page':key,'pageSha256':p['sha256'],'module':p['module'] or pages.get(ownerkey,{}).get('module'),'inherits':p['inherits'] if typ else [],'obsolete':p['obsolete'],'milestone':milestone,'priority':'P0' if milestone in {'M20','M21','M22','M23','M24','M25','M27'} and owner['namespace']=='UnityEngine' else 'P1' if milestone!='M39' else 'P2','status':'blocked' if owner['namespace']=='unresolved' else 'pending','platform':('editor-only' if owner['namespace'].startswith('UnityEditor') else 'platform-adapter' if re.search(r'Android|iOS|WSA|QNX|Windows|Apple|XR|VR',name) else 'common-public-contract'), 'platformEvidence':'namespace/profile classification; runtime/device availability requires conformance','publicApi':p.get('publicApi'),'referenceDeclarations':p.get('referenceDeclarations',[]),'codeShape':('not-stated' if kind in {'message','documentation-contract'} else 'reference-supplement' if kind=='reference-declaration' else 'documented'),'source':'https://docs.unity3d.com/6000.3/Documentation/ScriptReference/'+key+'.html'}
            records.append(record)
    unique = {}; aliases = []
    for record in records:
        if record['id'] in unique:
            prior = unique[record['id']]
            assert all(record[k] == prior[k] for k in ['owner','kind','declaration'])
            alias = {k:record[k] for k in ['page','pageSha256','source']}
            prior.setdefault('sourceAliases',[]).append(alias); aliases.append(alias)
        else: unique[record['id']] = record
    records = sorted(unique.values(),key=lambda r:r['id'])
    return records, {'typeIdentityResolutions':resolutions,'duplicateDeclarationAliases':aliases,'tocSha256':digest(rawtoc),'pages':len(pages),'excludedNavigationPages':excluded,'tocTypes':toc_count,'resolvedTypes':len(types),'sourcePageHashes':{k:p['sha256'] for k,p in sorted(pages.items())}}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('archive',type=Path);parser.add_argument('--output',type=Path,default=ROOT/'docs/compatibility');parser.add_argument('--reference-types',type=Path);parser.add_argument('--reference-members',type=Path);parser.add_argument('--reference-source',type=Path);args=parser.parse_args()
    data=args.archive.read_bytes();archivehash=digest(data)
    records,provenance=parse_archive(args.archive,json.loads(args.reference_types.read_text(encoding='utf-8-sig')) if args.reference_types else (),json.loads(args.reference_members.read_text(encoding='utf-8-sig')) if args.reference_members else ())
    if args.reference_source:provenance['referenceSource']=json.loads(args.reference_source.read_text(encoding='utf-8'))
    args.output.mkdir(parents=True,exist_ok=True)
    payload=b''.join(encode(r) for r in records)
    (args.output/'unity-6000.3-api.jsonl.gz').write_bytes(gzip.compress(payload,mtime=0))
    (args.output/'snapshot.json').write_bytes(encode({'schemaVersion':1,'unityVersion':'6000.3 LTS','capturedDate':'2026-10-24','archiveUrl':'https://cloudmedia-docs.unity3d.com/docscloudstorage/6000.3/UnityDocumentation.zip','archiveSha256':archivehash,'archiveBytes':len(data),'inventorySha256':digest(payload),'records':len(records),'scope':'All English ScriptReference API pages in frozen official offline archive; external packages and newer Unity versions separate. Signature-less messages/enum values/contracts remain visible.','kindCounts':dict(collections.Counter(r['kind'] for r in records)),**provenance}))
    print(json.dumps({'records':len(records),'types':provenance['tocTypes'],'pages':provenance['pages'],'blocked':sum(r['status']=='blocked' for r in records),'sha256':digest(payload)}))

if __name__=='__main__': main()
