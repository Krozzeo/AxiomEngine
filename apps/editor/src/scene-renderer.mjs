import {twoDPlan,uiHit} from '../../../engine/renderer/two-d-plan.mjs';
import {createTwoDGPU} from '../../../engine/renderer/two-d-gpu.mjs';
import {updateTransforms} from '../../../engine/scene/editor-operations.mjs';
import {worldScene,localTransform,reparent} from '../../../engine/scene/hierarchy.mjs';
import {createSkinGPU} from '../../../engine/renderer/skin-gpu.mjs';
import {renderPlan} from '../../../engine/renderer/render-plan.mjs';
import {createProductionGPU} from '../../../engine/renderer/production-gpu.mjs';
import {ScriptRuntime} from "./script-runtime.js";
import {applyScriptOperations} from "./script-operations.mjs";
import { loadKernel, scenePrimitives } from "./kernel-host.js";
import { FrameProfiler } from "./frame-profiler.js";
import {cameraMatrix,matrixMultiply,modelMatrix,clipVisible,collapsedGeometry} from './view-math.mjs';
import {DecisionEvidence} from './causal-diagnostics.mjs';

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
  let twoDGPU=null,lastTwoDPlan=null,twoDPaused=false,twoDTime=0;
  let productionLoading=null,production=null,renderStats=null,lastRenderPlan=null;
  let skinGPU=null;
  let device=null, context=null, pipeline=null, sampler=null, depth=null;
  let querySet=null,queryResolve=null,queryRead=null,sampleDone=false,readPending=false,gpuSample=null;
  let kernel=await loadKernel(bytes), resources=[], disposed=false, generation=0, animationId=null;
  let previousTime=null, trace=0n, playing=false, sceneId=null, currentProject=null;
  let runtimeScene={entities:[]},scriptRuntime=null,scriptFlight=null,spawned=0,scriptFault=null;
  let workspaceId=null,sceneRevision=-1,lastFrame=null,captureRequest=null;
  let authoredHierarchy={entities:[]};
  let view='scene',editorCamera=null,transformPreview=null,geometry=[],lastPacket=null,lastTraceId=null,lineage=null;
  const decisions=new DecisionEvidence(),assetFailures=new Map();
  const keys=new Set();
  const keydown=event=>{if(playing&&!twoDPaused&&view==='game'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??"")&&keys.size<64&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|ShiftLeft|ShiftRight)$/.test(event.code))keys.add(event.code);};
  const keyup=event=>keys.delete(event.code),blur=()=>keys.clear();
  globalThis.addEventListener?.("keydown",keydown);globalThis.addEventListener?.("keyup",keyup);globalThis.addEventListener?.("blur",blur);
  const uiPointer=event=>{if(!playing||view!=='game'||!lastTwoDPlan)return;const rect=canvas.getBoundingClientRect(),hit=uiHit(runtimeScene,(event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height,lastTwoDPlan.pixel.viewport);if(!hit)return;event.preventDefault();event.stopImmediatePropagation();keys.clear();if(hit.ui2D.action==='togglePause')twoDPaused=!twoDPaused;};
  canvas.addEventListener?.('pointerdown',uiPointer,{capture:true});
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
      context.configure({device,format,viewFormats:[format+"-srgb"],alphaMode:"opaque"});
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
      skinGPU=await createSkinGPU(device);
      const currentDevice=device;
      device.lost.then(info=>{if(disposed)return;reportError(new Error(`AX_RENDERER_0003: GPU device lost (${info.reason}): ${info.message}`));skinGPU?.dispose();skinGPU=null;production?.dispose();production=null;twoDGPU?.dispose();twoDGPU=null;device=null;stateElement.textContent=`Null Renderer · GPU device lost (${info.reason})`;destroyResources(resources);resources=[];clearTextures();currentDevice.destroy();});
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
      const vertex=device.createBuffer({size:draw.vertices.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST|GPUBufferUsage.STORAGE});
      device.queue.writeBuffer(vertex,0,draw.vertices);
      const uniform=device.createBuffer({size:160,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
      const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:sampler},{binding:2,resource:texture.createView()}]});
      pending.push({vertex,uniform,bind,count:draw.vertices.length/8,color:draw.color,unlit:draw.unlit});
    }return pending;}catch(error){destroyResources(pending);throw error;}
  }
  async function setSnapshot(snapshot) {
    if(captureRequest){captureRequest.reject(new Error("Scene changed before capture"));captureRequest=null;}
    skinGPU?.reset();lastFrame=null;renderStats=null;lastRenderPlan=null;lastTwoDPlan=null;twoDPaused=false;twoDTime=0;
    const oldGeneration=generation,ticket=++generation,oldRuntime=scriptRuntime,oldScene=runtimeScene;
    scriptRuntime=null;
    if(oldRuntime) {
      try {await scriptFlight;const result=await oldRuntime.execute({action:"stop",generation:oldGeneration,entities:oldScene.entities,keys:[]});for(const op of result.operations??[])if(op.kind==="log")reportScriptLog(op.message,{generation:oldGeneration,phase:"stop",buildId:oldScene.script?.build.id});}
      catch(error){if(!oldRuntime.closed)reportError(error);}finally{oldRuntime.dispose();}
    }
    if(ticket!==generation||disposed)return;
    const project=snapshot.project;
    lineage=snapshot.commandLineage??null;assetFailures.clear();authoredHierarchy=structuredClone(project?.scene??{entities:[]});
    let scene=worldScene(structuredClone(project?.scene??{entities:[]}));for(const e of scene.entities)delete e.parentId;
    if(currentProject!==project?.id) { assets=new Map();assetKeys=new Map(); }
    const localAssets=new Map();
    const referenced=new Set(scene.entities.flatMap(entity=>[entity.renderable?.assetId,entity.tilemap?.assetId,...(entity.lod?.levels??[]).map(l=>l.assetId)]));
    let totalVertices=0;
    for(const metadata of (scene.assets??[]).filter(asset=>referenced.has(asset.id))) {
      let asset=assetKeys.get(metadata.id)===(metadata.buildKey??metadata.id)?assets.get(metadata.id):null;
      if(!asset) {try{asset=await loadAsset(project.id,metadata.id,snapshot.workspaceId);}catch(error){assetFailures.set(metadata.id,error.message);reportError(error);continue;}if(ticket!==generation||disposed)return;assets.set(metadata.id,asset);assetKeys.set(metadata.id,metadata.buildKey??metadata.id);}
      totalVertices+=(asset.kind==="sprite"?6:asset.vertexCount)*scene.entities.filter(entity=>entity.renderable?.assetId===metadata.id).length;
      if(totalVertices>300000)throw new Error("AX_SCENE_0006: scene exceeds 300000 vertices");
      localAssets.set(metadata.id,asset);
    }
    const replacement=await loadKernel(bytes);let pending=[],nextRuntime=null;
    let nextSpawned=0,nextScriptFault=null;
    try {
      if(snapshot.playing&&scene.script?.attachments.length) {
       try{
        nextRuntime=new ScriptRuntime();
        await nextRuntime.initialize(`/script-runtime/${project.id.slice(10)}/${scene.script.build.id}/dotnet.js`);
        const packet=await nextRuntime.execute({action:"start",generation:ticket,entities:scene.entities,keys:[],attachments:scene.script.attachments});
        const result=applyScriptOperations(scene,packet,ticket);scene=result.scene;nextSpawned=result.spawned;
        for(const message of result.logs)reportScriptLog(message,{generation:ticket,phase:"start",buildId:scene.script.build.id});
       }catch(error){nextRuntime?.dispose();nextRuntime=null;nextScriptFault=error.message;reportError(error);}
      }
      const drawable={...scene,entities:scene.entities.map(e=>e.renderable&&(!localAssets.has(e.renderable.assetId)||localAssets.get(e.renderable.assetId).kind!==e.renderable.kind)?Object.fromEntries(Object.entries(e).filter(([k])=>k!=='renderable')):e)};
      const authored=project?.scene??{entities:[]};let kernelScene=structuredClone(drawable);for(const e of authored.entities)if(e.parentId&&kernelScene.entities.some(n=>n.id===e.id)&&kernelScene.entities.some(n=>n.id===e.parentId))kernelScene.entities=reparent(kernelScene.entities,[e.id],e.parentId);
      const draws=replacement.compileScene(kernelScene,localAssets);
      if(snapshot.playing)replacement.configurePhysics(kernelScene);
      if(scene.twoD&&device){
        twoDGPU??=await createTwoDGPU({device,format:gpu.getPreferredCanvasFormat()+'-srgb',width:canvas.width,height:canvas.height,textureFor});
        await twoDGPU.prepare([...localAssets.values()].filter(a=>a.kind==='sprite').map(a=>a.dataUrl));
      }else if(scene.rendering&&device){
        production??=await (productionLoading??=createProductionGPU({device,format:gpu.getPreferredCanvasFormat(),width:canvas.width,height:canvas.height,textureFor,getTexture:url=>textures.get(url??"white"),reportError}));
        if(ticket!==generation||disposed){replacement.dispose();nextRuntime?.dispose();return;}
        production.reset();await production.prepare([...draws,...[...localAssets.values()].flatMap(a=>a.primitives??[])]);
      }else pending=await buildResources(draws,ticket);
      if(ticket!==generation||disposed){replacement.dispose();destroyResources(pending);nextRuntime?.dispose();return;}
      kernel.dispose();destroyResources(resources);kernel=replacement;resources=pending;geometry=draws;
      workspaceId=snapshot.workspaceId??null;sceneRevision=snapshot.sceneRevision;runtimeScene=scene;scriptRuntime=nextRuntime;spawned=nextSpawned;scriptFault=nextScriptFault;
      assets=localAssets;playing=!!snapshot.playing;sceneId=scene.id??null;currentProject=project?.id??null;previousTime=null;trace=0n;sampleDone=false;gpuSample=null;
      // Old texture entries are bounded to those referenced by the active scene.
      const used=new Set([...(scene.twoD?[...localAssets.values()].filter(a=>a.kind==='sprite').map(a=>({texture:a.dataUrl})):[]),...draws,...[...localAssets.values()].flatMap(a=>a.primitives??[])].map(draw=>draw.texture??"white"));
      if(scene.twoD)used.add("white");
      for(const [key,texture] of textures)if(!used.has(key)){texture.destroy();textures.delete(key);}
    } catch(error) {nextRuntime?.dispose();replacement.dispose();destroyResources(pending);throw error;}
  }
  async function frame(now) {
    if(disposed)return;
    const ticket=generation;
    try {
      const delta=previousTime===null?0:Math.min((now-previousTime)/1000,0.25);previousTime=now;
      const diagnostic=profiler.begin(performance.now());
      if(playing&&!twoDPaused&&scriptRuntime) {
        const active=scriptRuntime;
        try {
          const scriptStart=performance.now();
          scriptFlight=active.execute({action:"step",generation:ticket,entities:runtimeScene.entities,keys:[...keys],delta});
          const packet=await scriptFlight;diagnostic.scriptRoundTripMs=performance.now()-scriptStart;
          if(ticket!==generation||disposed){if(!disposed)animationId=requestAnimationFrame(frame);return;}
          const result=applyScriptOperations(runtimeScene,packet,ticket,spawned);
          if(result.changedTopology) {
            let next=[],draws;
            try {
              draws=scenePrimitives(result.scene,assets);if(result.scene.twoD&&device){await twoDGPU.prepare([...assets.values()].filter(a=>a.kind==='sprite').map(a=>a.dataUrl));}else if(result.scene.rendering&&device){production.reset();await production.prepare(draws);}else next=await buildResources(draws,ticket);
              if(ticket!==generation||disposed)throw new Error("Runtime generation changed");
              try {kernel.compileScene(result.scene,assets,true);kernel.configurePhysics(result.scene,true);}catch(error){kernel.compileScene(runtimeScene,assets);throw error;}
              destroyResources(resources);resources=next;geometry=draws;
            }catch(error){destroyResources(next);throw error;}
          }else kernel.setPositions(result.positions);
          kernel.setVelocities(result.velocities);
          runtimeScene=result.scene;spawned=result.spawned;for(const message of result.logs)reportScriptLog(message,{generation:ticket,phase:"update",traceId:diagnostic.traceId,frameTrace:trace.toString(),buildId:runtimeScene.script?.build.id});
        }catch(error){if(ticket===generation&&!disposed){scriptFault=error.message;reportError(error);active.dispose();scriptRuntime=null;}}
        finally{scriptFlight=null;}
      }
      if(ticket!==generation||disposed){if(!disposed)animationId=requestAnimationFrame(frame);return;}
      const packet=kernel.stepScene(twoDPaused?0:delta,++trace,canvas.width/canvas.height);
      const animations=kernel.animationStep(playing?delta:0,playing);diagnostic.animation=animations;diagnostic.animationProvenance={sceneRevision,workspaceId,generation};
      const animatedDraws=kernel.animationDraws();
      geometry=geometry.map((d,i)=>({...d,...(animatedDraws[i]?.skinPalette?{vertices:animatedDraws[i].vertices,skinSource:animatedDraws[i].skinSource,skinInfluences:animatedDraws[i].skinInfluences,skinPalette:animatedDraws[i].skinPalette}:{} )}));
      lastPacket=packet;lastTraceId=diagnostic.traceId;
      const camera=view==='scene'&&editorCamera?editorCamera:runtimeScene.camera??{position:[0,0,6],target:[0,0,0],projection:'perspective',fov:60,orthoHeight:6};
      const vp=cameraMatrix(camera,canvas.width/canvas.height);
      let previewScene=null;
      if(transformPreview){const draft=structuredClone(authoredHierarchy);draft.entities=updateTransforms(draft.entities,transformPreview.updates??[{entityId:transformPreview.entityId,transform:transformPreview.transform}],'world');previewScene=worldScene(draft);}
      const previewModels=new Map(previewScene?.entities.map(e=>[e.id,modelMatrix(e.transform)])??[]);
      geometry=geometry.map((draw,i)=>{const model=previewModels.get(draw.entityId)??packet.draws[i].model;return {...draw,model,mvp:view==='scene'||transformPreview?matrixMultiply(vp,model):packet.draws[i].mvp};});
      if(packet.transforms)for(const item of packet.transforms){const e=runtimeScene.entities.find(e=>e.id===item.id);if(e)e.transform=item.transform;}
      if(packet.physics){for(const b of packet.physics.bodies){const e=runtimeScene.entities.find(e=>e.id===b.id);if(!packet.transforms){e.transform.position=b.position;e.transform.rotation=b.rotation;}if(e.rigidBody){e.rigidBody.velocity=b.velocity;e.rigidBody.angularVelocity=b.angularVelocity;}}diagnostic.physics=packet.physics;}
      if(runtimeScene.twoD){
        twoDTime=kernel.twoD(playing&&!twoDPaused?delta:0);
        lastTwoDPlan=twoDPlan(previewScene??runtimeScene,assets,camera,canvas.width,canvas.height,{view,time:twoDTime,kernel,paused:twoDPaused});
        renderStats=device?twoDGPU.render(lastTwoDPlan,context.getCurrentTexture().createView({format:gpu.getPreferredCanvasFormat()+'-srgb'})):{...lastTwoDPlan.stats,submitted:0,backend:'null',pixels:'unavailable'};
        diagnostic.rendering=renderStats;diagnostic.camera=lastTwoDPlan.pixel.camera;
      }else if(runtimeScene.rendering){
        
        const plan=renderPlan(previewScene??runtimeScene,geometry,camera,canvas.width/canvas.height,assets,{gpuCulling:!!device&&device.limits.maxStorageBuffersPerShaderStage>=4});
        lastRenderPlan=plan;renderStats=device?production.render(plan,camera,context.getCurrentTexture().createView(),diagnostic.traceId):{...plan.stats,submittedReference:0,fallbacks:plan.fallbacks,gpuSample:null,pixels:'unavailable'};
        diagnostic.rendering=renderStats;
      }else if(device) {
        const encoder=device.createCommandEncoder({label:"axiom-m2-scene"});
        for(let i=0;i<geometry.length;i++)skinGPU.skin(geometry[i],resources[i].vertex,encoder);
        const sample=querySet&&!sampleDone&&!readPending&&resources.length>0;
        const pass=encoder.beginRenderPass({... (sample?{timestampWrites:{querySet,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}}:{}),colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0.025,g:0.035,b:0.055,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});
        pass.setPipeline(pipeline);
        for(let i=0;i<resources.length;i++) {
          const item=resources[i], matrix=geometry[i], uniforms=new Float32Array(40);
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
      diagnostic.camera=structuredClone(lastTwoDPlan?.pixel.camera??camera);
      diagnostic.kernel={frame:packet.frame,trace:packet.trace,fixedSteps:packet.fixedSteps,meshes:packet.nullProcessedMeshes,renderer:device?"webgpu":"null",mode:playing?"play":"stopped",view,sceneId};
      diagnostic.script={generation,active:!!scriptRuntime,fault:scriptFault,spawned,entities:playing?runtimeScene.entities.map(e=>({id:e.id,position:e.transform.position})):[]};
      profiler.finish(diagnostic,performance.now(),device?"submitted":"null");
      lastFrame={workspaceId,projectId:currentProject,sceneRevision,frame:packet.frame,traceId:diagnostic.traceId,view,renderer:device?'webgpu':'null',playing,generation,animation:animations,fault:scriptFault,rendering:renderStats,physics:packet.physics?{backend:packet.physics.backend,reason:packet.physics.reason,steps:packet.physics.steps,bodyCount:packet.physics.bodies.length,contactCount:packet.physics.contacts.length+packet.physics.omittedContacts,candidates:packet.physics.candidates}:null};
      if(decisions.deep&&packet.frame%15===0)decisions.record(evidence());
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
  function evidence(){const camera=view==='scene'&&editorCamera?editorCamera:runtimeScene.camera??{position:[0,0,6],target:[0,0,0],projection:'perspective',fov:60,orthoHeight:6};return {traceId:lastTraceId,correlationId:lineage?.correlationId??null,causationId:lineage?.messageId??null,projectId:currentProject,workspaceId,sceneRevision,frame:lastPacket?.frame,view,playing,renderer:device?'webgpu':'null',camera,rendering:renderStats,physics:lastPacket?.physics??null,script:{attached:!!runtimeScene.script,attachments:runtimeScene.script?.attachments??[],buildId:runtimeScene.script?.build.id??null,active:!!scriptRuntime,fault:scriptFault?.slice(0,2048)??null},assets:(runtimeScene.assets??[]).map(a=>({id:a.id,kind:assets.get(a.id)?.kind??a.kind,loaded:assets.has(a.id),error:assetFailures.get(a.id)?.slice(0,2048)??null})),entities:runtimeScene.entities.map(e=>{const draws=(lastTwoDPlan?.items??lastRenderPlan?.items??geometry).filter(d=>d.entityId===e.id);return {id:e.id,renderable:!!e.renderable||!!e.tilemap||!!e.particles2D,assetId:e.renderable?.assetId??e.tilemap?.assetId,kind:e.renderable?.kind??(e.tilemap?"sprite":undefined),scale:e.transform.scale,collider:e.collider,degenerate:draws.length>0&&draws.every(collapsedGeometry),drawCount:draws.length,renderDecision:lastRenderPlan?{culling:lastRenderPlan.settings.culling,lod:draws.map(d=>d.lod),admittedReference:draws.some(d=>d.visible),alphaMode:e.material?.alphaMode??'imported',pixels:'unproven'}:null,inFrustum:draws.some(d=>lastRenderPlan?d.visible:clipVisible(d,camera,canvas.width/canvas.height))};})};}
  return {setSnapshot,capture,animationControl(args){if(args.id!==currentProject||args.expectedSceneRevision!==sceneRevision||(args.workspaceId??null)!==workspaceId)throw Error('AX_SCENE_0002: Animation control revision is stale');return kernel.animationControl(args);},interaction:()=>({scene:runtimeScene,draws:lastTwoDPlan?.items??lastRenderPlan?.items??geometry,view,playing,projectId:currentProject,sceneRevision}),setView(value){view=value;keys.clear();transformPreview=null;},setEditorCamera(value){editorCamera=structuredClone(value);},previewTransform(value){transformPreview=value;},setDeepTrace(value){decisions.setDeep(value);},explain(args){if(!lastFrame)return {status:'unavailable',code:'AX_CAUSAL_0001',message:'No frame evidence yet',nodes:[],edges:[]};if(!args.traceId)decisions.record(evidence());return decisions.query({...args,id:currentProject,workspaceId});},status:()=>lastFrame??{},dispose(){captureRequest?.reject(new Error('Renderer disposed'));captureRequest=null;disposed=true;generation++;scriptRuntime?.dispose();globalThis.removeEventListener?.("keydown",keydown);globalThis.removeEventListener?.("keyup",keyup);globalThis.removeEventListener?.("blur",blur);if(animationId!==null)cancelAnimationFrame(animationId);kernel.dispose();skinGPU?.dispose();production?.dispose();twoDGPU?.dispose();canvas.removeEventListener?.("pointerdown",uiPointer,{capture:true});destroyResources(resources);clearTextures();depth?.destroy();querySet?.destroy();queryResolve?.destroy();queryRead?.destroy();device?.destroy();}};
}
