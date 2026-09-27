import {spawn} from 'node:child_process';
export function runCompiler(args,{cwd,signal,timeoutMs=180000,executable='dotnet'}={}) {
  return new Promise((resolve,reject)=>{
    if(signal?.aborted)return reject(Object.assign(new Error('Compilation cancelled'),{code:'AX_SCRIPT_0001'}));
    const child=spawn(executable,args,{cwd,shell:false,windowsHide:true,detached:process.platform!=='win32',env:{...process.env,DOTNET_CLI_TELEMETRY_OPTOUT:'1',DOTNET_NOLOGO:'1'},stdio:['ignore','pipe','pipe']});
    let output='',bytes=0,reason=null,settled=false;
    const stop=message=>{reason=message;if(child.pid){if(process.platform==='win32'){const killer=spawn('taskkill',['/pid',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',shell:false});killer.on('error',()=>child.kill());}else{try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}}}};
    const abort=()=>stop('Compilation cancelled');
    const timer=setTimeout(()=>stop('Compilation timed out'),timeoutMs);
    signal?.addEventListener('abort',abort,{once:true});
    const collect=chunk=>{bytes+=chunk.length;if(bytes>256*1024){stop('Compiler diagnostic limit exceeded');return;}output+=chunk.toString();};
    child.stdout.on('data',collect);child.stderr.on('data',collect);
    const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve(result);};
    child.on('error',error=>finish(Object.assign(new Error(error.code==='ENOENT'?'Install .NET 10 SDK and wasm-tools to compile C# scripts':error.message),{code:'AX_SCRIPT_0001'})));
    child.on('close',code=>finish(null,{code,output,reason}));
  });
}
export function compileDiagnostics(output) {
  return output.split(/\r?\n/).flatMap(line=>{const match=line.match(/Game\.cs\((\d+),(\d+)\):\s*(error|warning)\s+([A-Z]+\d+):\s*(.*?)(?:\s+\[.*\])?$/);return match?[{file:'Game.cs',line:Number(match[1]),column:Number(match[2]),severity:match[3],code:match[4],message:match[5].slice(0,1000)}]:[];}).slice(0,64);
}
