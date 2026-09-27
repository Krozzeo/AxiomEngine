import test from 'node:test';
import assert from 'node:assert/strict';
import {runCompiler,compileDiagnostics} from '../daemon/bootstrap/scripting/process.mjs';

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
 assert.ok(compilerArguments().includes('-p:RunAOTCompilation=false'));
 assert.ok(compilerArguments('aot').includes('-p:RunAOTCompilation=true'));
 assert.ok(compilerArguments().includes('--disable-build-servers'));
 for(const mode of ['../escape','development -p:CustomAfterMicrosoftCommonTargets=evil',null,{}])assert.throws(()=>compilerArguments(mode),/Unsupported/);
});
