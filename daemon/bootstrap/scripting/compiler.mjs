import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {CSHARP_COMPILER,compilerArguments} from './capability.mjs';
import {runCompiler,compileDiagnostics} from './process.mjs';
import {scriptDirectory,writeNew,collectBundle,readManifest,readPublished} from './files.mjs';
const fail=message=>{throw Object.assign(new Error(message),{code:'AX_SCRIPT_0001'});};
export const GAME_PROJECT=`<Project Sdk="Microsoft.NET.Sdk.WebAssembly">
 <PropertyGroup>
  <OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><RuntimeIdentifier>browser-wasm</RuntimeIdentifier>
  <Nullable>enable</Nullable><ImplicitUsings>enable</ImplicitUsings><AllowUnsafeBlocks>true</AllowUnsafeBlocks>
  <EnableDefaultCompileItems>false</EnableDefaultCompileItems><WasmEnableHotReload>false</WasmEnableHotReload>
  <InvariantGlobalization>false</InvariantGlobalization><WasmBuildNative>false</WasmBuildNative>
 </PropertyGroup>
 <ItemGroup><Compile Include="Sdk.cs"/><Compile Include="GeneratedComponents.cs"/><Compile Include="Host.cs"/><Compile Include="Game.cs"/></ItemGroup>
</Project>\n`;
export class ScriptCompiler {
 constructor(projects){this.projects=projects;}
 async build(projectId,source,mode,signal) {
  if(typeof source!=='string'||Buffer.byteLength(source)>CSHARP_COMPILER.sourceBytes)fail('C# source exceeds 64 KiB');
  const args=compilerArguments(mode),id=randomUUID(),root=await scriptDirectory(this.projects,projectId,id);
  const entry=source.match(/public\s+(?:sealed\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:Axiom\.Gameplay\.)?Script\b/)?.[1]??'GameScript';
  for(const name of ['Sdk.cs','GeneratedComponents.cs','Host.cs']){let text=await readFile(new URL('../../../engine/scripting/templates/'+name,import.meta.url),'utf8');if(name==='Host.cs')text=text.replace('new Game.GameScript','new Game.'+entry);await writeNew(join(root,name),text);}
  await writeNew(join(root,'Game.cs'),source);await writeNew(join(root,'Axiom.Game.csproj'),GAME_PROJECT);
  await writeNew(join(root,'global.json'),JSON.stringify({sdk:{version:'10.0.100',rollForward:'latestFeature'}}));
  const start=performance.now();const result=await runCompiler(args,{cwd:root,signal,timeoutMs:mode==='aot'?CSHARP_COMPILER.aotTimeoutMs:CSHARP_COMPILER.developmentTimeoutMs});
  const diagnostics=compileDiagnostics(result.output);
  if(result.reason||result.code!==0){const error=Object.assign(new Error(result.reason??diagnostics.find(d=>d.severity==='error')?.message??'C# compilation failed; check .NET 10 and wasm-tools installation'),{code:'AX_SCRIPT_0001',diagnostics});throw error;}
  if(signal?.aborted)fail('Compilation cancelled');
  const manifest={...await collectBundle(join(root,'publish')),id,mode,sourceHash:createHash('sha256').update(source).digest('hex'),durationMs:performance.now()-start};
  await writeNew(join(root,'manifest.json'),JSON.stringify(manifest));
  return {id,mode,sourceHash:manifest.sourceHash,durationMs:manifest.durationMs,bytes:manifest.bytes,diagnostics};
 }
 async read(projectId,build,name) {
  const root=await scriptDirectory(this.projects,projectId,build.id),manifest=await readManifest(join(root,'manifest.json'));
  if(manifest.id!==build.id||manifest.sourceHash!==build.sourceHash)fail('Script bundle identity mismatch');
  return readPublished(root,manifest,name);
 }
}
