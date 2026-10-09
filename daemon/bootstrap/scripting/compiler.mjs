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
 <ItemGroup><Compile Include="Sdk.cs"/><Compile Include="GeneratedComponents.cs"/><Compile Include="Host.cs"/><Compile Include="Inspector.cs"/><Compile Include="Sources/*.cs"/><Compile Include="Game.cs"/></ItemGroup>
</Project>\n`;
export class ScriptCompiler {
 constructor(projects){this.projects=projects;}
 async build(projectId,source,mode,signal,entries=null) {
  if(typeof source!=='string'||Buffer.byteLength(source)>CSHARP_COMPILER.sourceBytes)fail('C# source exceeds 64 KiB');
  const args=compilerArguments(mode),id=randomUUID(),root=await scriptDirectory(this.projects,projectId,id);
  const entry=source.match(/public\s+(?:sealed\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?:Axiom\.Gameplay\.)?Script\b/)?.[1]??'GameScript';
  for(const name of ['Sdk.cs','GeneratedComponents.cs','Host.cs','Inspector.cs']){let text=await readFile(new URL('../../../engine/scripting/templates/'+name,import.meta.url),'utf8');if(name==='Host.cs'){
    text=text.replace('new Game.GameScript','new Game.'+entry);
    if(entries){text=text.replace('if(action==\"step\") {','if(action==\"fields\") { foreach(var edit in value.GetProperty(\"edits\").EnumerateArray()){var entityId=edit.GetProperty(\"entityId\").GetString();var path=edit.GetProperty(\"path\").GetString()!;for(int i=0;i<Scripts.Count;i++)if(Scripts[i].Entity.Id==entityId&&Paths[i]==path)Apply(path,Scripts[i],edit.GetProperty(\"values\"));} } else if(action==\"step\") {');const scripts=entries.filter(f=>f.metadata);const arms=scripts.map(f=>JSON.stringify(f.path)+' => new '+f.metadata.typeName+'()').join(',');const writes=scripts.map(f=>'case '+JSON.stringify(f.path)+': ScriptValues.Write(typeof('+f.metadata.typeName+'),script,writer,new string[]{'+f.metadata.fields.map(field=>JSON.stringify(field.name)).join(',')+'});break;').join('');const apply=scripts.map(f=>'case '+JSON.stringify(f.path)+': ScriptValues.Apply(typeof('+f.metadata.typeName+'),script,values);break;').join('');text=text.replace('private static readonly List<Script> Scripts = new();','private static readonly List<Script> Scripts = new();\n private static Script Create(string path) => path switch {'+arms+(arms?',':'')+' _=>throw new ArgumentException("Missing compiled Script source")};\n private static void Apply(string path,Script script,JsonElement values){switch(path){'+apply+'}}\n private static readonly List<string> Paths=new();\n private static void Fields(Utf8JsonWriter writer){writer.WriteStartArray("scriptValues");for(int i=0;i<Scripts.Count;i++){var script=Scripts[i];var path=Paths[i];writer.WriteStartObject();writer.WriteString("entityId",script.Entity.Id);writer.WriteString("path",path);writer.WritePropertyName("values");switch(path){'+writes+'default:writer.WriteStartObject();writer.WriteEndObject();break;}writer.WriteEndObject();}writer.WriteEndArray();}');text=text.replace('return Context.Output();','return Context.Output(fields:Fields);').replace('Scripts.Clear();','Scripts.Clear();Paths.Clear();');const a=text.indexOf('    foreach(var id in value.GetProperty("attachments")'),b=text.indexOf('   } else {',a);text=text.slice(0,a)+`    foreach(var id in value.GetProperty("attachments").EnumerateArray()) {
     var entityId=id.GetString()!;var entity=value.GetProperty("entities").EnumerateArray().First(e=>e.GetProperty("id").GetString()==entityId);
     if(entity.TryGetProperty("scriptComponents",out var components))foreach(var component in components.EnumerateArray()){
      if(Scripts.Count>=Limits.Attachments)throw new ArgumentException("Script attachment limit exceeded");
      var path=component.GetProperty("path").GetString()!;var script=Create(path);script.Entity=new Entity(entityId,generation);_=script.Entity.Transform;Apply(path,script,component.GetProperty("values"));Scripts.Add(script);Paths.Add(path);script.OnStart();
     }
    }
`+text.slice(b);}
   }await writeNew(join(root,name),text);}
  if(entries){await mkdir(join(root,'Sources'),{recursive:true});for(const[i,file]of entries.entries())await writeNew(join(root,'Sources',i+'.cs'),file.text);await writeNew(join(root,'Game.cs'),'// Project sources compiled from Sources/*.cs\n');}else await writeNew(join(root,'Game.cs'),source);await writeNew(join(root,'Axiom.Game.csproj'),GAME_PROJECT);
  await writeNew(join(root,'global.json'),JSON.stringify({sdk:{version:'10.0.100',rollForward:'latestFeature'}}));
  const start=performance.now();const result=await runCompiler(args,{cwd:root,signal,timeoutMs:mode==='aot'?CSHARP_COMPILER.aotTimeoutMs:CSHARP_COMPILER.developmentTimeoutMs});
  const diagnostics=compileDiagnostics(result.output).map(d=>({...d,file:entries&&/^\d+\.cs$/.test(d.file)?entries[Number(d.file.replace('.cs',''))]?.path??d.file:d.file}));
  if(result.reason||result.code!==0){const error=Object.assign(new Error(result.reason??diagnostics.find(d=>d.severity==='error')?.message??'C# compilation failed; check .NET 10 and wasm-tools installation'),{code:'AX_SCRIPT_0001',diagnostics,output:result.output.slice(-16000)});throw error;}
  if(signal?.aborted)fail('Compilation cancelled');
  const manifest={...await collectBundle(join(root,'publish')),id,mode,sourceHash:createHash('sha256').update(entries?JSON.stringify(entries.map(f=>[f.path,f.text])):source).digest('hex'),durationMs:performance.now()-start};
  await writeNew(join(root,'manifest.json'),JSON.stringify(manifest));
  return {id,mode,sdkVersion:2,sourceHash:manifest.sourceHash,durationMs:manifest.durationMs,bytes:manifest.bytes,diagnostics};
 }
 async read(projectId,build,name) {
  const root=await scriptDirectory(this.projects,projectId,build.id),manifest=await readManifest(join(root,'manifest.json'));
  if(manifest.id!==build.id||manifest.sourceHash!==build.sourceHash)fail('Script bundle identity mismatch');
  return readPublished(root,manifest,name);
 }
}
