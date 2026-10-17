import {SCRIPT_SDK_VERSION} from '../../../engine/scripting/sdk-version.mjs';
import {readFile,mkdir} from 'node:fs/promises';
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
 <ItemGroup><Compile Include="Sdk.cs"/><Compile Include="Compatibility.cs"/><Compile Include="RuntimeObjects.cs"/><Compile Include="Scheduling.cs"/><Compile Include="Physics.cs"/><Compile Include="PhysicsAdvanced.cs"/><Compile Include="ShapeCasts.cs"/><Compile Include="Input.cs"/><Compile Include="ProjectRuntime.cs"/><Compile Include="SceneManagement.cs"/><Compile Include="Platform.cs"/><Compile Include="Networking.cs"/><Compile Include="Navigation.cs"/><Compile Include="Presentation.cs"/><Compile Include="GeneratedComponents.cs"/><Compile Include="Host.cs"/><Compile Include="Inspector.cs"/><Compile Include="Sources/*.cs"/><Compile Include="Game.cs"/></ItemGroup>
</Project>\n`;
export class ScriptCompiler {
 constructor(projects){this.projects=projects;}
 async build(projectId,source,mode,signal,entries=null) {
  if(typeof source!=='string'||Buffer.byteLength(source)>CSHARP_COMPILER.sourceBytes)fail('C# source exceeds 64 KiB');
  const args=compilerArguments(mode),id=randomUUID(),root=await scriptDirectory(this.projects,projectId,id);
  const entry=source.match(/public\s+(?:sealed\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:Axiom\.Gameplay\.)?Script\b/)?.[1]??'GameScript';
  for(const name of ['Sdk.cs','Compatibility.cs','RuntimeObjects.cs','Scheduling.cs','Physics.cs','PhysicsAdvanced.cs','ShapeCasts.cs','Input.cs','ProjectRuntime.cs','SceneManagement.cs','Platform.cs','Networking.cs','Navigation.cs','Presentation.cs','GeneratedComponents.cs','Host.cs','Inspector.cs']){let text=await readFile(new URL('../../../engine/scripting/templates/'+name,import.meta.url),'utf8');if(name==='Host.cs'){
    text=generateHost(text,entries,entry);
   }await writeNew(join(root,name),text);}
  if(entries){await mkdir(join(root,'Sources'),{recursive:true});for(const[i,file]of entries.entries())await writeNew(join(root,'Sources',i+'.cs'),file.text);await writeNew(join(root,'Game.cs'),'// Project sources compiled from Sources/*.cs\n');}else await writeNew(join(root,'Game.cs'),source);await writeNew(join(root,'Axiom.Game.csproj'),GAME_PROJECT);
  await writeNew(join(root,'global.json'),JSON.stringify({sdk:{version:'10.0.100',rollForward:'latestFeature'}}));
  const start=performance.now();const result=await runCompiler(args,{cwd:root,signal,timeoutMs:mode==='aot'?CSHARP_COMPILER.aotTimeoutMs:CSHARP_COMPILER.developmentTimeoutMs});
  const diagnostics=compileDiagnostics(result.output).map(d=>({...d,file:entries&&/^\d+\.cs$/.test(d.file)?entries[Number(d.file.replace('.cs',''))]?.path??d.file:d.file}));
  if(result.reason||result.code!==0){const error=Object.assign(new Error(result.reason??diagnostics.find(d=>d.severity==='error')?.message??'C# compilation failed; check .NET 10 and wasm-tools installation'),{code:'AX_SCRIPT_0001',diagnostics,output:result.output.slice(-16000)});throw error;}
  if(signal?.aborted)fail('Compilation cancelled');
  const manifest={...await collectBundle(join(root,'publish')),id,mode,sourceHash:createHash('sha256').update(entries?JSON.stringify(entries.map(f=>[f.path,f.text])):source).digest('hex'),durationMs:performance.now()-start};
  await writeNew(join(root,'manifest.json'),JSON.stringify(manifest));
  return {id,mode,sdkVersion:SCRIPT_SDK_VERSION,sourceHash:manifest.sourceHash,durationMs:manifest.durationMs,bytes:manifest.bytes,diagnostics};
 }
 async read(projectId,build,name) {
  const root=await scriptDirectory(this.projects,projectId,build.id),manifest=await readManifest(join(root,'manifest.json'));
  if(manifest.id!==build.id||manifest.sourceHash!==build.sourceHash)fail('Script bundle identity mismatch');
  return readPublished(root,manifest,name);
 }
}

export function generateHost(template,entries,entry='GameScript'){
 if(!entries)return template.replaceAll('Game.GameScript','Game.'+entry);
 const scripts=entries.filter(f=>f.metadata),register=scripts.map(f=>{const type=f.metadata.typeName,path=JSON.stringify(f.path),fields=f.metadata.fields.map(x=>JSON.stringify(x.name)).join(',');return 'RuntimeLifecycle.Register<'+type+'>('+path+',()=>new '+type+'(),(s,v)=>ScriptValues.Apply(typeof('+type+'),s,v),(s,w)=>ScriptValues.Write(typeof('+type+'),s,w,new string[]{'+fields+'}));';}).join('\n');
 const arms=scripts.map(f=>JSON.stringify(f.path)+' => RuntimeLifecycle.Factories[typeof('+f.metadata.typeName+')]').join(',');
 const code='private static void Configure(){'+register+'}\n private static void Attach(JsonElement entity,int generation){if(entity.TryGetProperty("scriptComponents",out var components))foreach(var c in components.EnumerateArray()){var path=c.GetProperty("path").GetString()!;var f=path switch {'+arms+(arms?',':'')+' _=>throw new ArgumentException("Missing compiled Script source")};var s=f.Create();s.Entity=new Entity(entity.GetProperty("id").GetString()!,generation);Scripts.Add(s);Context.ScriptPaths[s]=path;}}';
 return template.replace(/\/\/ <compiled-factories>[\s\S]*?\/\/ <\/compiled-factories>/,code);
}
