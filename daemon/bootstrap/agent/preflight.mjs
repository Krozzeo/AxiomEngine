import {runCompiler} from '../scripting/process.mjs';
export async function compilerPreflight(root,signal){
 try{const sdk=await runCompiler(['--version'],{cwd:root,signal,timeoutMs:5000});if(sdk.code!==0||Number(sdk.output.match(/^\s*(\d+)\./m)?.[1]??0)<10)return {compiler:false,reason:'.NET 10 SDK is required'};const workloads=await runCompiler(['workload','list'],{cwd:root,signal,timeoutMs:5000});return /\bwasm-tools\b/.test(workloads.output)?{compiler:true,sdk:sdk.output.trim()}:{compiler:false,reason:'wasm-tools workload is required'};}catch(error){return {compiler:false,reason:error.message.slice(0,240)};}
}
