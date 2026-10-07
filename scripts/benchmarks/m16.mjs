import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {cpus,platform,arch} from 'node:os';
import assert from 'node:assert/strict';
import {hierarchyRows} from '../../engine/scene/editor-operations.mjs';
import {loadKernel} from '../../engine/wasm/host.mjs';
const output=resolve('.axiom/m16-benchmark.json');
const percentile=(values,p)=>values.toSorted((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))];
const measure=async fn=>{const values=[];for(let i=0;i<5;i++)await fn();for(let i=0;i<40;i++){const start=performance.now();await fn();values.push(performance.now()-start);}return {samples:values.length,medianMs:percentile(values,.5),p95Ms:percentile(values,.95),minMs:Math.min(...values),maxMs:Math.max(...values)};};
function oldRows(entities,collapsed=new Set()){const rows=[];function walk(parentId,depth){for(const e of entities.filter(e=>(e.parentId??null)===parentId)){rows.push({entity:e,depth});if(!collapsed.has(e.id))walk(e.id,depth+1);}}walk(null,0);return rows;}
const memoryUsage=()=>{try{return process.memoryUsage();}catch(error){return {unavailable:error.code};}};
const report={environment:{node:process.version,platform:platform(),arch:arch(),cpu:cpus()[0]?.model,logicalCpus:cpus().length},scope:'Node CPU algorithms and actual cached CI Wasm; not a physical GPU or low-end hardware benchmark',hierarchy:[],wasm:{},processMemory:memoryUsage()};
for(const count of [128,512,1024]){const entities=Array.from({length:count},(_,i)=>({id:'e'+i,...(i&&i%4?{parentId:'e'+(i-i%4)}:{})})),collapsed=new Set(['e0','e24']);assert.deepEqual(hierarchyRows(entities,collapsed),oldRows(entities,collapsed));report.hierarchy.push({count,visible:hierarchyRows(entities,collapsed).length,before:await measure(()=>oldRows(entities,collapsed)),after:await measure(()=>hierarchyRows(entities,collapsed))});}
const bytes=await readFile(resolve('target/wasm32-unknown-unknown/release/axiom_wasm.wasm'));
report.wasm.beforeInstantiateBytes=await measure(async()=>{const {instance}=await WebAssembly.instantiate(bytes,{});const id=instance.exports.axiom_create();instance.exports.axiom_destroy(id);});
let memory=0;report.wasm.afterCachedModuleFreshWorld=await measure(async()=>{const kernel=await loadKernel(bytes);kernel.compileScene({entities:[]},new Map());memory=kernel.memoryBytes();kernel.dispose();});report.wasm.emptyWorldMemoryBytes=memory;report.processMemoryAfter=memoryUsage();
await mkdir(resolve('.axiom'),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
