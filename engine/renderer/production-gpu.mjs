import {createSkinGPU} from './skin-gpu.mjs';
import {cameraMatrix,add,mul,unit} from './render-math.mjs';
import {cullShader,tilesShader,surfaceShader,shadowShader,postShader} from './production-shaders.mjs';
const vertexBuffers=[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'}]}];
// Owns bounded GPU resources only. Host supplies textures and the canvas target.
export async function createProductionGPU({device,format,width,height,textureFor,getTexture,reportError}){
 const B=GPUBufferUsage,T=GPUTextureUsage,S=GPUShaderStage;let disposed=false,pending=false,sample=null,frameNumber=0,epoch=0;
 const skinGPU=await createSkinGPU(device);
 const owned=[],vertices=new Map(),bindings=new Map(),pipelineCache=new Map();
 const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});owned.push(b);return b;};
 const texture=(w,h,fmt,usage)=>{const t=device.createTexture({size:[w,h],format:fmt,usage});owned.push(t);return t;};
 const frame=buffer(208,B.UNIFORM|B.COPY_DST),instances=buffer(1024*208,B.STORAGE|B.COPY_DST),visible=buffer(1024*4,B.STORAGE|B.COPY_DST),groups=buffer(1024*16,B.STORAGE|B.COPY_DST),indirect=buffer(1024*16,B.STORAGE|B.INDIRECT|B.COPY_SRC|B.COPY_DST),lights=buffer(64*64,B.STORAGE|B.COPY_DST);
 const nx=Math.ceil(width/16),ny=Math.ceil(height/16),tiles=buffer(nx*ny*65*4,B.STORAGE|B.COPY_DST),readback=buffer(1024*16,B.COPY_DST|B.MAP_READ);
 const hdr=texture(width,height,'rgba16float',T.RENDER_ATTACHMENT|T.TEXTURE_BINDING),depth=texture(width,height,'depth24plus',T.RENDER_ATTACHMENT),bloom=texture(Math.max(1,Math.ceil(width/2)),Math.max(1,Math.ceil(height/2)),'rgba16float',T.RENDER_ATTACHMENT|T.TEXTURE_BINDING);
 let shadow=null,shadowSize=0,mainBind=null;
 const sampler=device.createSampler({magFilter:'linear',minFilter:'linear'}),comparison=device.createSampler({compare:'less-equal',magFilter:'linear',minFilter:'linear'});
 const storage=(binding,visibility)=>({binding,visibility,buffer:{type:'read-only-storage'}});
 const mainLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:S.VERTEX|S.FRAGMENT,buffer:{type:'uniform'}},storage(1,S.VERTEX|S.FRAGMENT),storage(2,S.VERTEX),storage(3,S.FRAGMENT),storage(4,S.FRAGMENT),{binding:5,visibility:S.FRAGMENT,texture:{sampleType:'depth'}},{binding:6,visibility:S.FRAGMENT,sampler:{type:'comparison'}}]});
 const materialLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:S.FRAGMENT,texture:{}},{binding:1,visibility:S.FRAGMENT,sampler:{}},{binding:2,visibility:S.VERTEX,buffer:{type:'uniform'}}]});
 const shadowLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:S.VERTEX,buffer:{type:'uniform'}},storage(1,S.VERTEX|S.FRAGMENT)]});
 const bind=(layout,buffers)=>device.createBindGroup({layout,entries:buffers.map((b,binding)=>({binding,resource:{buffer:b}}))});
 async function module(code){const m=device.createShaderModule({code});const errors=(await m.getCompilationInfo()).messages.filter(x=>x.type==='error');if(errors.length)throw Error('AX_RENDERER_0004: '+errors.map(e=>e.message).join('; '));return m;}
 const surface=await module(surfaceShader),shadowModule=await module(shadowShader),post=await module(postShader);
 const surfaceLayout=device.createPipelineLayout({bindGroupLayouts:[mainLayout,materialLayout]}),shadowPipelineLayout=device.createPipelineLayout({bindGroupLayouts:[shadowLayout,materialLayout]});
 for(const alphaMode of ['opaque','mask','blend']){
  const blend=alphaMode==='blend'?{color:{srcFactor:'src-alpha',dstFactor:'one-minus-src-alpha'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha'}}:undefined;
  pipelineCache.set(alphaMode,await device.createRenderPipelineAsync({layout:surfaceLayout,vertex:{module:surface,entryPoint:'vs',buffers:vertexBuffers},fragment:{module:surface,entryPoint:'fs',targets:[{format:'rgba16float',...(blend?{blend}:{})}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:alphaMode!=='blend',depthCompare:'less-equal'}}));
 }
 pipelineCache.set('shadow',await device.createRenderPipelineAsync({layout:shadowPipelineLayout,vertex:{module:shadowModule,entryPoint:'vs',buffers:vertexBuffers},fragment:{module:shadowModule,entryPoint:'fs',targets:[]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'less-equal',depthBias:2,depthBiasSlopeScale:2}}));
 const postLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:S.FRAGMENT,buffer:{type:'uniform'}},{binding:1,visibility:S.FRAGMENT,texture:{}},{binding:2,visibility:S.FRAGMENT,texture:{}},{binding:3,visibility:S.FRAGMENT,sampler:{}}]});
 for(const [key,entryPoint,target]of [['bloom','bright','rgba16float'],['post','fs',format]])pipelineCache.set(key,await device.createRenderPipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[postLayout]}),vertex:{module:post,entryPoint:'vs'},fragment:{module:post,entryPoint,targets:[{format:target}]},primitive:{topology:'triangle-list'}}));
 const postBind=device.createBindGroup({layout:postLayout,entries:[{binding:0,resource:{buffer:frame}},{binding:1,resource:hdr.createView()},{binding:2,resource:bloom.createView()},{binding:3,resource:sampler}]});
 // Bloom cannot sample its own attachment; its unused binding points to HDR.
 const bloomBind=device.createBindGroup({layout:postLayout,entries:[{binding:0,resource:{buffer:frame}},{binding:1,resource:hdr.createView()},{binding:2,resource:hdr.createView()},{binding:3,resource:sampler}]});
 const shadowBind=bind(shadowLayout,[frame,instances]);
 const cullModule=await module(cullShader),tileModule=await module(tilesShader);
 const cullLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:S.COMPUTE,buffer:{type:'uniform'}},storage(1,S.COMPUTE),storage(2,S.COMPUTE),{binding:3,visibility:S.COMPUTE,buffer:{type:'storage'}},{binding:4,visibility:S.COMPUTE,buffer:{type:'storage'}}]});
 const cull=await device.createComputePipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[cullLayout]}),compute:{module:cullModule,entryPoint:'cs'}}),tilePipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module:tileModule,entryPoint:'cs'}});
 pipelineCache.set('cull',cull);pipelineCache.set('tiles',tilePipeline);
 const cullBind=bind(cull.getBindGroupLayout(0),[frame,instances,groups,visible,indirect]),tileBind=bind(tilePipeline.getBindGroupLayout(0),[frame,lights,tiles]);
 async function prepare(draws){for(const draw of draws)await textureFor(draw.texture);}
 function setShadow(size){if(size===shadowSize)return;shadow?.destroy();shadowSize=size;shadow=device.createTexture({size:[size,size],format:'depth32float',usage:T.RENDER_ATTACHMENT|T.TEXTURE_BINDING});mainBind=device.createBindGroup({layout:mainLayout,entries:[{binding:0,resource:{buffer:frame}},{binding:1,resource:{buffer:instances}},{binding:2,resource:{buffer:visible}},{binding:3,resource:{buffer:lights}},{binding:4,resource:{buffer:tiles}},{binding:5,resource:shadow.createView()},{binding:6,resource:comparison}]});}
 function render(plan,camera,target,traceId,timing){if(disposed)return {};frameNumber++;setShadow(Math.min(plan.budget.shadow,device.limits.maxTextureDimension2D));
  const settings=plan.settings,data=new Float32Array(52),light=plan.lights[plan.shadowIndex];let shadowCamera={position:[0,20,0],target:[0,0,0],projection:'orthographic',orthoHeight:settings.shadowSize};
  if(light){if(light.kind==='spot')shadowCamera={position:light.position,target:add(light.position,light.direction),projection:'perspective',fov:light.outerAngle*2,near:.01,far:light.range};else{const center=camera.target;shadowCamera={position:add(center,mul(light.direction,-settings.shadowSize)),target:center,projection:'orthographic',orthoHeight:settings.shadowSize,near:.01,far:settings.shadowSize*4};}}
  data.set(cameraMatrix(shadowCamera,1),0);data.set(cameraMatrix(camera,width/height),16);data.set(camera.position,32);data.set(settings.environment,36);data.set([settings.exposure,({none:0,aces:1,reinhard:2})[settings.toneMapping],settings.bloom,settings.fxaa?1:0],40);new Uint32Array(data.buffer).set([plan.lights.length,nx,width,height],44);data.set([plan.shadowIndex+1,shadowSize,.0003,settings.tier==='low'?0:1],48);device.queue.writeBuffer(frame,0,data);
  const instanceData=new Float32Array(Math.max(1,plan.items.length)*52),lightData=new Float32Array(64*16),groupData=new Uint32Array(1024*4),cpuVisible=new Uint32Array(1024),args=new Uint32Array(1024*4);let submitted=0;
  for(const [i,item]of plan.items.entries()){const offset=i*52,m=item.material;instanceData.set(item.mvp,offset);instanceData.set(item.model,offset+16);instanceData.set(m.baseColor,offset+32);instanceData.set([m.metallic,m.roughness,1,m.unlit?1:0],offset+36);instanceData.set([...m.emissive,m.castShadow?1:0],offset+40);instanceData.set([...item.bounds.minimum,({opaque:0,mask:1,blend:2})[m.alphaMode]],offset+44);instanceData.set([...item.bounds.maximum,m.alphaCutoff],offset+48);}
  for(const [i,l]of plan.lights.entries()){const o=i*16;lightData.set([...l.position,l.range],o);lightData.set([...l.direction,Math.cos(l.outerAngle*Math.PI/180)],o+4);lightData.set([...l.color,l.intensity],o+8);lightData.set([({directional:0,point:1,spot:2})[l.kind],Math.cos(l.innerAngle*Math.PI/180),0,0],o+12);}
  const activeVertices=new Set(),activeBindings=new Set();
  for(const [i,batch]of plan.batches.entries()){
   groupData.set([batch.first,batch.count,batch.vertices.length/8,0],i*4);let count=0;for(let j=0;j<batch.count;j++)if(settings.culling==='none'||plan.items[batch.first+j].visible)cpuVisible[batch.first+count++]=batch.first+j;
   args.set([batch.vertices.length/8,count,0,0],i*4);submitted+=count;activeVertices.add(batch.key);
   if(!vertices.has(batch.key)){const vertex=device.createBuffer({size:batch.vertices.byteLength,usage:B.VERTEX|B.COPY_DST|B.STORAGE});device.queue.writeBuffer(vertex,0,batch.vertices);vertices.set(batch.key,{vertex,bytes:batch.vertices.byteLength});}
   const bindingKey=batch.key+':'+batch.first;activeBindings.add(bindingKey);
   if(!bindings.has(bindingKey)){const uniform=device.createBuffer({size:16,usage:B.UNIFORM|B.COPY_DST});device.queue.writeBuffer(uniform,0,new Uint32Array([batch.first,0,0,0]));const texture=getTexture(batch.texture);if(texture instanceof Promise)throw Error('Texture preparation must complete before rendering');const group=device.createBindGroup({layout:materialLayout,entries:[{binding:0,resource:texture.createView()},{binding:1,resource:sampler},{binding:2,resource:{buffer:uniform}}]});bindings.set(bindingKey,{uniform,group});}
   batch.bindingKey=bindingKey;
  }
  for(const [key,v]of vertices)if(!activeVertices.has(key)){v.vertex.destroy();vertices.delete(key);}for(const [key,v]of bindings)if(!activeBindings.has(key)){v.uniform.destroy();bindings.delete(key);}
  device.queue.writeBuffer(instances,0,instanceData);device.queue.writeBuffer(lights,0,lightData);device.queue.writeBuffer(groups,0,groupData);device.queue.writeBuffer(visible,0,cpuVisible);device.queue.writeBuffer(indirect,0,args);
  const encoder=device.createCommandEncoder({label:'M9 HDR production frame'});
  for(const batch of plan.batches)skinGPU.skin(plan.items[batch.first],vertices.get(batch.key).vertex,encoder);
  if(settings.tier!=='low'){const pass=encoder.beginComputePass({timestampWrites:timing?.writes('hdr.light-tiles')});pass.setPipeline(tilePipeline);pass.setBindGroup(0,tileBind);pass.dispatchWorkgroups(Math.ceil(nx*ny/64));pass.end();}
  if(settings.culling==='gpu'&&plan.batches.length){const pass=encoder.beginComputePass({timestampWrites:timing?.writes('hdr.culling')});pass.setPipeline(cull);pass.setBindGroup(0,cullBind);pass.dispatchWorkgroups(Math.ceil(plan.batches.length/64));pass.end();}
  const shadowPass=encoder.beginRenderPass({timestampWrites:timing?.writes('hdr.shadow'),colorAttachments:[],depthStencilAttachment:{view:shadow.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
  if(plan.shadowIndex>=0){shadowPass.setPipeline(pipelineCache.get('shadow'));shadowPass.setBindGroup(0,shadowBind);for(const batch of plan.batches){shadowPass.setBindGroup(1,bindings.get(batch.bindingKey).group);shadowPass.setVertexBuffer(0,vertices.get(batch.key).vertex);shadowPass.draw(batch.vertices.length/8,batch.count);}}shadowPass.end();
  const pass=encoder.beginRenderPass({timestampWrites:timing?.writes('hdr.color'),colorAttachments:[{view:hdr.createView(),clearValue:{r:settings.environment[0]*.1,g:settings.environment[1]*.1,b:settings.environment[2]*.1,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});pass.setBindGroup(0,mainBind);
  for(const [i,batch]of plan.batches.entries()){pass.setPipeline(pipelineCache.get(batch.alphaMode));pass.setBindGroup(1,bindings.get(batch.bindingKey).group);pass.setVertexBuffer(0,vertices.get(batch.key).vertex);pass.drawIndirect(indirect,i*16);}pass.end();
  const bright=encoder.beginRenderPass({timestampWrites:timing?.writes('hdr.bloom'),colorAttachments:[{view:bloom.createView(),clearValue:{r:0,g:0,b:0,a:1},loadOp:'clear',storeOp:'store'}]});if(settings.bloom>0){bright.setPipeline(pipelineCache.get('bloom'));bright.setBindGroup(0,bloomBind);bright.draw(3);}bright.end();
  const postPass=encoder.beginRenderPass({timestampWrites:timing?.writes('hdr.post'),colorAttachments:[{view:target,loadOp:'clear',storeOp:'store'}]});postPass.setPipeline(pipelineCache.get('post'));postPass.setBindGroup(0,postBind);postPass.draw(3);postPass.end();
  const shouldRead=!pending&&plan.batches.length>0&&(frameNumber===1||frameNumber%60===0),batchCount=plan.batches.length,sourceFrame=frameNumber,sourceEpoch=epoch;
  if(shouldRead)encoder.copyBufferToBuffer(indirect,0,readback,0,batchCount*16);timing?.resolve(encoder);device.queue.submit([encoder.finish()]);timing?.submitted();
  if(shouldRead){pending=true;readback.mapAsync(GPUMapMode.READ).then(()=>{if(disposed)return;const value=new Uint32Array(readback.getMappedRange().slice(0,batchCount*16));readback.unmap();if(sourceEpoch!==epoch)return;sample={frame:sourceFrame,traceId,instances:Array.from({length:batchCount},(_,i)=>value[i*4+1]).reduce((a,b)=>a+b,0),batches:batchCount,source:'GPU indirect buffer readback',pixels:'unproven'};}).catch(error=>{if(!disposed)reportError(error);}).finally(()=>{pending=false;});}
  return {...plan.stats,submittedReference:submitted,gpuSample:sample,shadowLight:light?.entityId??null,fallbacks:plan.fallbacks,pipelines:pipelineCache.size,vertexBytes:[...vertices.values()].reduce((n,v)=>n+v.bytes,0),resourceBatches:vertices.size,hdrFormat:'rgba16float'};
 }
 return {prepare,render,reset(){skinGPU.reset();epoch++;for(const value of vertices.values())value.vertex.destroy();for(const value of bindings.values())value.uniform.destroy();vertices.clear();bindings.clear();sample=null;frameNumber=0;},dispose(){skinGPU.dispose();disposed=true;for(const value of vertices.values())value.vertex.destroy();for(const value of bindings.values())value.uniform.destroy();for(const value of owned)value.destroy();shadow?.destroy();vertices.clear();bindings.clear();}};
}
