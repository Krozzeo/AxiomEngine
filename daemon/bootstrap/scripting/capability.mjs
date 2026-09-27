// Internal capability: HTTP callers may supply source, never these arguments.
export const CSHARP_COMPILER = Object.freeze({
 name:'script.compile.csharp', executable:'dotnet', sourceBytes:64*1024,
 outputBytes:256*1024, developmentTimeoutMs:180000, aotTimeoutMs:600000
});
export function compilerArguments(mode='development') {
 if(!['development','aot'].includes(mode))throw Object.assign(new Error('Unsupported script compilation mode'),{code:'AX_SCRIPT_0001'});
 return ['publish','Axiom.Game.csproj','-c','Release','-o','publish',
  '--disable-build-servers','-p:ImportDirectoryBuildProps=false','-p:ImportDirectoryBuildTargets=false',
  '-p:EnableDefaultCompileItems=false','-p:WasmEnableHotReload=false',
  '-p:InvariantGlobalization=false',`-p:WasmBuildNative=${mode==='aot'}`,
  `-p:RunAOTCompilation=${mode==='aot'}`];
}
