import {mkdir,lstat,open,rename,rm,readdir} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
export const fail=message=>Object.assign(new Error(message),{code:'AX_WORKSPACE_0001'});
export async function folder(path){await mkdir(path,{recursive:true});const s=await lstat(path);if(!s.isDirectory()||s.isSymbolicLink())throw fail('Workspace directory cannot be a link');return path;}
export async function readJson(path){const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||s.size>1024*1024)throw fail('Invalid workspace journal');const f=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{const a=await f.stat();if(a.ino!==s.ino||a.dev!==s.dev||a.nlink!==1)throw fail('Journal changed during read');return JSON.parse(await f.readFile('utf8'));}finally{await f.close();}}
export async function writeJson(path,value){const bytes=JSON.stringify(value);if(Buffer.byteLength(bytes)>1024*1024)throw fail('Workspace journal exceeds 1 MiB');const temporary=path+'.'+randomUUID()+'.tmp';try{const f=await open(temporary,'wx',0o600);try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}await rename(temporary,path);}finally{await rm(temporary,{force:true});}}
export async function destinationFolder(path,created){try{await mkdir(path);created.push(path);}catch(e){if(e.code!=='EEXIST')throw e;}const s=await lstat(path);if(!s.isDirectory()||s.isSymbolicLink())throw fail('Destination directory cannot be a link');}
// Promotion copies only regular files. Caller rolls back newly created files on failure.
export async function promote(from,to,created,budget={bytes:0,files:0},allowed=null,directories=[]){
 const source=await lstat(from);if(!source.isDirectory()||source.isSymbolicLink())throw fail('Overlay directory cannot be a link');
 await destinationFolder(to,directories);
 for(const name of await readdir(from)){
  if(allowed&&!allowed.includes(name))continue;
  const src=join(from,name),dst=join(to,name),s=await lstat(src);
  if(s.isSymbolicLink()||(!s.isDirectory()&&(!s.isFile()||s.nlink!==1)))throw fail('Overlay contains a linked or unsupported entry');
  if(s.isDirectory()){await promote(src,dst,created,budget,null,directories);continue;}
  budget.bytes+=s.size;budget.files++;if(budget.bytes>256*1024*1024||budget.files>4096)throw fail('Overlay promotion exceeds limits');
  const input=await open(src,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
  try{const a=await input.stat();if(a.ino!==s.ino||a.dev!==s.dev||a.nlink!==1)throw fail('Overlay changed during promotion');const bytes=await input.readFile();let out;try{out=await open(dst,'wx',0o600);}catch(e){if(e.code!=='EEXIST')throw e;const existing=await lstat(dst);if(!existing.isFile()||existing.isSymbolicLink()||existing.nlink!==1||existing.size!==bytes.length)throw fail('Published resource conflicts with overlay');const f=await open(dst,constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{if(!(await f.readFile()).equals(bytes))throw fail('Published resource differs');}finally{await f.close();}continue;}created.push(dst);try{await out.writeFile(bytes);await out.sync();}finally{await out.close();}}
  finally{await input.close();}
 }
}
