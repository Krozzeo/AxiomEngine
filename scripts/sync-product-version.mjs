import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(pkg.version))throw Error('Prepared product releases require a stable numeric version.');
for(const [name,field] of [['platform/product.json','productVersion'],['axiom.project-state.json','engineVersion']]){const path=new URL(name,root),value=JSON.parse(await readFile(path,'utf8'));value[field]=pkg.version;if(field==='engineVersion')value.updatedAt=new Date().toISOString().slice(0,10);await writeFile(path,JSON.stringify(value,null,2)+'\n');}
console.log('Product descriptor/state synchronized to package '+pkg.version);

if(process.env.npm_lifecycle_event==='version')execFileSync('git',['-c','safe.directory='+fileURLToPath(root),'-C',fileURLToPath(root),'add','platform/product.json','axiom.project-state.json']);
