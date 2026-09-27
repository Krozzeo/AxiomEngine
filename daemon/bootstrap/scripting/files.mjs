import {lstat,mkdir,readdir,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,relative} from 'node:path';
const error=message=>Object.assign(new Error(message),{code:'AX_SCRIPT_0001'});
export async function scriptDirectory(projects,projectId,buildId) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(buildId))throw error('Invalid script build ID');
  const root=await projects.directory();
  let path=root;
  for(const segment of [projects.filename(projectId).replace(/\.json$/,'.scripts'),buildId]) {
    path=join(path,segment);try{await mkdir(path);}catch(e){if(e.code!=='EEXIST')throw e;}const info=await lstat(path);
    if(!info.isDirectory()||info.isSymbolicLink())throw error('Script build directory cannot be a link');
  }
  return path;
}
export async function writeNew(path,text) {const file=await open(path,'wx',0o600);try{await file.writeFile(text);await file.sync();}finally{await file.close();}}
export async function collectBundle(root) {
  let bytes=0;const files=[];
  async function walk(path) {
    for(const name of await readdir(path)) {
      const entry=join(path,name),info=await lstat(entry);
      if(info.isSymbolicLink())throw error('Compiler output contains a link');
      if(info.isDirectory())await walk(entry);
      else {if(!info.isFile()||info.nlink!==1)throw error('Invalid compiler output');bytes+=info.size;files.push(relative(root,entry).replaceAll('\\','/'));if(bytes>128*1024*1024||files.length>1024)throw error('Published bundle exceeds 128 MiB or 1024 files');}
    }
  }
  await walk(root);const boot=files.find(f=>f.endsWith('_framework/dotnet.js'));
  if(!boot)throw error('Compiler did not produce a browser runtime');
  const prefix=boot.slice(0,-'dotnet.js'.length);
  const served=files.filter(f=>f.startsWith(prefix)&&/^[a-zA-Z0-9_.-]+$/.test(f.slice(prefix.length))&&!/\.(br|gz)$/.test(f)).map(f=>f.slice(prefix.length));
  return {framework:prefix,files:served,bytes};
}
export async function readPublished(buildRoot,manifest,name) {
  if(!/^[a-zA-Z0-9_.-]+$/.test(name)||!manifest.files.includes(name))throw error('Runtime file is not published');
  let path=buildRoot;
  for(const segment of ('publish/'+manifest.framework+name).split('/').filter(Boolean)) {
    if(!/^[a-zA-Z0-9_.-]+$/.test(segment)||segment==='.'||segment==='..')throw error('Invalid runtime path');
    path=join(path,segment);const info=await lstat(path);if(info.isSymbolicLink())throw error('Runtime path cannot be a link');
  }
  const before=await lstat(path);if(!before.isFile()||before.nlink!==1||before.size>64*1024*1024)throw error('Invalid runtime file');
  const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{const after=await file.stat();if(after.ino!==before.ino||after.dev!==before.dev||!after.isFile()||after.nlink!==1||after.size>64*1024*1024)throw error('Runtime file changed during read');return await file.readFile();}finally{await file.close();}
}
export async function readManifest(path) {
  const info=await lstat(path);if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||info.size>128*1024)throw error('Invalid script manifest');
  const file=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
  try {
    const after=await file.stat();if(after.ino!==info.ino||after.dev!==info.dev||!after.isFile()||after.nlink!==1||after.size>128*1024)throw error('Script manifest changed during read');
    const value=JSON.parse(await file.readFile('utf8'));
    if(!Array.isArray(value.files)||value.files.length>1024||!value.files.includes('dotnet.js')||value.files.some(name=>typeof name!=='string'||! /^[a-zA-Z0-9_.-]+$/.test(name)||name==='.'||name==='..')||new Set(value.files).size!==value.files.length||typeof value.framework!=='string'||! /^(?:[a-zA-Z0-9_-]+\/)*_framework\/$/.test(value.framework))throw error('Invalid script manifest format');
    return value;
  }finally{await file.close();}
}
