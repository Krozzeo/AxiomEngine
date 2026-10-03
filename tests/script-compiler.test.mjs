import test from 'node:test';
import assert from 'node:assert/strict';
import {runCompiler,compileDiagnostics,compilerEnvironment,resolveCompiler} from '../daemon/bootstrap/scripting/process.mjs';

test('Windows compiler resolves dotnet.exe across PATH casing and standard installation roots',()=>{
 const env={PATH:'C:\\node',Path:'C:\\SDK tools',ProgramFiles:'C:\\Program Files'};
 const normalized=compilerEnvironment(env,'win32');assert.equal(normalized.PATH,undefined);assert.equal(normalized.Path,'C:\\node;C:\\SDK tools');
 assert.equal(resolveCompiler('dotnet',normalized,'win32',p=>p==='C:\\SDK tools\\dotnet.exe'),'C:\\SDK tools\\dotnet.exe');
 assert.equal(resolveCompiler('dotnet',normalized,'win32',p=>p==='C:\\Program Files\\dotnet\\dotnet.exe'),'C:\\Program Files\\dotnet\\dotnet.exe');
 assert.equal(resolveCompiler('dotnet',{DOTNET_ROOT:'D:\\custom sdk'},'win32',p=>p==='D:\\custom sdk\\dotnet.exe'),'D:\\custom sdk\\dotnet.exe');
 assert.equal(resolveCompiler('dotnet',{},'linux',()=>{throw Error('must not inspect Windows paths');}),'dotnet');
});

test('spawn failures expose the executable and working directory instead of claiming workloads are missing',async()=>{
 await assert.rejects(runCompiler([],{executable:'axiom-missing-compiler-12345',cwd:process.cwd()}),e=>e.code==='AX_SCRIPT_0001'&&/ENOENT/.test(e.message)&&e.message.includes('axiom-missing-compiler-12345')&&e.message.includes(process.cwd())&&!e.message.includes('Install .NET'));
 await assert.rejects(runCompiler([],{executable:process.execPath,cwd:'/axiom-missing-directory-12345'}),/working directory.*axiom-missing-directory/);
});

test('compiler process preserves argument boundaries without invoking a shell',async()=>{
 const literal='space ; & | $value';
 const result=await runCompiler(['-e','console.log(process.argv[1])',literal],{cwd:process.cwd(),executable:process.execPath,timeoutMs:3000});
 assert.equal(result.code,0);assert.equal(result.output.trim(),literal);assert.equal(result.reason,null);
});

test('compiler cancellation, timeout and diagnostic limits terminate owned processes',async()=>{
 const controller=new AbortController();const pending=runCompiler(['-e','setInterval(()=>{},1000)'],{cwd:process.cwd(),executable:process.execPath,signal:controller.signal,timeoutMs:3000});controller.abort();assert.match((await pending).reason,/cancelled/);
 const timed=await runCompiler(['-e','setInterval(()=>{},1000)'],{cwd:process.cwd(),executable:process.execPath,timeoutMs:100});assert.match(timed.reason,/timed out/);
 const noisy=await runCompiler(['-e','process.stdout.write("x".repeat(300000));setInterval(()=>{},1000)'],{cwd:process.cwd(),executable:process.execPath,timeoutMs:3000});assert.match(noisy.reason,/diagnostic limit/);assert.ok(Buffer.byteLength(noisy.output)<=256*1024);
});

test('C# diagnostics expose source line/column and remain bounded',()=>{
 const entries=compileDiagnostics('/project/build/Game.cs(12,8): error CS1002: ; expected [/project/build/Axiom.Game.csproj]\n/project/build/Game.cs(3,4): warning CS0169: unused field [Axiom.Game.csproj]');
 assert.deepEqual(entries[0],{file:'Game.cs',line:12,column:8,severity:'error',code:'CS1002',message:'; expected'});assert.equal(entries[1].severity,'warning');assert.equal(compileDiagnostics('Game.cs(1,1): error CS1002: test\n'.repeat(100)).length,64);
});

test('compiler capability accepts only fixed development and AOT templates',async()=>{
 const {compilerArguments,CSHARP_COMPILER}=await import('../daemon/bootstrap/scripting/capability.mjs');
 assert.equal(CSHARP_COMPILER.executable,'dotnet');
 assert.ok(!compilerArguments().some(arg=>arg.startsWith('-p:RunAOTCompilation=')));
 assert.ok(compilerArguments('aot').includes('-p:RunAOTCompilation=true'));
 assert.ok(compilerArguments().includes('--disable-build-servers'));
 for(const mode of ['../escape','development -p:CustomAfterMicrosoftCommonTargets=evil',null,{}])assert.throws(()=>compilerArguments(mode),/Unsupported/);
});
