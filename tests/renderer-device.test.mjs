import test from 'node:test';
import assert from 'node:assert/strict';
import {rendererDevice} from '../engine/renderer/device.mjs';
import {browserOptions} from './browser/browser-options.mjs';
test('unusable preferred WebGPU device tries a labeled fallback instead of silently abandoning rendering',async()=>{
 const attempts=[],device={features:new Set()};const result=await rendererDevice({requestAdapter:async options=>{attempts.push(options);return {features:new Set(),requestDevice:async()=>{if(!options.forceFallbackAdapter)throw Error('driver unavailable');return device;}};}});assert.equal(result.device,device);assert.equal(result.mode,'fallback');assert.equal(result.timestamps,false);assert.equal(attempts.length,2);
});
test('optional timestamp failure preserves the usable preferred renderer; total failure stays explicit',async()=>{
 let calls=0;const result=await rendererDevice({requestAdapter:async()=>({features:new Set(['timestamp-query']),requestDevice:async({requiredFeatures})=>{calls++;if(requiredFeatures.length)throw Error('optional profiling unavailable');return {features:new Set()};}})});assert.equal(calls,2);assert.equal(result.mode,'preferred');assert.equal(result.timestamps,false);await assert.rejects(rendererDevice({requestAdapter:async()=>null}),/No usable/);
});
test('browser validation uses OS-supported GPU flags without removing rendering assertions',()=>{
 const source={headless:true,args:['--enable-unsafe-webgpu','--use-angle=vulkan','--use-vulkan=swiftshader','--no-sandbox']},windows=browserOptions(source,'win32',{AXIOM_HEADLESS:'false'}),linux=browserOptions(source,'linux',{});assert.equal(windows.headless,false);assert(windows.args.includes('--enable-gpu'));assert(!windows.args.includes('--use-angle=vulkan'));assert(linux.args.includes('--use-angle=vulkan'));assert.equal(source.args.length,4);
});
