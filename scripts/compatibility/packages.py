"""Freeze package recommendations and DocFX UID inventories separately from core."""
import argparse,concurrent.futures,gzip,hashlib,json,re,urllib.request,zipfile
from pathlib import Path
from inventory import encode,digest,ROOT,text

def scalar(s):
    s=s.strip()
    if s.startswith('"'):return json.loads(s)
    if s.startswith("'") and s.endswith("'"):return s[1:-1].replace("''", "'")
    return s

def xrefs(raw):
    record={}
    for line in raw.decode('utf-8-sig').splitlines()+['- uid: END']:
        if line.startswith('- uid: '):
            if record.get('commentId','')[:2] in {'T:','M:','P:','F:','E:'} and record.get('href','').startswith('api/'):
                yield {k:record[k] for k in ['uid','commentId','href']}
            record={'uid':scalar(line[7:])}
        elif line.startswith('  commentId: '):record['commentId']=scalar(line[13:])
        elif line.startswith('  href: '):record['href']=scalar(line[8:])

def main():
    p=argparse.ArgumentParser();p.add_argument('archive',type=Path);p.add_argument('cache',type=Path);args=p.parse_args();args.cache.mkdir(parents=True,exist_ok=True)
    z=zipfile.ZipFile(args.archive);catalog=[]
    for name in z.namelist():
        if not re.fullmatch(r'Documentation/en/Manual/com\.unity\.[^/]+\.html',name):continue
        raw=z.read(name);html=raw.decode('utf-8-sig');package=Path(name).stem
        version=re.search(r'Package version\s+([\w.+-]+)\s+is released for Unity Editor version\s+6000\.3',text(html))
        href=re.search(r'href="(https://docs\.unity3d\.com/Packages/[^" ]+)/manual/index\.html"',html)
        if not version and not href:continue # built-in module manual pages have no independent package release
        catalog.append({'name':package,'version':version[1] if version else None,'recommendationPage':'https://docs.unity3d.com/6000.3/Documentation/Manual/'+package+'.html','recommendationSha256':digest(raw),'docs':href[1] if href else None})
    def fetch(item):
        item={**item,'status':'blocked','milestone':'M39','verifiedMembers':0,'records':0}
        if not item['version'] or not item['docs']:item['reason']='No exact recommended version or API documentation branch in frozen source';return item,[]
        url=item['docs']+'/xrefmap.yml';cache=args.cache/(item['name']+'@'+item['version']+'.yml')
        try:
            if cache.exists():raw=cache.read_bytes()
            else:
                with urllib.request.urlopen(url,timeout=30) as response:
                    raw=response.read(32*1024*1024+1)
                if len(raw)>32*1024*1024:raise ValueError('Package reference exceeds download budget')
                cache.write_bytes(raw)
            if not raw.startswith(b'### YamlMime:XRefMap'):raise ValueError('No DocFX API inventory')
            records=[{'id':'package:'+digest((item['name']+'@'+item['version']+':'+r['commentId']).encode())[:24],'package':item['name'],'version':item['version'],'milestone':'M39','status':'pending',**r}for r in xrefs(raw)]
            unique={r['id']:r for r in records};item.update(status='inventoried',records=len(unique),xrefUrl=url,xrefSha256=digest(raw),versionEvidence='Exact recommendation from frozen Unity6.3 manual. Documentation minor-branch snapshot is hashed; compiled package binary equivalence remains unverified.');return item,list(unique.values())
        except Exception as error:item['reason']='API inventory unavailable: '+str(error);return item,[]
    allrecords=[];results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for item,records in pool.map(fetch,sorted(catalog,key=lambda r:r['name'])):
            results.append(item);allrecords.extend(records);print(json.dumps({'package':item['name'],'status':item['status'],'records':item['records']}),flush=True)
    output=ROOT/'docs/compatibility';allrecords.sort(key=lambda r:r['id']);data=b''.join(encode(r)for r in allrecords)
    (output/'packages.json').write_text(json.dumps({'schemaVersion':1,'scope':'External packages only; separate denominator, zero implementation credit. Blocked entries remain visible and prevent whole-package completion.','records':len(allrecords),'inventorySha256':digest(data),'packages':results},indent=2)+'\n',encoding='utf-8')
    (output/'package-api.jsonl.gz').write_bytes(gzip.compress(data,mtime=0))

if __name__=='__main__':main()
