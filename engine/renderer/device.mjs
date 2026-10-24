// Adapter availability is not device usability. Try the preferred backend first,
// then an explicitly identified fallback; optional profiling cannot block drawing.
export async function rendererDevice(gpu){
 if(!gpu)throw Error('WebGPU is unavailable');
 for(const [mode,options] of [['preferred',{powerPreference:'high-performance'}],['fallback',{forceFallbackAdapter:true}]]){
  let adapter;try{adapter=await gpu.requestAdapter(options);}catch{continue;}if(!adapter)continue;
  const candidates=adapter.features.has('timestamp-query')?[['timestamp-query'],[]]:[[]];
  for(const requiredFeatures of candidates)try{const device=await adapter.requestDevice({requiredFeatures});return {device,mode,timestamps:device.features.has('timestamp-query')};}catch{}
 }
 throw Error('No usable WebGPU device, including the fallback adapter');
}
