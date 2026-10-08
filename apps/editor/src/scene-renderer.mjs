import {applyRuntimeEdit} from '../../../engine/scene/runtime-edit.mjs';
import {activeGameCamera,legacyDirectionalUniforms} from '../../../engine/scene/camera.mjs';
import {ReplaySession,replayError} from './replay-session.mjs';
import {GameTestSession,testError} from './test-session.mjs';
import {parallelView} from './parallel-view.mjs';
import {createAudioSession} from './audio-session.mjs';
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
import {createGpuProfiler} from "./gpu-profiler.mjs";
import { FrameProfiler } from "./frame-profiler.js";
import {cameraMatrix,matrixMultiply,modelMatrix,clipVisible,collapsedGeometry} from './view-math.mjs';
import {DecisionEvidence} from './causal-diagnostics.mjs';

const shader = `
struct DirectionalLight { direction: vec4f, color: vec4f };
struct Uniforms { mvp: mat4x4f, model: mat4x4f, color: vec4f, flags: vec4f, lights: array<DirectionalLight,8> };
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
  var light = vec3f(0.0);
  for(var i=0u; i<u32(data.flags.y); i++){light += data.lights[i].color.rgb * data.lights[i].color.a * max(dot(normal,-data.lights[i].direction.xyz),0.0);}
  return vec4f(base.rgb * select(light,vec3f(1.0),data.flags.x > 0.5),base.a);
}`;

export async function createSceneRenderer({ canvas, stateElement, traceOutput, bytes, loadAsset, reportError, reportScriptLog=()=>{}, readAudio=async()=>{throw Error('Audio frame reader unavailable');}, forceNull=false, gpu=navigator.gpu }) {
  const profiler=new FrameProfiler(120);
  const audio=createAudioSession({forceNull,read:(assetId,offset,frames)=>readAudio({id:currentProject,expectedSceneRevision:sceneRevision,workspaceId:workspaceId??undefined,assetId,offset,frames})});
  const unlockAudio=()=>{void audio.unlock();};globalThis.addEventListener?.('pointerdown',unlockAudio,{capture:true});globalThis.addEventListener?.('keydown',unlockAudio,{capture:true});
  let twoDGPU=null,lastTwoDPlan=null,twoDPaused=false,twoDTime=0;
  let productionLoading=null,production=null,renderStats=null,lastRenderPlan=null;
  let skinGPU=null;
  let device=null, context=null, pipeline=null, sampler=null, depth=null;
  let gpuProfiler=null,gpuSample=null;
  let snapshotLoading=false,testing=false,frameInProgress=false,currentSnapshot=null,testSource=null,testGeneration=null,replaySeed=0,replaySeeded=false;
  let kernel=await loadKernel(bytes), resources=[], disposed=false, generation=0, animationId=null;
  const baseWidth=canvas.width,baseHeight=canvas.height;
  let previousTime=null, trace=0n, playing=false, sceneId=null, currentProject=null;
  let controlledPixels=null;
  let runtimeScene={entities:[]},scriptRuntime=null,scriptFlight=null,spawned=0,scriptFault=null;
  let measuredFps=null,fpsStart=null,fpsCount=0,traceDisplayAt=-Infinity;
  let workspaceId=null,sceneRevision=-1,lastFrame=null,captureRequest=null;
  let authoredHierarchy={entities:[]};
  let view='scene',editorCamera=null,transformPreview=null,geometry=[],lastPacket=null,lastTraceId=null,lineage=null;
  const decisions=new DecisionEvidence(),assetFailures=new Map();
  const keys=new Set();
  const keydown=event=>{if(!testing&&playing&&!twoDPaused&&(event.axiomView??event.target?.dataset?.parallelView??view)==='game'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??"")&&keys.size<64&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|ShiftLeft|ShiftRight)$/.test(event.code))keys.add(event.code);};
  const keyup=event=>keys.delete(event.code),blur=()=>keys.clear();
  globalThis.addEventListener?.("keydown",keydown);globalThis.addEventListener?.("keyup",keyup);globalThis.addEventListener?.("blur",blur);
  const uiPointer=event=>{if(testing||!playing||view!=='game'||!lastTwoDPlan)return;const rect=canvas.getBoundingClientRect(),hit=uiHit(runtimeScene,(event.clientX-rect.left)*canvas.width/rect.width,(event.clientY-rect.top)*canvas.height/rect.height,lastTwoDPlan.pixel.viewport);if(!hit)return;event.preventDefault();event.stopImmediatePropagation();keys.clear();if(hit.ui2D.action==='togglePause')twoDPaused=!twoDPaused;};
  canvas.addEventListener?.('pointerdown',uiPointer,{capture:true});
  let parallel=null;let textures=new Map(), assets=new Map(), assetKeys=new Map();
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
      skinGPU=await createSkinGPU(device);
      const currentDevice=device;
      device.lost.then(info=>{if(disposed)return;reportError(new Error(`AX_RENDERER_0003: GPU device lost (${info.reason}): ${info.message}`));skinGPU?.dispose();skinGPU=null;production?.dispose();production=null;twoDGPU?.dispose();twoDGPU=null;gpuProfiler?.dispose();gpuProfiler=createGpuProfiler(null,()=>{},()=>{});const parallelTarget=parallel?.get();parallel?.dispose();device=null;parallel=parallelView({device:null,gpu,pipeline,textureFor,getTexture:()=>null,reportError});parallel.set(parallelTarget,runtimeScene,assets,geometry);stateElement.textContent=`Null Renderer · GPU device lost (${info.reason})`;destroyResources(resources);resources=[];clearTextures();currentDevice.destroy();});
      stateElement.textContent=`WebGPU · project scene${timestamps?" · GPU timestamps":""}`;
      stateElement.classList.add("success");
    } catch(error) {reportError(error);device?.destroy();device=null;}
  }
  if(!device) stateElement.textContent=`Null Renderer · ${forceNull?"selected explicitly":"WebGPU unavailable"}`;
  gpuProfiler=createGpuProfiler(device,(sequence,ms,scopes,ticket)=>{if(profiler.attachGpuTiming(sequence,ms,scopes,ticket))gpuSample={frameSequence:sequence,milliseconds:ms};},(sequence,reason,ticket)=>profiler.gpuUnavailable(sequence,reason,ticket));
  parallel=parallelView({device,gpu,pipeline,textureFor,getTexture:url=>textures.get(url??'white'),reportError,onPointer:(event,target,plan)=>{if(testing||!playing||target?.view!=='game'||!plan)return;const c=target.canvas,r=c.getBoundingClientRect(),hit=uiHit(runtimeScene,(event.clientX-r.left)*c.width/r.width,(event.clientY-r.top)*c.height/r.height,plan.pixel.viewport);if(hit){event.preventDefault();keys.clear();if(hit.ui2D.action==='togglePause')twoDPaused=!twoDPaused;}}});
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
      const uniform=device.createBuffer({size:416,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
      const bind=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:sampler},{binding:2,resource:texture.createView()}]});
      pending.push({vertex,uniform,bind,count:draw.vertices.length/8,color:draw.color,unlit:draw.unlit});
    }return pending;}catch(error){destroyResources(pending);throw error;}
  }
  let runtimeEditing=false;
  async function editRuntime(edit) {
    if(!playing||testing||snapshotLoading||runtimeEditing)throw Error('AX_SCENE_0005: Runtime editing requires ordinary Play');
    const ticket=generation;runtimeEditing=true;
    try {
      while(frameInProgress)await new Promise(resolve=>setTimeout(resolve,1));
      if(ticket!==generation||!playing)throw Error('AX_SCENE_0002: Runtime changed during editing');
      const next=applyRuntimeEdit(runtimeScene,edit);
      if(edit.type==='scene.script.edit'&&scriptRuntime){const packet=await scriptRuntime.execute({action:'fields',generation:ticket,entities:runtimeScene.entities,keys:[],edits:[{entityId:edit.data.entityId,path:edit.data.path,values:edit.data.values}]});if(packet.error)throw Error(packet.error);}
      const previous=runtimeScene;
      try {if(edit.type!=='scene.script.edit'){geometry=kernel.compileScene(next,assets,true);kernel.configurePhysics(next,true);}}catch(error){kernel.compileScene(previous,assets,true);kernel.configurePhysics(previous,true);throw error;}
      runtimeScene=next;audio.reconcile(next);return {scene:structuredClone(next),generation:ticket};
    } finally {runtimeEditing=false;}
  }
  async function setSnapshot(snapshot,internalTest=false) {
    if(!internalTest&&!testing&&snapshot.playing&&playing&&snapshot.project?.id===currentProject&&(snapshot.workspaceId??null)===workspaceId&&snapshot.project.scene.script?.build.id===runtimeScene.script?.build.id){
      const ticket=generation;snapshotLoading=true;
      try{while(frameInProgress)await new Promise(resolve=>setTimeout(resolve,1));if(ticket!==generation||disposed)return;currentSnapshot=structuredClone(snapshot);if(sceneRevision!==snapshot.sceneRevision){sceneRevision=snapshot.sceneRevision;profiler.reset({projectId:currentProject,sceneRevision,workspaceId,generation});}if(captureRequest){captureRequest.reject(new Error('Scene revision changed before capture'));captureRequest=null;}}
      finally{if(ticket===generation)snapshotLoading=false;}return;
    }

    if(!internalTest){currentSnapshot=structuredClone(snapshot);if(testing){testing=false;testSession.control({action:'cancel'});replaySession.control({action:'cancel'});}}
    if(captureRequest){captureRequest.reject(new Error("Scene changed before capture"));captureRequest=null;}
    controlledPixels=null;measuredFps=null;fpsStart=null;fpsCount=0;traceDisplayAt=-Infinity;audio.clear();skinGPU?.reset();lastFrame=null;renderStats=null;lastRenderPlan=null;lastTwoDPlan=null;twoDPaused=false;twoDTime=0;
    const oldGeneration=generation,ticket=++generation,oldRuntime=scriptRuntime,oldScene=runtimeScene;
    snapshotLoading=true;
    try {
    profiler.reset({projectId:snapshot.project?.id??null,sceneRevision:snapshot.sceneRevision,workspaceId:snapshot.workspaceId??null,generation:ticket});
    scriptRuntime=null;
    if(oldRuntime) {
      try {await scriptFlight;const result=await oldRuntime.execute({action:"stop",generation:oldGeneration,entities:oldScene.entities,keys:[]});for(const op of result.operations??[])if(op.kind==="log")reportScriptLog(op.message,{generation:oldGeneration,phase:"stop",buildId:oldScene.script?.build.id});}
      catch(error){if(!oldRuntime.closed)reportError(error);}finally{oldRuntime.dispose();}
    }
    if(ticket!==generation||disposed)return;
    const project=snapshot.project;
    const scale=project?.scene.rendering?.renderScale??1,nextWidth=Math.round(baseWidth*scale),nextHeight=Math.round(baseHeight*scale);
    if(nextWidth!==canvas.width||nextHeight!==canvas.height){canvas.width=nextWidth;canvas.height=nextHeight;production?.dispose();production=null;productionLoading=null;twoDGPU?.dispose();twoDGPU=null;if(device){depth?.destroy();depth=device.createTexture({size:[nextWidth,nextHeight],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});}}

    lineage=snapshot.commandLineage??null;assetFailures.clear();authoredHierarchy=structuredClone(project?.scene??{entities:[]});
    let scene=worldScene(structuredClone(project?.scene??{entities:[]}));if(testing&&replaySeeded)for(const e of scene.entities)if(e.particles2D)e.particles2D.seed=replaySeed;for(const e of scene.entities)delete e.parentId;
    if(currentProject!==project?.id) { assets=new Map();assetKeys=new Map(); }
    const localAssets=new Map();
    const referenced=new Set(scene.entities.flatMap(entity=>[entity.audioSource?.assetId,entity.renderable?.assetId,entity.tilemap?.assetId,...(entity.lod?.levels??[]).map(l=>l.assetId)]));
    const drawableCounts=new Map();for(const entity of scene.entities)if(entity.renderable)drawableCounts.set(entity.renderable.assetId,(drawableCounts.get(entity.renderable.assetId)??0)+1);
    let totalVertices=0;
    for(const metadata of (scene.assets??[]).filter(asset=>referenced.has(asset.id))) {
      let asset=assetKeys.get(metadata.id)===(metadata.buildKey??metadata.id)?assets.get(metadata.id):null;
      if(!asset) {try{asset=await loadAsset(project.id,metadata.id,snapshot.workspaceId);}catch(error){assetFailures.set(metadata.id,error.message);reportError(error);continue;}if(ticket!==generation||disposed)return;assets.set(metadata.id,asset);assetKeys.set(metadata.id,metadata.buildKey??metadata.id);}
      if(asset.kind!=="audio")totalVertices+=(asset.kind==="sprite"?6:asset.vertexCount)*(drawableCounts.get(metadata.id)??0);
      if(totalVertices>300000)throw new Error("AX_SCENE_0006: scene exceeds 300000 vertices");
      localAssets.set(metadata.id,asset);
    }
    const replacement=await loadKernel(bytes);let pending=[],nextRuntime=null;
    let nextSpawned=0,nextScriptFault=null,startAnimationControls=[],startAudioControls=[];
    try {
      if(snapshot.playing&&scene.script?.attachments.length) {
       try{
        nextRuntime=new ScriptRuntime();
        await nextRuntime.initialize(`/script-runtime/${project.id.slice(10)}/${scene.script.build.id}/dotnet.js`);
        const packet=await nextRuntime.execute({action:"start",generation:ticket,entities:scene.entities,keys:[],attachments:scene.script.attachments,seed:testing?replaySeed:0,replay:testing});
        const result=applyScriptOperations(scene,packet,ticket);scene=result.scene;nextSpawned=result.spawned;startAnimationControls=result.animations;startAudioControls=result.audio;
        for(const message of result.logs)reportScriptLog(message,{generation:ticket,phase:"start",buildId:scene.script.build.id});
       }catch(error){nextRuntime?.dispose();nextRuntime=null;nextScriptFault=error.message;reportError(error);}
      }
      const drawable={...scene,entities:scene.entities.map(e=>e.renderable&&(!localAssets.has(e.renderable.assetId)||localAssets.get(e.renderable.assetId).kind!==e.renderable.kind)?Object.fromEntries(Object.entries(e).filter(([k])=>k!=='renderable')):e)};
      const authored=project?.scene??{entities:[]};let kernelScene=structuredClone(drawable);for(const e of authored.entities)if(e.parentId&&kernelScene.entities.some(n=>n.id===e.id)&&kernelScene.entities.some(n=>n.id===e.parentId))kernelScene.entities=reparent(kernelScene.entities,[e.id],e.parentId);
      const draws=replacement.compileScene(kernelScene,localAssets);
      if(snapshot.playing){replacement.configurePhysics(kernelScene);replacement.animationStep(0,true);for(const op of startAnimationControls)replacement.animationControl(op);}
      if(scene.twoD&&device){
        twoDGPU??=await createTwoDGPU({device,format:gpu.getPreferredCanvasFormat()+'-srgb',width:canvas.width,height:canvas.height,textureFor});
        await twoDGPU.prepare([...localAssets.values()].filter(a=>a.kind==='sprite').map(a=>a.dataUrl));
      }else if(scene.rendering&&device){
        production??=await (productionLoading??=createProductionGPU({device,format:gpu.getPreferredCanvasFormat(),width:canvas.width,height:canvas.height,textureFor,getTexture:url=>textures.get(url??"white"),reportError}));
        if(ticket!==generation||disposed){replacement.dispose();nextRuntime?.dispose();return;}
        production.reset();await production.prepare([...draws,...[...localAssets.values()].flatMap(a=>a.primitives??[])]);
      }else pending=await buildResources(draws,ticket);
      if(ticket!==generation||disposed){replacement.dispose();destroyResources(pending);nextRuntime?.dispose();return;}
      skinGPU?.reset();kernel.dispose();destroyResources(resources);kernel=replacement;resources=pending;geometry=draws;
      workspaceId=snapshot.workspaceId??null;sceneRevision=snapshot.sceneRevision;runtimeScene=scene;scriptRuntime=nextRuntime;spawned=nextSpawned;scriptFault=nextScriptFault;
      assets=localAssets;await parallel.prepare(scene,assets,draws);playing=!!snapshot.playing;sceneId=scene.id??null;currentProject=project?.id??null;await audio.configure(scene,localAssets,{playing:playing&&!internalTest});if(ticket!==generation||disposed)return;if(playing&&!internalTest)for(const op of startAudioControls)audio.control(op);previousTime=null;trace=0n;gpuSample=null;
      // Old texture entries are bounded to those referenced by the active scene.
      const used=new Set([...(scene.twoD?[...localAssets.values()].filter(a=>a.kind==='sprite').map(a=>({texture:a.dataUrl})):[]),...draws,...[...localAssets.values()].flatMap(a=>a.primitives??[])].map(draw=>draw.texture??"white"));
      if(scene.twoD)used.add("white");
      for(const [key,texture] of textures)if(!used.has(key)){texture.destroy();textures.delete(key);}
    } catch(error) {if(ticket===generation)audio.clear();nextRuntime?.dispose();replacement.dispose();destroyResources(pending);throw error;}
    }finally{if(ticket===generation)snapshotLoading=false;}
  }
  async function frame(now,manual=null) {
    if(disposed)return;
    if(snapshotLoading||runtimeEditing||testing&&!manual){if(!manual)animationId=requestAnimationFrame(frame);return;}
    frameInProgress=true;
    const ticket=generation,presentFrame=manual?.present!==false;
    try {
      const delta=manual?.delta??(previousTime===null?0:Math.min((now-previousTime)/1000,0.25));previousTime=now;
      const diagnostic=profiler.begin(performance.now(),crypto.randomUUID(),{view,playing,route:runtimeScene.twoD?'2d':runtimeScene.rendering?'hdr':'legacy'});
      const timing=presentFrame?gpuProfiler.begin(diagnostic.frameSequence,ticket):{reason:'Controlled simulation frame not presented',writes:()=>undefined,resolve(){},submitted(){}};diagnostic.gpuReason=timing.reason;
      if(playing&&!twoDPaused&&scriptRuntime) {
        const active=scriptRuntime;
        try {
          const scriptStart=performance.now();
          const animationStates=new Map(kernel.animationStatus().map(a=>[a.entityId,a]));
          scriptFlight=active.execute({action:"step",generation:ticket,entities:runtimeScene.entities.map(e=>({...e,animationState:animationStates.get(e.id)})),keys:[...keys],delta});
          profiler.scope(diagnostic,'script.prepare',scriptStart,performance.now());
          const packet=await scriptFlight;diagnostic.scriptRoundTripMs=performance.now()-scriptStart;
          if(ticket!==generation||disposed){if(!disposed&&!manual)animationId=requestAnimationFrame(frame);return;}
          profiler.scope(diagnostic,'script.roundtrip',scriptStart,performance.now(),'wall');
          if(Number.isFinite(packet.metrics?.workerDispatchMs)&&packet.metrics.workerDispatchMs>=0&&packet.metrics.workerDispatchMs<=2000)profiler.scope(diagnostic,'worker.dispatch',0,packet.metrics.workerDispatchMs,'worker');
          const applyStart=performance.now();
          const result=applyScriptOperations(runtimeScene,packet,ticket,spawned);
          if(result.changedTopology) {
            let next=[],draws;
            try {
              draws=scenePrimitives(result.scene,assets);if(result.scene.twoD&&device){await twoDGPU.prepare([...assets.values()].filter(a=>a.kind==='sprite').map(a=>a.dataUrl));}else if(result.scene.rendering&&device){production.reset();await production.prepare(draws);}else next=await buildResources(draws,ticket);
              if(ticket!==generation||disposed)throw new Error("Runtime generation changed");
              try {kernel.compileScene(result.scene,assets,true);kernel.configurePhysics(result.scene,true);}catch(error){kernel.compileScene(runtimeScene,assets);throw error;}
              destroyResources(resources);resources=next;geometry=draws;await parallel.prepare(result.scene,assets,draws);
            }catch(error){destroyResources(next);throw error;}
          }else kernel.setPositions(result.positions);
          kernel.setVelocities(result.velocities);
          for(const op of result.animations)kernel.animationControl(op);
          runtimeScene=result.scene;audio.reconcile(runtimeScene);if(!testing)for(const op of result.audio)audio.control(op);spawned=result.spawned;for(const message of result.logs)reportScriptLog(message,{generation:ticket,phase:"update",traceId:diagnostic.traceId,frameTrace:trace.toString(),buildId:runtimeScene.script?.build.id});
          profiler.scope(diagnostic,'script.apply',applyStart,performance.now(),result.changedTopology?'wall':'main');
        }catch(error){if(ticket===generation&&!disposed){scriptFault=error.message;reportError(error);active.dispose();scriptRuntime=null;}}
        finally{scriptFlight=null;}
      }
      if(ticket!==generation||disposed){if(!disposed&&!manual)animationId=requestAnimationFrame(frame);return;}
      diagnostic.profileContext.view=view;
      let stageStart=performance.now();
      const packet=kernel.stepScene(twoDPaused?0:delta,++trace,canvas.width/canvas.height);
      profiler.scope(diagnostic,'kernel.world-physics',stageStart,performance.now());stageStart=performance.now();
      const animations=kernel.animationStep(playing?delta:0,playing);diagnostic.animation=animations;diagnostic.animationProvenance={sceneRevision,workspaceId,generation};
      const animatedDraws=kernel.animationDraws();
      geometry=geometry.map((d,i)=>({...d,...(animatedDraws[i]?.skinPalette?{vertices:animatedDraws[i].vertices,skinSource:animatedDraws[i].skinSource,skinInfluences:animatedDraws[i].skinInfluences,skinPalette:animatedDraws[i].skinPalette}:{} )}));
      profiler.scope(diagnostic,'animation.evaluate',stageStart,performance.now());stageStart=performance.now();
      lastPacket=packet;lastTraceId=diagnostic.traceId;
      if(packet.transforms)for(const item of packet.transforms){const e=runtimeScene.entities.find(e=>e.id===item.id);if(e)e.transform=item.transform;}
      if(packet.physics){for(const b of packet.physics.bodies){const e=runtimeScene.entities.find(e=>e.id===b.id);if(!e)continue;if(!packet.transforms){e.transform.position=b.position;e.transform.rotation=b.rotation;}if(e.rigidBody){e.rigidBody.velocity=b.velocity;e.rigidBody.angularVelocity=b.angularVelocity;}}diagnostic.physics=packet.physics;}
      let previewScene=null;
      if(transformPreview){const draft=structuredClone(authoredHierarchy);draft.entities=updateTransforms(draft.entities,transformPreview.updates??[{entityId:transformPreview.entityId,transform:transformPreview.transform}],'world');previewScene=worldScene(draft);}
      const gameCamera=activeGameCamera(previewScene??runtimeScene),missingCamera=view==='game'&&!gameCamera;
      const camera=view==='scene'&&editorCamera?editorCamera:gameCamera??{position:[0,0,6],target:[0,0,0],projection:'perspective',fov:60,orthoHeight:6};
      const renderScene=missingCamera?{...(previewScene??runtimeScene),entities:[]}:(previewScene??runtimeScene);
      const vp=cameraMatrix(camera,canvas.width/canvas.height);
      const previewModels=new Map(previewScene?.entities.map(e=>[e.id,modelMatrix(e.transform)])??[]);
      geometry=geometry.map((draw,i)=>{const model=previewModels.get(draw.entityId)??packet.draws[i].model;return {...draw,model,mvp:matrixMultiply(vp,model)};});
      const visibleGeometry=missingCamera?[]:geometry,directional=legacyDirectionalUniforms(renderScene);
      canvas.dataset.activeCamera=gameCamera?.entityId??(missingCamera?'none':'legacy');
      if(runtimeScene.twoD){
        twoDTime=kernel.twoD(playing&&!twoDPaused?delta:0);
        lastTwoDPlan=twoDPlan(renderScene,assets,camera,canvas.width,canvas.height,{view,time:twoDTime,kernel,paused:twoDPaused});
        profiler.scope(diagnostic,'render.prepare',stageStart,performance.now());stageStart=performance.now();
        renderStats=device&&presentFrame?twoDGPU.render(lastTwoDPlan,context.getCurrentTexture().createView({format:gpu.getPreferredCanvasFormat()+'-srgb'}),timing):{...lastTwoDPlan.stats,submitted:0,backend:device?'controlled-step':'null',pixels:'unavailable'};
        diagnostic.rendering=renderStats;diagnostic.camera=lastTwoDPlan.pixel.camera;
      }else if(runtimeScene.rendering){
        
        const plan=renderPlan(renderScene,visibleGeometry,camera,canvas.width/canvas.height,assets,{gpuCulling:!!device&&device.limits.maxStorageBuffersPerShaderStage>=4});
        profiler.scope(diagnostic,'render.prepare',stageStart,performance.now());stageStart=performance.now();
        lastRenderPlan=plan;renderStats=device&&presentFrame?production.render(plan,camera,context.getCurrentTexture().createView(),diagnostic.traceId,timing):{...plan.stats,submittedReference:0,fallbacks:plan.fallbacks,gpuSample:null,pixels:'unavailable'};
        diagnostic.rendering=renderStats;
      }else {
        profiler.scope(diagnostic,'render.prepare',stageStart,performance.now());stageStart=performance.now();
        if(device&&presentFrame) {
        const encoder=device.createCommandEncoder({label:"axiom-m2-scene"});
        for(let i=0;i<geometry.length;i++)skinGPU.skin(geometry[i],resources[i].vertex,encoder);
        const pass=encoder.beginRenderPass({timestampWrites:timing.writes('legacy.color'),colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:0.025,g:0.035,b:0.055,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});
        pass.setPipeline(pipeline);
        for(let i=0;i<visibleGeometry.length;i++) {
          const item=resources[i], matrix=geometry[i], uniforms=new Float32Array(104);
          uniforms.set(matrix.mvp,0);uniforms.set(matrix.model,16);uniforms.set(item.color,32);uniforms[36]=item.unlit?1:0;uniforms[37]=directional.count;uniforms.set(directional.data,40);
          device.queue.writeBuffer(item.uniform,0,uniforms);
          pass.setBindGroup(0,item.bind);pass.setVertexBuffer(0,item.vertex);pass.draw(item.count);
        }
        pass.end();
        timing.resolve(encoder);device.queue.submit([encoder.finish()]);timing.submitted();
        }
      }
      if(presentFrame){parallel.render({scene:previewScene??runtimeScene,assets,draws:geometry,resources,editorCamera,time:twoDTime,kernel,paused:twoDPaused,frame:packet.frame,generation});canvas.dataset.frame=String(packet.frame);canvas.dataset.camera=JSON.stringify(camera);}
      // Preserve requested pixels before yielding: a presented WebGPU drawing
      // buffer may be cleared before the async test adapter reads the canvas.
      if(device&&presentFrame&&manual?.capturePixels){controlledPixels??=canvas.ownerDocument.createElement('canvas');controlledPixels.width=canvas.width;controlledPixels.height=canvas.height;controlledPixels.getContext('2d',{willReadFrequently:true}).drawImage(canvas,0,0);}
      profiler.scope(diagnostic,'render.submit',stageStart,performance.now());stageStart=performance.now();
      const audioState=audio.step(runtimeScene,{playing,view:view==='game'||parallel.get()?.view==='game'?'game':'scene',paused:twoDPaused||testing});diagnostic.audio=audioState;diagnostic.audioProvenance={projectId:currentProject,sceneRevision,workspaceId,generation};
      profiler.scope(diagnostic,'audio.update',stageStart,performance.now());
      diagnostic.camera=structuredClone(lastTwoDPlan?.pixel.camera??camera);
      diagnostic.kernel={frame:packet.frame,trace:packet.trace,fixedSteps:packet.fixedSteps,meshes:packet.nullProcessedMeshes,renderer:device?"webgpu":"null",mode:playing?"play":"stopped",view,sceneId};
      diagnostic.script={generation,active:!!scriptRuntime,fault:scriptFault,spawned,entities:playing?runtimeScene.entities.map(e=>({id:e.id,position:e.transform.position})):[]};
      profiler.finish(diagnostic,performance.now(),device&&presentFrame?"submitted":device?"not-presented":"null");
      if(!manual){if(fpsStart===null)fpsStart=now;fpsCount++;if(now-fpsStart>=500){measuredFps=fpsCount*1000/(now-fpsStart);fpsCount=0;fpsStart=now;}}
      lastFrame={fps:measuredFps,wasmMemoryBytes:kernel.memoryBytes?.()??null,profiler:profiler.summary(),workspaceId,projectId:currentProject,sceneRevision,frame:packet.frame,traceId:diagnostic.traceId,view,renderer:device?'webgpu':'null',playing,generation,replay:{id:replaySession.job?.id??null,status:replaySession.job?.status??'idle',kind:replaySession.job?.kind??null,recordingId:replaySession.recording?.id??null,frames:replaySession.job?.frames??0},gameTest:{id:testSession.job?.id??null,status:testSession.job?.status??'idle',frames:testSession.job?.frames??0},audio:audioState,animation:animations,fault:scriptFault,rendering:renderStats,physics:packet.physics?{backend:packet.physics.backend,reason:packet.physics.reason,steps:packet.physics.steps,bodyCount:packet.physics.bodies.length,contactCount:packet.physics.contacts.length+packet.physics.omittedContacts,candidates:packet.physics.candidates}:null};
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
      const traceTime=performance.now(),traceInterval=runtimeScene.entities.length>64?1000:200;
      if(packet.frame===1||packet.frame%15===0||traceTime-traceDisplayAt>=traceInterval){traceOutput.textContent=JSON.stringify({...diagnostic,gpuSample},null,2);traceDisplayAt=traceTime;}
      // Bound queued GPU work on slow adapters; manual test/replay pixels must
      // also complete before their next controlled frame. Device loss owns fallback.
      if(device&&presentFrame){const submittedDevice=device;await submittedDevice.queue.onSubmittedWorkDone().catch(()=>submittedDevice.lost);}
    } catch(error) {audio.clear();lastFrame={...lastFrame,audio:audio.status(),audioFault:error.message.slice(0,2048),animationFault:error.message.slice(0,2048)};reportError(error);stateElement.textContent="Rendering stopped · inspect the console";if(manual)throw error;return;}finally{frameInProgress=false;}
    if(!manual)animationId=requestAnimationFrame(frame);
  }
  const isolatedAdapter={
    async begin({seed}={}){replaySeed=seed??0;replaySeeded=seed!==undefined;if(!currentSnapshot?.project||playing)throw testError('Open a stopped project first');testSource=currentSnapshot;testing=true;keys.clear();while(frameInProgress)await new Promise(r=>setTimeout(r,1));await setSnapshot({...testSource,playing:true},true);if(currentSnapshot!==testSource)throw testError('Project changed','AX_TEST_0002');testGeneration=generation;view='game';audio.clear();},
    async step(input,{present=true,capturePixels=false}={}){if(!testing||generation!==testGeneration||currentSnapshot!==testSource)throw testError('Runtime generation changed','AX_TEST_0002');keys.clear();for(const key of input.keys)keys.add(key);try{await frame(0,{...input,present,capturePixels});if(scriptFault)throw testError(scriptFault);if(!testing||generation!==testGeneration)throw testError('Runtime changed','AX_TEST_0002');}finally{keys.clear();}},
    async state(assertions){let pixels=null;if(assertions.some(a=>a.kind==='pixel')&&device){if(!controlledPixels)throw testError('Requested frame pixels were not retained');const ctx=controlledPixels.getContext('2d',{willReadFrequently:true});pixels={};for(const a of assertions.filter(a=>a.kind==='pixel'))pixels[a.x+','+a.y]=Array.from(ctx.getImageData(a.x,a.y,1,1).data);}return {entities:structuredClone(runtimeScene.entities),contacts:structuredClone(lastPacket?.physics?.contacts??[]),animation:kernel.animationStatus(),pixels};},
    async end(){keys.clear();const source=testSource;testSource=null;testGeneration=null;const originalView=testView;try{if(!disposed&&source&&currentSnapshot===source)await setSnapshot(source,true);}finally{testing=false;if(source&&currentSnapshot===source)view=originalView;previousTime=null;}}
  };
  const testSession=new GameTestSession(isolatedAdapter);
  const replaySession=new ReplaySession({...isolatedAdapter,scope:()=>({id:currentProject,sceneRevision,workspaceId,resources:(currentSnapshot?.project.scene.assets??[]).map(a=>({id:a.id,buildKey:a.buildKey??null})),script:currentSnapshot?.project.scene.script?.build?.id??null}),snapshot:()=>({entities:runtimeScene.entities,physics:kernel.physicsSnapshot(),animation:kernel.animationStatus(),time:twoDTime}),diagnostic:args=>{decisions.record(evidence());return args?{traceId:lastTraceId,evidence:decisions.query({...args,id:currentProject,workspaceId})}:{traceId:lastTraceId,contacts:structuredClone(lastPacket?.physics?.contacts??[]),animation:kernel.animationStatus()};}});let testView='scene';
  function replayControl(args){if(args.id!==currentProject||args.expectedSceneRevision!==sceneRevision||(args.workspaceId??null)!==workspaceId)throw replayError('Project revision changed');if(testSession.active)throw replayError('Finish the active game test first');if(['record','replay'].includes(args.action))testView=view;return replaySession.control(args);}
  function gameTestControl(args){if(replaySession.active)throw testError('Finish replay first');if(args.id!==currentProject||args.expectedSceneRevision!==sceneRevision||(args.workspaceId??null)!==workspaceId)throw testError('Project revision changed','AX_TEST_0002');if(args.action==='begin'||args.action==='run')testView=view;return testSession.control(args);}
  animationId=requestAnimationFrame(frame);
  function capture(args){
    if(disposed||!device||captureRequest||!lastFrame) return Promise.reject(new Error('WebGPU capture unavailable'));
    return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{if(captureRequest?.args===args)captureRequest=null;reject(new Error('Capture timed out'));},4000);captureRequest={args,resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}};});
  }
  function evidence(){const camera=view==='scene'&&editorCamera?editorCamera:activeGameCamera(runtimeScene)??{position:[0,0,6],target:[0,0,0],projection:'perspective',fov:60,orthoHeight:6};return {traceId:lastTraceId,correlationId:lineage?.correlationId??null,causationId:lineage?.messageId??null,projectId:currentProject,workspaceId,sceneRevision,frame:lastPacket?.frame,view,playing,renderer:device?'webgpu':'null',camera,rendering:renderStats,physics:lastPacket?.physics??null,script:{attached:!!runtimeScene.script,attachments:runtimeScene.script?.attachments??[],buildId:runtimeScene.script?.build.id??null,active:!!scriptRuntime,fault:scriptFault?.slice(0,2048)??null},assets:(runtimeScene.assets??[]).map(a=>({id:a.id,kind:assets.get(a.id)?.kind??a.kind,loaded:assets.has(a.id),error:assetFailures.get(a.id)?.slice(0,2048)??null})),entities:runtimeScene.entities.map(e=>{const draws=(lastTwoDPlan?.items??lastRenderPlan?.items??geometry).filter(d=>d.entityId===e.id);return {id:e.id,renderable:!!e.renderable||!!e.tilemap||!!e.particles2D,assetId:e.renderable?.assetId??e.tilemap?.assetId,kind:e.renderable?.kind??(e.tilemap?"sprite":undefined),scale:e.transform.scale,collider:e.collider,degenerate:draws.length>0&&draws.every(collapsedGeometry),drawCount:draws.length,renderDecision:lastRenderPlan?{culling:lastRenderPlan.settings.culling,lod:draws.map(d=>d.lod),admittedReference:draws.some(d=>d.visible),alphaMode:e.material?.alphaMode??'imported',pixels:'unproven'}:null,inFrustum:draws.some(d=>lastRenderPlan?d.visible:clipVisible(d,camera,canvas.width/canvas.height))};})};}
  return {editRuntime,replayControl,replayStatus:()=>replaySession.result(),gameTestControl,testStatus:()=>testSession.result(),parallelViewport:()=>parallel.get()?.view??null,setParallelViewport:value=>parallel.set(value,runtimeScene,assets,geometry),setSnapshot,capture,profilerCaptures:()=>profiler.captures(),captureProfiler:()=>profiler.capture(),profilerQuery(args){if(args.id!==currentProject||args.expectedSceneRevision!==sceneRevision||(args.workspaceId??null)!==workspaceId)throw Error('AX_SCENE_0002: Profiler revision is stale');return args.action==='explain'?profiler.explainFrameSpike(args):profiler.history(args);},setProfilerPaused:value=>profiler.pause(value),clearProfiler(){profiler.reset({projectId:currentProject,sceneRevision,workspaceId,generation});},unlockAudio:()=>audio.unlock(),audioControl(args){if(args.id!==currentProject||args.expectedSceneRevision!==sceneRevision||(args.workspaceId??null)!==workspaceId)throw Error('AX_SCENE_0002: Audio control revision is stale');return audio.control(args);},animationControl(args){if(args.id!==currentProject||args.expectedSceneRevision!==sceneRevision||(args.workspaceId??null)!==workspaceId)throw Error('AX_SCENE_0002: Animation control revision is stale');return kernel.animationControl(args);},interaction:()=>({scene:runtimeScene,draws:lastTwoDPlan?.items??lastRenderPlan?.items??geometry,view,playing,projectId:currentProject,sceneRevision}),setView(value){if(testing){testView=value;return;}const changed=view!==value;view=value;audio.step(runtimeScene,{playing,view:view==='game'||parallel.get()?.view==='game'?'game':'scene',paused:twoDPaused});if(changed)keys.clear();transformPreview=null;},setEditorCamera(value){editorCamera=structuredClone(value);},previewTransform(value){transformPreview=value;},setDeepTrace(value){decisions.setDeep(value);},explain(args){if(!lastFrame)return {status:'unavailable',code:'AX_CAUSAL_0001',message:'No frame evidence yet',nodes:[],edges:[]};if(!args.traceId)decisions.record(evidence());return decisions.query({...args,id:currentProject,workspaceId});},status:()=>({...lastFrame,projectId:currentProject,sceneRevision,workspaceId,generation,renderer:device?'webgpu':'null',playing,view,replay:{id:replaySession.job?.id??null,status:replaySession.job?.status??'idle',kind:replaySession.job?.kind??null,recordingId:replaySession.recording?.id??null,frames:replaySession.job?.frames??0},gameTest:{id:testSession.job?.id??null,status:testSession.job?.status??'idle',frames:testSession.job?.frames??0}}),dispose(){captureRequest?.reject(new Error('Renderer disposed'));captureRequest=null;disposed=true;testSession.control({action:'cancel'});replaySession.control({action:'cancel'});parallel.dispose();audio.dispose();globalThis.removeEventListener?.('pointerdown',unlockAudio,{capture:true});globalThis.removeEventListener?.('keydown',unlockAudio,{capture:true});generation++;scriptRuntime?.dispose();globalThis.removeEventListener?.("keydown",keydown);globalThis.removeEventListener?.("keyup",keyup);globalThis.removeEventListener?.("blur",blur);if(animationId!==null)cancelAnimationFrame(animationId);kernel.dispose();skinGPU?.dispose();production?.dispose();twoDGPU?.dispose();canvas.removeEventListener?.("pointerdown",uiPointer,{capture:true});destroyResources(resources);clearTextures();depth?.destroy();gpuProfiler?.dispose();device?.destroy();}};
}
