import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {win32} from 'node:path';
export function compilerEnvironment(env=process.env,platform=process.platform) {
 const result={...env,DOTNET_CLI_TELEMETRY_OPTOUT:'1',DOTNET_NOLOGO:'1'};
 // Windows keys are case-insensitive, but Node selects just one when spawning.
 if(platform==='win32'){
  const keys=Object.keys(result).filter(key=>key.toLowerCase()==='path');
  const entries=keys.flatMap(key=>String(result[key]).split(';')).filter(Boolean);
  for(const key of keys)delete result[key];
  result.Path=[...new Set(entries)].join(';');
 }
 return result;
}
export function resolveCompiler(executable,env=process.env,platform=process.platform,fileExists=existsSync) {
 if(platform!=='win32'||!['dotnet','dotnet.exe'].includes(executable))return executable;
 const pathEntries=Object.entries(env).filter(([key])=>key.toLowerCase()==='path').flatMap(([,value])=>String(value).split(';'));
 const directories=[...pathEntries,env.DOTNET_ROOT,env.DOTNET_ROOT_X64,
  env.ProgramW6432&&win32.join(env.ProgramW6432,'dotnet'),env.ProgramFiles&&win32.join(env.ProgramFiles,'dotnet'),
  env.USERPROFILE&&win32.join(env.USERPROFILE,'.dotnet')];
 for(const directory of directories.filter(Boolean)){
  const candidate=win32.join(directory.replace(/^"|"$/g,''),'dotnet.exe');
  if(fileExists(candidate))return candidate;
 }
 return 'dotnet.exe';
}
export function runCompiler(args,{cwd,signal,timeoutMs=180000,executable='dotnet'}={}) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted)return reject(Object.assign(new Error('Compilation cancelled'),{code:'AX_SCRIPT_0001'}));
    const env=compilerEnvironment(),command=resolveCompiler(executable,env);
    const child=spawn(command,args,{cwd,shell:false,windowsHide:true,detached:process.platform!=='win32',env,stdio:['ignore','pipe','pipe']});
    let output='',bytes=0,reason=null,settled=false;
    const stop=message=>{reason=message;if(child.pid){if(process.platform==='win32'){const killer=spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',shell:false});killer.on('error',()=>child.kill());}else{try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}}}};
    const abort=()=>stop('Compilation cancelled');
    const timer=setTimeout(()=>stop('Compilation timed out'),timeoutMs);
    signal?.addEventListener('abort',abort,{once:true});
    const collect=chunk=>{bytes+=chunk.length;if(bytes>256*1024){stop('Compiler diagnostic limit exceeded');return;}output+=chunk.toString();};
    child.stdout.on('data',collect);child.stderr.on('data',collect);
    const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve(result);};
    child.on('error',error=>finish(Object.assign(new Error(`Cannot start C# compiler (${error.code??'spawn error'}): ${command}; working directory: ${cwd??process.cwd()}. ${error.message}`),{code:'AX_SCRIPT_0001'})));
    child.on('close',code=>finish(null,{code,output,reason}));
  });
}
export function compileDiagnostics(output) {
 return output.split(/\r?\n/).flatMap(line=>{const match=line.match(/(?:^|[\/\\])([^\/\\():]+\.cs)\((\d+),(\d+)\):\s*(error|warning)\s+([A-Z]+\d+):\s*(.*?)(?:\s+\[.*\])?$/);return match?[{file:match[1],line:Number(match[2]),column:Number(match[3]),severity:match[4],code:match[5],message:match[6].slice(0,1000)}]:[];}).slice(0,64);
}
