// Pose state belongs to Rust; this compute stage only deforms bounded geometry.
const shader=`
@group(0) @binding(0) var<storage,read> source:array<f32>;
@group(0) @binding(1) var<storage,read> influences:array<f32>;
@group(0) @binding(2) var<storage,read> palette:array<mat4x4f>;
@group(0) @binding(3) var<storage,read_write> output:array<f32>;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){let n=id.x*8u;if(n>=arrayLength(&source)){return;}let p=vec4f(source[n],source[n+1u],source[n+2u],1);let normal=vec3f(source[n+3u],source[n+4u],source[n+5u]);var position=vec3f(0);var direction=vec3f(0);
for(var j=0u;j<4u;j++){let w=influences[n+4u+j];if(w==0){continue;}let m=palette[u32(influences[n+j])];position+=(m*p).xyz*w;let a=m[0].xyz;let b=m[1].xyz;let c=m[2].xyz;let A=cross(b,c);let B=cross(c,a);let C=cross(a,b);direction+=(A*normal.x+B*normal.y+C*normal.z)/dot(a,A)*w;}
let d=direction/max(length(direction),0.0000001);output[n]=position.x;output[n+1u]=position.y;output[n+2u]=position.z;output[n+3u]=d.x;output[n+4u]=d.y;output[n+5u]=d.z;output[n+6u]=source[n+6u];output[n+7u]=source[n+7u];}
`;
export async function createSkinGPU(device){const module=device.createShaderModule({code:shader,label:'axiom-skinning'}),info=await module.getCompilationInfo();if(info.messages.some(m=>m.type==='error'))throw Error(info.messages.filter(m=>m.type==='error').map(m=>m.message).join('; '));const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});let resources=new Map();
 function skin(draw,output,encoder){if(!draw.skinPalette)return;const key=draw.entityId+':'+draw.primitiveIndex;let r=resources.get(key);if(!r){const buffer=data=>{const b=device.createBuffer({size:data.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(b,0,data);return b;};r={source:buffer(draw.skinSource),influences:buffer(draw.skinInfluences),palette:buffer(draw.skinPalette),output:null,bind:null};resources.set(key,r);}device.queue.writeBuffer(r.palette,0,draw.skinPalette);if(r.output!==output){r.output=output;r.bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[r.source,r.influences,r.palette,output].map((buffer,binding)=>({binding,resource:{buffer}}))});}const pass=encoder.beginComputePass({label:'axiom-skinning'});pass.setPipeline(pipeline);pass.setBindGroup(0,r.bind);pass.dispatchWorkgroups(Math.ceil(draw.skinSource.length/8/64));pass.end();}
 function reset(){for(const r of resources.values())for(const key of ['source','influences','palette'])r[key].destroy();resources.clear();}
 return {skin,reset,dispose:reset};
}
