import {ScriptRuntime} from "./script-runtime.js";
import {applyScriptOperations} from "./script-operations.mjs";
import { loadKernel, scenePrimitives } from "./kernel-host.js";
import { FrameProfiler } from "./frame-profiler.js";

const shader = `
struct Uniforms { mvp: mat4x4f, model: mat4x4f, color: vec4f, flags: vec4f };
@group(0) @binding(0) var<uniform> data: Uniforms;
@group(0) @binding(1) var sampler0: sampler;
@group(0) @binding(2) var texture0: texture_2d<f32>;
struct Out { @builtin(position) position: vec4f, @location(0) normal: vec3f, @location(1) uv: vec2f };
@vertex fn vs(@location(0) position: vec3f, @location(1) normal: vec3f, @location(2) uv: vec2f) -> Out {
  var output: Out;
  output.position = data.mvp * vec4f(position, 1.0);
  let a = data.model[0].xyz; let b = data.model[1].xyz; let c = data.model[2].xyz;
  let cof = mat3x3f(cross(b,c), cross(c,a), cross(a,b));
  let n = cof * normal;
  let det = dot(a,cross(b,c));
  output.normal = n / max(length(n), 0.00001) * select(-1.0, 1.0, det >= 0.0);
  output.uv = uv;
  return output;
}
@fragment fn fs(input: Out) -> @location(0) vec4f {
  let base = textureSample(texture0, sampler0, input.uv) * data.color;
  if(base.a < 0.01) { discard; }
  let normal = input.normal / max(length(input.normal), 0.00001);
  let light = 0.25 + 0.75 * max(dot(normal, normalize(vec3f(0.4,0.8,1.0))), 0.0);
  return vec4f(base.rgb * select(light,1.0,data.flags.x > 0.5),base.a);
}`;

export async function createSceneRenderer({ canvas, stateElement, traceOutput, bytes, loadAsset, reportError, reportScriptLog=()=>{}, forceNull=false, gpu=navigator.gpu }) {
  const profiler=new FrameProfiler(120);
  let device=null, context=null, pipeline=null, sampler=null, depth=null;
  let querySet=null,queryResolve=null,queryRead=null,sampleDone=false,readPending=false,gpuSample=null;
  let kernel=await loadKernel(bytes), resources=[], disposed=false, generation=0, animationId=null;
  let previousTime=null, trace=0n, playing=false, sceneId=null, currentProject=null;
  let runtimeScene={entities:[]},scriptRuntime=null,scriptFlight=null,spawned=0,scriptFault=null;
  let workspaceId=null,sceneRevision=-1,lastFrame=null,captureRequest=null;
  const keys=new Set();
  const keydown=event=>{if(!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??"")&&keys.size<64&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|ShiftLeft|ShiftRight)$/.test(event.code))keys.add(event.code);};
  const keyup=event=>keys.delete(event.code),blur=()=>keys.clear();
  globalThis.addEventListener?.("keydown",keydown);globalThis.addEventListener?.("keyup",keyup);globalThis.addEventListener?.("blur",blur);
  let textures=new Map(), assets=new Map(), assetKeys=new Map();
  kernel.compileScene({entities:[]},new Map());
  function destroyResources(items) { for(const item of items) {item.vertex?.destroy();item.uniform?.destroy();} }
  function clearTextures() {for(const texture of textures.values())texture.destroy();textures=new Map();}
  if(!forceNull&&gpu) {
    try {
      const adapter=await gpu.requestAdapter({powerPreference:"high-performance"});
      if(!adapter) throw new Error("No WebGPU adapter");
      const timestamps=adapter.features.has("timestamp-query");
      device=await adapter.requestDevice({requiredFeatures:timestamps?["timestamp-query"]:[]});
      device.addEventListener("uncapturederror",event=>reportError(new Error(event.error.message)));
      context=canvas.getContext("webgpu");
      if(!context) throw new Error("WebGPU canvas context is unavailable");
      const format=gpu.getPreferredCanvasFormat();
      context.configure({device,format,alphaMode:"opaque"});
      const module=device.createShaderModule({code:shader});
      const errors=(await module.getCompilationInfo()).messages.filter(message=>message.type==="error");
      if(errors.length) throw new Error(errors.map(error=>error.message).join("; "));
      pipeline=await device.createRenderPipelineAsync({layout:"auto",
        vertex:{module,entryPoint:"vs",buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"},{shaderLocation:2,offset:24,format:"float32x2"}]}]},
        fragment:{module,entryPoint:"fs",targets:[{format,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}}}]},
        primitive:{topology:"triangle-list",cullMode:"none"},depthStencil:{format:"depth24plus",depthWriteEnabled:true,depthCompare:"less-equal"}});
      sampler=device.createSampler({magFilter:"linear",minFilter:"linear"});
      depth=device.createTexture({size:[canvas.width,canvas.height],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT});
      if(timestamps) {
        querySet=device.createQuerySet({type:"timestamp",count:2});
        queryResolve=device.createBuffer({size:16,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC});
        queryRead=device.createBuffer({size:16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
      }
      const currentDevice=device;
      device.lost.then(info=>{if(disposed)return;reportError(new Error(`AX_RENDERER_0003: GPU device lost (${info.reason}): ${info.message}`));device=null;stateElement.textContent=`Null Renderer · GPU device lost (${info.reason})`;destroyResources(resources);resources=[];clearTextures();currentDevice.destroy();});
      stateElement.textContent=`WebGPU · project scene${timestamps?" · GPU timestamps":""}`;
      stateElement.classList.add("success");
    } catch(error) {reportError(error);device?.destroy();device=null;}
  }
  if(!device) stateElement.textContent=`Null Renderer · ${forceNull?"selected explicitly":"WebGPU unavailable"}`;
  async function textureFor(url) {
    const key=url??"white";
    if(textures.has(key))return textures.get(key);
    let texture;
    if(!url) {
      texture=device.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});
      device.queue.writeTexture({texture},new Uint8Array([255,255,255,255]),{bytesPerRow:4},[1,1]);
    } else {
      const raw=atob(url.slice(url.indexOf(",")+1));
      const blob=new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))],{type:"image/png"});
      const bitmap=await createImageBitmap(blob,{premultiplyAlpha:"none"});
      try {
        if(disposed||!device)throw new Error("Renderer was closed during texture upload");
        texture=device.createTexture({size:[bitmap.width,bitmap.height],format:"rgba8unorm-srgb",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
        device.queue.copyExternalImageToTexture({source:bitmap},{texture},[bitmap.width,bitmap.height]);
      } finally {bitmap.close();}
    }
    textures.set(key,texture);return texture;
  }
  async function buildResources(draws,ticket) {
    const pending=[];
    try {if(device)for(const draw of draws) {
      const texture=await textureFor(draw.texture);
      if(ticket!==generation||disposed||!device)throw new Error("Renderer generation changed");
      const vertex=device.createBuffer({size:draw.vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});
      device.queue.writeBuffer(vertex,0,draw.vertices);
      const uniform=device.createBuffer({size:160,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
      const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:sampler},{binding:2,resource:texture.createView()}]});
      pending.push({vertex,uniform,bind,count:draw.vertices.length/8,color:draw.color,unlit:draw.unlit});
    }return pending;}catch(error){destroyResources(pending);throw error;}
  }
  async function setSnapshot(snapshot) {
    if(captureRequest){captureRequest.reject(new Error("Scene changed before capture"));captureRequest=null;}
    lastFrame=null;
    const oldGeneration=generation,ticket=++generation,oldRuntime=scriptRuntime,oldScene=runtimeScene;
    scriptRuntime=null;
    if(oldRuntime) {
      try {await scriptFlight;const result=await oldRuntime.execute({action:"stop",generation:oldGeneration,entities:oldScene.entities,keys:[]});for(const op of result.operations??[])if(op.kind==="log")reportScriptLog(op.message,{generation:oldGeneration,phase:"stop",buildId:oldScene.script?.build.id});}
      catch(error){if(!oldRuntime.closed)reportError(error);}finally{oldRuntime.dispose();}
    }
    if(ticket!==generation||disposed)return;
    const project=snapshot.project;
    let scene=structuredClone(project?.scene??{entities:[]});
    if(currentProject!==project?.id) { assets=new Map();assetKeys=new Map(); }
    const localAssets=new Map();
    const referenced=new Set(scene.entities.map(entity=>entity.renderable?.assetId));
    let totalVertices=0;
    for(const metadata of (scene.assets??[]).filter(asset=>referenced.has(asset.id))) {
      let asset=assetKeys.get(metadata.id)===(metadata.buildKey??metadata.id)?assets.get(metadata.id):null;
      if(!asset) {asset=await loadAsset(project.id,metadata.id,snapshot.workspaceId);if(ticket!==generation||disposed)return;assets.set(metadata.id,asset);assetKeys.set(metadata.id,metadata.buildKey??metadata.id);}
      totalVertices+=(asset.kind==="sprite"?6:asset.vertexCount)*scene.entities.filter(entity=>entity.renderable?.assetId===metadata.id).length;
      if(totalVertices>300000)throw new Error("AX_SCENE_0006: scene exceeds 300000 vertices");
      localAssets.set(metadata.id,asset);
    }
    const replacement=await loadKernel(bytes);let pending=[],nextRuntime=null;
    let nextSpawned=0;
    try {
      if(snapshot.playing&&scene.script?.attachments.length) {
        nextRuntime=new ScriptRuntime();
        await nextRuntime.initialize(`/script-runtime/${project.id.slice(10)}/${scene.script.build.id}/dotnet.js`);
        const packet=await nextRuntime.execute({action:"start",generation:ticket,entities:scene.entities,keys:[],attachments:scene.script.attachments});
        const result=applyScriptOperations(scene,packet,ticket);scene=result.scene;nextSpawned=result.spawned;
        for(const message of result.logs)reportScriptLog(message,{generation:ticket,phase:"start",buildId:scene.script.build.id});
      }
      const draws=replacement.compileScene(scene,localAssets);
      if(snapshot.playing)replacement.configurePhysics(scene);
      pending=await buildResources(draws,ticket);
      if(ticket!==generation||disposed){replacement.dispose();destroyResources(pending);nextRuntime?.dispose();return;}
      kernel.dispose();destroyResources(resources);kernel=replacement;resources=pending;
      workspaceId=snapshot.workspaceId??null;sceneRevision=snapshot.sceneRevision;runtimeScene=scene;scriptRuntime=nextRuntime;spawned=nextSpawned;scriptFault=null;
      assets=localAssets;playing=!!snapshot.playing;sceneId=scene.id??null;currentProject=project?.id??null;previousTime=null;trace=0n;sampleDone=false;gpuSample=null;
      // Old texture entries are bounded to those referenced by the active scene.
      const used=new Set(draws.map(draw=>draw.texture??"white"));
      for(const [key,texture] of textures)if(!used.has(key)){texture.destroy();textures.delete(key);}
    } catch(error) {nextRuntime?.dispose();replacement.dispose();destroyResources(pending);throw error;}
  }
  async function frame(now) {
    if(disposed)return;
    const ticket=generation;
    try {
      const delta=previousTime===null?0:Math.min((now-previousTime)/1000,0.25);previousTime=now;
      const diagnostic=profiler.begin(performance.now());
      if(playing&&scriptRuntime) {
        const active=scriptRuntime;
        try {
          const scriptStart=performance.now();
          scriptFlight=active.execute({action:"step",generation:ticket,entities:runtimeScene.entities,keys:[...keys],delta});
          const packet=await scriptFlight;diagnostic.scriptRoundTripMs=performance.now()-scriptStart;
          if(ticket!==generation||disposed){if(!disposed)animationId=requestAnimationFrame(frame);return;}
          const result=applyScriptOperations(runtimeScene,packet,ticket,spawned);
          if(result.changedTopology) {
            let next=[];
            try {
              const draws=scenePrimitives(result.scene,assets);next=await buildResources(draws,ticket);
              if(ticket!==generation||disposed)throw new Error("Runtime generation changed");
              try {kernel.compileScene(result.scene,assets);kernel.configurePhysics(result.scene,true);}catch(error){kernel.compileScene(runtimeScene,assets);throw error;}
              destroyResources(resources);resources=next;
            }catch(error){destroyResources(next);throw error;}
          }else kernel.setPositions(result.positions);
          kernel.setVelocities(result.velocities);
          runtimeScene=result.scene;spawned=result.spawned;for(const message of result.logs)reportScriptLog(message,{generation:ticket,phase:"update",traceId:diagnostic.traceId,frameTrace:trace.toString(),buildId:runtimeScene.script?.build.id});
        }catch(error){if(ticket===generation&&!disposed){scriptFault=error.message;reportError(error);active.dispose();scriptRuntime=null;}}
        finally{scriptFlight=null;}
      }
      if(ticket!==generation||disposed){if(!disposed)animationId=requestAnimationFrame(frame);return;}
      const packet=kernel.stepScene(delta,++trace,canvas.width/canvas.height);
      if(packet.physics){for(const b of packet.physics.bodies){const e=runtimeScene.entities.find(e=>e.id===b.id);e.transform.position=b.position;if(e.rigidBody)e.rigidBody.velocity=b.velocity;}diagnostic.physics=packet.physics;}
      if(device) {
        const encoder=device.createCommandEncoder({label:"axiom-m2-scene"});
        const sample=querySet&&!sampleDone&&!readPending&&resources.length>0;
        const pass=encoder.beginRenderPass({... (sample?{timestampWrites:{querySet,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}}:{}),colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0.025,g:0.035,b:0.055,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});
        pass.setPipeline(pipeline);
        for(let i=0;i<resources.length;i++) {
          const item=resources[i], matrix=packet.draws[i], uniforms=new Float32Array(40);
          uniforms.set(matrix.mvp,0);uniforms.set(matrix.model,16);uniforms.set(item.color,32);uniforms[36]=item.unlit?1:0;
          device.queue.writeBuffer(item.uniform,0,uniforms);
          pass.setBindGroup(0,item.bind);pass.setVertexBuffer(0,item.vertex);pass.draw(item.count);
        }
        pass.end();
        if(sample) {encoder.resolveQuerySet(querySet,0,2,queryResolve,0);encoder.copyBufferToBuffer(queryResolve,0,queryRead,0,16);}
        device.queue.submit([encoder.finish()]);
        if(sample) {
          sampleDone=true;readPending=true;
          const sequence=diagnostic.frameSequence;
          queryRead.mapAsync(GPUMapMode.READ).then(()=>{
            const values=new BigUint64Array(queryRead.getMappedRange().slice(0));queryRead.unmap();
            const milliseconds=Number(values[1]-values[0])/1e6;
            gpuSample={frameSequence:sequence,milliseconds};profiler.attachGpuTiming(sequence,milliseconds);
          }).catch(error=>{if(!disposed&&device)reportError(error);}).finally(()=>{readPending=false;});
        }
      }
      diagnostic.kernel={frame:packet.frame,trace:packet.trace,fixedSteps:packet.fixedSteps,meshes:packet.nullProcessedMeshes,renderer:device?"webgpu":"null",mode:playing?"play":"scene",sceneId};
      diagnostic.script={generation,active:!!scriptRuntime,fault:scriptFault,spawned,entities:playing?runtimeScene.entities.map(e=>({id:e.id,position:e.transform.position})):[]};
      profiler.finish(diagnostic,performance.now(),device?"submitted":"null");
      lastFrame={workspaceId,projectId:currentProject,sceneRevision,frame:packet.frame,renderer:device?'webgpu':'null',playing,generation,fault:scriptFault};
      if(captureRequest){
        const request=captureRequest;captureRequest=null;
        try{
          if(!device||request.args.expectedSceneRevision!==sceneRevision||request.args.id!==currentProject)throw new Error('Capture unavailable or stale');
          const {width,height,maxEntities}=request.args;
          const target=document.createElement('canvas');target.width=width;target.height=height;
          target.getContext('2d').drawImage(canvas,0,0,width,height);
          const value={...lastFrame,width,height,semantic:{sceneId,entityCount:runtimeScene.entities.length,entities:runtimeScene.entities.slice(0,maxEntities).map(e=>({id:e.id,name:e.name,position:e.transform.position,renderable:e.renderable??null})),omittedEntities:Math.max(0,runtimeScene.entities.length-maxEntities),channel:'color'}};
          target.toBlob(async blob=>{try{if(!blob||blob.size>512*1024)throw new Error('Capture exceeds 512 KiB');if(disposed||generation!==ticket)throw new Error('Capture generation changed');const data=new Uint8Array(await blob.arrayBuffer());let raw='';for(let i=0;i<data.length;i+=8192)raw+=String.fromCharCode(...data.subarray(i,i+8192));request.resolve({...value,base64:btoa(raw)});}catch(error){request.reject(error);}},'image/png');
        }catch(error){request.reject(error);}
      }
      if(packet.frame===1||packet.frame%15===0)traceOutput.textContent=JSON.stringify({...diagnostic,gpuSample},null,2);
    } catch(error) {reportError(error);stateElement.textContent="Rendering stopped · inspect the console";return;}
    animationId=requestAnimationFrame(frame);
  }
  animationId=requestAnimationFrame(frame);
  function capture(args){
    if(disposed||!device||captureRequest||!lastFrame) return Promise.reject(new Error('WebGPU capture unavailable'));
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{if(captureRequest?.args===args)captureRequest=null;reject(new Error('Capture timed out'));},4000);captureRequest={args,resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};});
  }
  return {setSnapshot,capture,status:()=>lastFrame??{},dispose(){captureRequest?.reject(new Error('Renderer disposed'));captureRequest=null;disposed=true;generation++;scriptRuntime?.dispose();globalThis.removeEventListener?.("keydown",keydown);globalThis.removeEventListener?.("keyup",keyup);globalThis.removeEventListener?.("blur",blur);if(animationId!==null)cancelAnimationFrame(animationId);kernel.dispose();destroyResources(resources);clearTextures();depth?.destroy();querySet?.destroy();queryResolve?.destroy();queryRead?.destroy();device?.destroy();}};
}
