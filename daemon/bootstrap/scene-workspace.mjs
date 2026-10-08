import {reconcileScriptComponents,compileSources,setScriptComponent} from '../../engine/scripting/fields.mjs';
import {meshSettings} from '../../engine/assets/advanced.mjs';
import {createHash} from 'node:crypto';
import {revealProjectFiles} from './project-explorer.mjs';
import {editProjectFiles,syncImportedFiles,projectFiles} from '../../engine/scene/project-files.mjs';
import {primitiveSprite} from '../../engine/scene/primitive-sprites.mjs';
import {PNG} from 'pngjs';
import {twoDDefaults,component2DDefaults} from '../../engine/renderer/two-d-plan.mjs';
import {activateCamera,cameraRotation} from '../../engine/scene/camera.mjs';
import {addExample} from '../../engine/scene/examples.mjs';
import {readPcm} from '../../engine/assets/audio.mjs';
import {orderEntities,updateTransforms,selectedRoots} from '../../engine/scene/editor-operations.mjs';
import {reparent,worldTransforms} from '../../engine/scene/hierarchy.mjs';
import {primitiveGlb} from '../../engine/scene/primitives.mjs';
import {ScriptCompiler} from './scripting/compiler.mjs';
import { AssetPipeline, importInWorker } from "./asset-pipeline.mjs";
import { AssetStore } from "./asset-store.mjs";
import { randomUUID } from "node:crypto";
import { validateProject, projectError } from "../../protocol/src/project-document.mjs";

const copy = value => structuredClone(value);
const fail = (code, message) => { throw projectError(code, message); };

// One shared authoring workspace per daemon. Every mutation checks its revision.
export class SceneWorkspace {
  constructor(store) {
    this.store = store;
    this.compiler = new ScriptCompiler(store);
    this.scriptJobs = new Map();
    this.activeScriptJob = null;
    this.assets = new AssetStore(store);
    this.pipeline = new AssetPipeline(this.assets);
    this.jobs = new Map();
    this.activeJob = null;
    this.playing = false;
    this.project = null;
    this.revision = 0;
    this.savedScene = null;
    this.past = [];
    this.future = [];
  }
  async validateResources(scene) {
    const resources=new Map();let vertices=0,draws=0,animatedVertices=0;
    let decoded=0;const audioIds=new Set();
    for(const entity of scene.entities) {
      if(entity.audioSource){const a=entity.audioSource,r=await this.pipeline.resource(this.project.id,scene,a.assetId);if(r.kind!=='audio'||r.durationSeconds>600||a.spatial&&r.channels!==1||!a.stream&&(r.durationSeconds>30||r.frames*r.channels*4>4194304))fail('AX_ASSET_0001','Audio requires PCM WAV, mono spatial sources, streaming above 30 seconds / 4 MiB and at most 600 seconds');if(!a.stream&&!audioIds.has(a.assetId)){audioIds.add(a.assetId);decoded+=r.frames*r.channels*4;if(decoded>16777216)fail('AX_ASSET_0001','Decoded audio budget exceeds 16 MiB');}}

      if(entity.tilemap){const a=await this.pipeline.resource(this.project.id,scene,entity.tilemap.assetId);if(a.kind!=='sprite'||a.width%entity.tilemap.columns||a.height%entity.tilemap.rows)fail('AX_ASSET_0001','Tile atlas dimensions must divide the PNG');}
      if(entity.sprite2D){const a=await this.pipeline.resource(this.project.id,scene,entity.renderable.assetId);if(a.width%entity.sprite2D.columns||a.height%entity.sprite2D.rows)fail('AX_ASSET_0001','Sprite atlas dimensions must divide the PNG');}

      if(!entity.renderable)continue;
      const id=entity.renderable.assetId;
      if(!resources.has(id))resources.set(id,await this.pipeline.resource(this.project.id,scene,id));
      const resource=resources.get(id);
      if(entity.animator){if(!resource.animation?.clips.length||entity.animator.states.some(s=>!resource.animation.clips.some(c=>c.name===s.clip)))fail('AX_ASSET_0001','Animator references missing animation clips');animatedVertices+=resource.vertexCount;if(animatedVertices>65536)fail('AX_SCENE_0006','Animated vertex budget exceeded');}
      for(const level of entity.lod?.levels??[]){if(!resources.has(level.assetId))resources.set(level.assetId,await this.pipeline.resource(this.project.id,scene,level.assetId));const alternate=resources.get(level.assetId);if(alternate.kind!=="mesh"||alternate.primitives.length!==resource.primitives.length)fail("AX_ASSET_0001","LOD meshes must share the base primitive count");if(alternate.vertexCount>300000)fail("AX_SCENE_0006","LOD vertex limit exceeded");}
      if(resource.kind!==entity.renderable.kind)fail("AX_ASSET_0001","Asset kind does not match the entity component");
      vertices+=resource.kind==="sprite"?6:resource.vertexCount;
      draws+=resource.kind==="sprite"?1:resource.primitives.length;
      if(vertices>300000||draws>1024)fail("AX_SCENE_0006","Scene exceeds 300000 vertices or 1024 draw items");
    }
  }
  get dirty() { return this.project !== null && JSON.stringify(this.project.scene) !== this.savedScene; }
  snapshot() {
    return { project: copy(this.project), sceneRevision: this.revision, dirty: this.dirty, canUndo: this.past.length > 0, canRedo: this.future.length > 0, playing: this.playing };
  }
  activate(project) {
    this.project = copy(project);
    this.playing = false;
    this.savedScene = JSON.stringify(project.scene);
    this.past = [];
    this.future = [];
    this.revision++;
    return this.snapshot();
  }
  check(data) {
    if (!this.project || data.id !== this.project.id) fail("AX_SCENE_0001", "Open this project in the workspace first");
    if (data.expectedSceneRevision !== this.revision) fail("AX_SCENE_0002", "Scene changed; refresh before editing");
  }
  commitScene(scene) {
    syncImportedFiles(scene,this.project.scene);
    validateProject({...this.project,scene});
    if(Buffer.byteLength(JSON.stringify({...this.project,scene},null,2)+"\n")>192*1024)fail("AX_PROJECT_0002","Project size exceeds limit");
    this.past.push(copy(this.project.scene));if(this.past.length>64)this.past.shift();
    this.future=[];this.project.scene=scene;this.revision++;
  }
  startJob(data,context) {
    if(this.activeJob)fail("AX_ASSET_0001","An asset job is already running");
    if(!["import","replace","bindTexture","process"].includes(data.operation))fail("AX_ASSET_0001","Unknown asset job operation");
    const scene=copy(this.project.scene),previous=copy(scene.assets??[]),projectId=this.project.id,revision=this.revision;
    const job={id:randomUUID(),projectId,assetId:data.assetId??null,operation:data.operation,status:"queued",traceId:context?.traceId??null};
    this.jobs.set(job.id,job);if(this.jobs.size>64)this.jobs.delete(this.jobs.keys().next().value);
    const controller=new AbortController();this.activeJob={id:job.id,controller};
    // Return the receipt before CPU work begins. Commit only against the captured revision.
    setImmediate(async()=>{
      try {
        job.status="running";
        if(controller.signal.aborted)fail("AX_ASSET_0001","Import cancelled");
        scene.assets??=[];
        let record=scene.assets.find(a=>a.id===data.assetId);
        if(data.operation!=="import"&&!record)fail("AX_ASSET_0001","Asset is not in this project");
        if(data.operation==='process'){if(record.kind!=='mesh'||record.variant)fail('AX_ASSET_0001','Select an original static mesh');record.processing=meshSettings(data.settings??{});}else if(data.operation==="bindTexture") {record.textureId=data.textureId;validateProject({...this.project,scene});}
        else {
          const imported=await this.assets.put(projectId,data.name??record?.name,data.base64,bytes=>importInWorker(bytes,controller.signal,data.settings));
          if(data.operation==="replace") {if(imported.kind!==record.kind)fail("AX_ASSET_0001","Replacement source changes asset kind");record.sourceId=imported.id;}
          else {
            if(scene.assets.length>=128)fail("AX_ASSET_0001","Project asset limit is 128");
            record=scene.assets.find(a=>a.id===imported.id);
            if(!record){record={...imported,...(data.settings&&imported.kind==='mesh'?{processing:meshSettings(data.settings)}:{})};scene.assets.push(record);}
            job.assetId=record.id;
          }
        }
        validateProject({...this.project,scene});
        job.build=await this.pipeline.build(projectId,scene,previous,controller.signal);
        if(data.operation==='process'){
          const entity=scene.entities.find(e=>e.id===data.entityId&&e.renderable?.assetId===record.id);if(!entity)fail('AX_SCENE_0001','Select an entity using this mesh');
          const base=await this.pipeline.resource(projectId,scene,record.id,controller.signal);if(base.animation)fail('AX_ASSET_0001','Generated LOD/collision supports static meshes');
          if(data.generateLod){const levels=[];for(const [ratio,distance]of [[.6,10],[.25,25]]){const id='asset://'+createHash('sha256').update(JSON.stringify({base:record.id,ratio,version:1})).digest('hex');if(!scene.assets.some(a=>a.id===id))scene.assets.push({id,sourceId:record.sourceId??record.id,name:record.name+' LOD '+ratio,kind:'mesh',variant:{assetId:record.id,ratio}});levels.push({assetId:id,distance});}entity.lod={levels};}
          if(data.generateCollider){const minimum=base.bounds.minimum,maximum=base.bounds.maximum,center=minimum.map((v,i)=>(v+maximum[i])/2);if(center.some(v=>Math.abs(v)>1e-6))fail('AX_ASSET_0001','Enable Center geometry before generating a centered box Collider');entity.collider={dimension:3,shape:'box',halfExtents:minimum.map((v,i)=>Math.max(.001,(maximum[i]-v)/2)),trigger:false,layer:1,mask:4294967295};}
          job.build=await this.pipeline.build(projectId,scene,previous,controller.signal);
        }
        if(this.project?.id!==projectId||this.revision!==revision||this.playing)fail("AX_SCENE_0002","Scene changed during import; retry on the current revision");
        await this.validateResources(scene);
        if(controller.signal.aborted)fail("AX_ASSET_0001","Import cancelled");
        if(this.project?.id!==projectId||this.revision!==revision||this.playing)fail("AX_SCENE_0002","Scene changed during import; retry on the current revision");
        this.commitScene(scene);job.status="completed";job.sceneRevision=this.revision;
      } catch(error){job.status=controller.signal.aborted?"cancelled":"failed";job.error={code:error.code??"AX_ASSET_0001",message:error.message};}
      finally {this.activeJob=null;this.onAssetEvent?.(copy(job),context);}
    });
    return {job:copy(job)};
  }
  startScript(data,context) {
    if(this.activeScriptJob)fail("AX_SCRIPT_0001","A script compilation is already running");
    if(!data.path&&(typeof data.source!=="string"||Buffer.byteLength(data.source)>65536))fail("AX_SCRIPT_0001","C# source exceeds 64 KiB");
    if(!["development","aot"].includes(data.mode??"development"))fail("AX_SCRIPT_0001","Invalid compiler mode");
    if(!Array.isArray(data.attachments)||data.attachments.length>32||new Set(data.attachments).size!==data.attachments.length||data.attachments.some(id=>!this.project.scene.entities.some(e=>e.id===id)))fail("AX_SCRIPT_0001","Select up to 32 existing entities");
    const projectId=this.project.id,revision=this.revision,scene=copy(this.project.scene),controller=new AbortController();
    const job={id:randomUUID(),projectId,status:"queued",capability:"script.compile.csharp",traceId:context?.traceId??null};
    this.scriptJobs.set(job.id,job);if(this.scriptJobs.size>64)this.scriptJobs.delete(this.scriptJobs.keys().next().value);
    this.activeScriptJob={id:job.id,controller};
    setImmediate(async()=>{
      try {
        job.status="running";
    const {entries,selected:sourceFile}=compileSources(scene,data.path,data.source);scene.projectFiles=entries.map(({path,kind,text})=>({path,kind,text})).concat(projectFiles(scene).filter(f=>f.kind!=='script'));
    reconcileScriptComponents(scene);
    for(const entityId of scene.script?.attachments??[]){const entity=scene.entities.find(e=>e.id===entityId);if(entity&&!entity.scriptComponents?.length)setScriptComponent(scene,entityId,sourceFile.path,'attach');}
    for(const entityId of data.attachments){const e=scene.entities.find(e=>e.id===entityId);if(!e.scriptComponents?.some(c=>c.path===sourceFile.path))setScriptComponent(scene,entityId,sourceFile.path,'attach');}

        const build=await this.compiler.build(projectId,sourceFile.text,data.mode??"development",controller.signal,entries);
        if(controller.signal.aborted)fail("AX_SCRIPT_0001","Compilation cancelled");
        if(this.project?.id!==projectId||this.revision!==revision)fail("AX_SCENE_0002","Scene changed during compilation; retry");
        scene.script={source:sourceFile.text,entryPath:sourceFile.path,sources:entries.filter(f=>f.metadata).map(f=>({path:f.path,typeName:f.metadata.typeName})),attachments:[...new Set([...(scene.script?.attachments??[]),...scene.entities.filter(e=>e.scriptComponents?.length).map(e=>e.id)])],build};this.commitScene(scene);
        job.status="completed";job.build=build;job.sceneRevision=this.revision;
      }catch(error){job.status=controller.signal.aborted?"cancelled":"failed";job.error={code:error.code??"AX_SCRIPT_0001",message:error.message,diagnostics:error.diagnostics??[]};}
      finally{this.activeScriptJob=null;this.onScriptEvent?.(copy(job),context);}
    });
    return {job:copy(job)};
  }
  async run(type, data, context) {
    if (!data || typeof data !== "object" || Array.isArray(data)) fail("AX_PROJECT_0002", "Expected command data");
    if(["script.job.get","script.job.cancel"].includes(type)) {
      const job=this.scriptJobs.get(data.jobId);
      if(!this.project||data.id!==this.project.id||!job||job.projectId!==data.id)fail("AX_SCRIPT_0001","Script job is unavailable");
      if(type==="script.job.cancel"&&this.activeScriptJob?.id===job.id)this.activeScriptJob.controller.abort();
      return {job:copy(job)};
    }
    if(type==="script.compile") {this.check(data);return this.startScript(data,context);}
    if(this.activeScriptJob&&["project.create","project.open","project.close","project.save","scene.save"].includes(type))fail("AX_SCRIPT_0001","Wait for or cancel compilation first");
    if(["asset.job.get","asset.job.cancel","asset.explain"].includes(type)) {
      if(!this.project||data.id!==this.project.id)fail("AX_SCENE_0001","Open this project first");
      if(type==="asset.explain")return this.pipeline.explain(data.id,this.project.scene,data.assetId,[...this.jobs.values()].filter(j=>j.projectId===data.id));
      const job=this.jobs.get(data.jobId);if(!job||job.projectId!==data.id)fail("AX_ASSET_0001","Job is not available");
      if(type==="asset.job.cancel"&&this.activeJob?.id===job.id)this.activeJob.controller.abort();
      return {job:copy(job)};
    }
    if(type==='asset.audio.read') {
      this.check(data);const record=this.project.scene.assets?.find(a=>a.id===data.assetId);if(!record||record.kind!=='audio')fail('AX_ASSET_0001','Project audio asset required');
      const result=readPcm(await this.assets.readBytes(data.id,record.sourceId??record.id),data.offset,data.frames);this.check(data);return result;
    }
    if (type === "asset.get") {
      if(!this.project || data.id!==this.project.id || !this.project.scene.assets?.some(asset=>asset.id===data.assetId)) fail("AX_ASSET_0001","Asset is not part of this project");
      return {assetId:data.assetId, asset:await this.pipeline.resource(data.id,this.project.scene,data.assetId)};
    }
    if(this.activeJob && ["project.create","project.open","project.close","project.save","scene.save"].includes(type))fail("AX_ASSET_0001","Wait for or cancel the active asset job first");
    if (this.playing && !["scene.get", "play.stop", "project.list", "project.editor.update"].includes(type)) fail("AX_SCENE_0005", "Stop Play before editing or switching projects");
    if (type === "project.list") return this.store.run(type, data);
    if (["project.create", "project.open"].includes(type)) {
      if (this.dirty && (data.discardChanges !== true || data.expectedSceneRevision !== this.revision)) fail("AX_SCENE_0003", "Save or explicitly discard unsaved scene changes first");
      const result = await this.store.run(type, data);
      await this.pipeline.build(result.project.id,result.project.scene,result.project.scene.assets??[]);
      const snapshot=this.activate(result.project);
      if(type==='project.create'&&data.dimension){
        const mutate=(type,value)=>this.run(type,{id:this.project.id,expectedSceneRevision:this.revision,...value});
        if(data.dimension===3)await mutate('scene.primitive.create',{dimension:3,shape:'cube'});
        else {
          await mutate('scene.twoD.update',{value:{...structuredClone(twoDDefaults),ambient:[0.12,0.16,0.24]}});
          const png=new PNG({width:32,height:32});png.data.fill(255);
          await mutate('asset.import',{name:'Square.png',base64:PNG.sync.write(png).toString('base64')});
          await mutate('scene.asset.place',{assetId:this.project.scene.assets[0].id});
          const square=this.project.scene.entities[0];
          await mutate('scene.entity.update',{entityId:square.id,name:'Square',transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]}});
          await mutate('scene.sprite2D.set',{entityId:square.id,value:structuredClone(component2DDefaults.sprite2D)});
        }
        await mutate('scene.example.create',{example:'Camera'});
        await mutate('scene.example.create',{example:data.dimension===3?'Directional Light':'2D Light'});
        if(data.dimension===3){this.project.scene.rendering.environment=[0.12,0.16,0.24];this.project.scene.entities.find(e=>e.light).transform.rotation=cameraRotation([0,6,4],[0,0,0]);}
        await mutate('scene.save',{});this.past=[];this.future=[];return this.snapshot();
      }
      return snapshot;
    }
    if (type === "project.save") {
      if (this.dirty && data.id === this.project.id) fail("AX_SCENE_0003", "Use scene.save to save the active draft");
      const result = await this.store.run(type, data);
      return this.project?.id === data.id ? this.activate(result.project) : result;
    }
    if (type === "scene.get") return this.snapshot();
    if(type==='project.editor.update'){
      this.check(data);if(data.workspaceId)fail('AX_WORKSPACE_0001','Editor layout belongs to the main project');
      const result=await this.store.run('project.save',{id:this.project.id,expectedRevision:this.project.revision,scene:JSON.parse(this.savedScene),editor:data.value});
      this.project.editor=result.project.editor;this.project.revision=result.project.revision;return this.snapshot();
    }
    this.check(data);
    if(type==='project.files.reveal'){if(data.workspaceId)fail('AX_WORKSPACE_0001','Explorer export is only available for MAIN');try{return await revealProjectFiles(this,data.path??'',data.open===false?null:undefined);}catch(e){fail('AX_FS_0001',e.message);}}
    if(type==="asset.job.start")return this.startJob(data,context);
    if(type==="play.start" || type==="play.stop") {
      if(type==="play.start"){const scene=this.project.scene;if(scene.entities.some(e=>e.scriptComponents?.length)){const hash=createHash('sha256').update(JSON.stringify(projectFiles(scene).filter(f=>f.kind==='script').map(f=>[f.path,f.text]))).digest('hex');if(scene.script?.build.sourceHash!==hash)fail('AX_SCRIPT_0001','Compile the current Project scripts before Play');}await this.validateResources(scene);}
      this.playing=type==="play.start";
      this.revision++;
      return this.snapshot();
    }
    if(type==="project.close") {
      if(this.dirty && data.discardChanges!==true) fail("AX_SCENE_0003","Save or discard changes before closing");
      this.project=null;this.savedScene=null;this.past=[];this.future=[];this.revision++;
      return this.snapshot();
    }
    if (type === "scene.save") {
      const result = await this.store.run("project.save", { id: this.project.id, expectedRevision: this.project.revision, scene: this.project.scene });
      this.project = result.project;
      this.savedScene = JSON.stringify(this.project.scene);
      this.revision++;
      return this.snapshot();
    }
    if (type === "scene.undo" || type === "scene.redo") {
      const from = type === "scene.undo" ? this.past : this.future;
      const to = type === "scene.undo" ? this.future : this.past;
      if (!from.length) fail("AX_SCENE_0004", "No scene operation available to undo or redo");
      to.push(copy(this.project.scene));
      this.project.scene = from.pop();
      this.revision++;
      return this.snapshot();
    }
    const scene = copy(this.project.scene);
    const index = scene.entities.findIndex(entity => entity.id === data.entityId);
    if(type==='scene.script.edit'){setScriptComponent(scene,data.entityId,data.path,data.action,data.values);if(scene.script)scene.script.attachments=[...new Set([...scene.script.attachments.filter(id=>scene.entities.find(e=>e.id===id)?.scriptComponents?.length),...scene.entities.filter(e=>e.scriptComponents?.length).map(e=>e.id)])];
    }else if(type==="asset.import") {
      if((scene.assets?.length??0)>=128) fail("AX_ASSET_0001","Project asset limit is 128");
      const asset=await this.assets.put(this.project.id,data.name,data.base64,bytes=>importInWorker(bytes,undefined,data.settings));if(data.settings&&asset.kind==='mesh')asset.processing=meshSettings(data.settings);
      scene.assets??=[];
      if(!scene.assets.some(item=>item.id===asset.id)) scene.assets.push(asset);
    } else if(type==="scene.asset.place") {
      const asset=scene.assets?.find(item=>item.id===data.assetId);
      if(!asset) fail("AX_ASSET_0001","Import the asset before placing it");
      if(asset.kind==="audio")fail("AX_ASSET_0001","Audio sources cannot be placed as renderables");
      const resource=await this.pipeline.resource(this.project.id,scene,asset.id);
      const center=resource.bounds?resource.bounds.minimum.map((v,i)=>(v+resource.bounds.maximum[i])/2):[0,0,0];
      const size=resource.bounds?Math.max(...resource.bounds.maximum.map((v,i)=>v-resource.bounds.minimum[i])):2*Math.max(1,resource.width/resource.height);
      const scale=size>1e-6?2/size:1;
      scene.entities.push({id:`entity://${randomUUID()}`,name:asset.name,transform:{position:[(asset.kind==="sprite"?-1.5:1.5)-center[0]*scale,-center[1]*scale,-center[2]*scale],rotation:[0,0,0,1],scale:[scale,scale,scale]},renderable:{kind:asset.kind,assetId:asset.id}});
    } else if(type==='scene.component.paste'){
      if(index<0)fail('AX_SCENE_0001','Selected entity missing');
      const key={Transform:'transform',Renderable:'renderable',Camera:'camera',Material:'material',Light:'light',LOD:'lod',Collider:'collider',RigidBody:'rigidBody',Animator:'animator',AudioSource:'audioSource',AudioListener:'audioListener',Sprite2D:'sprite2D',SpriteAnimation:'spriteAnimation',Tilemap:'tilemap',Light2D:'light2D',Particles2D:'particles2D',UI2D:'ui2D'}[data.component];
      if(data.component==='Script'){if(!scene.script||data.value?.source!==scene.script.source)fail('AX_SCRIPT_0001','Compile the copied script in this project first');scene.script.attachments=[...new Set([...scene.script.attachments,data.entityId])];}
      else if(data.component==='Camera')activateCamera(scene,data.entityId,data.value);
      else if(key)scene.entities[index][key]=copy(data.value);else fail('AX_PROJECT_0002','Unsupported clipboard component');
    } else if(type==='scene.camera.set'){if(index<0)fail('AX_SCENE_0001','Camera entity no longer exists');activateCamera(scene,data.entityId,data.value);
    } else if(["scene.audioSource.set","scene.audioListener.set","scene.animator.set","scene.sprite2D.set","scene.spriteAnimation.set","scene.tilemap.set","scene.light2D.set","scene.particles2D.set","scene.ui2D.set","scene.collider.set","scene.rigidBody.set","scene.material.set","scene.light.set","scene.lod.set"].includes(type)) {
      if(index<0)fail("AX_SCENE_0001","Entity no longer exists");
      scene.entities[index][type.split(".")[1]]=copy(data.value);
    } else if(type==="scene.entity.reparent") {
      if(!Array.isArray(data.entityIds)||data.entityIds.length>1024||new Set(data.entityIds).size!==data.entityIds.length)fail("AX_SCENE_0001","Invalid hierarchy selection");
      scene.entities=orderEntities(scene.entities,data.entityIds,data.parentId??null,data.beforeId);
    } else if(type==='scene.entities.update') {
      scene.entities=updateTransforms(scene.entities,data.updates,data.space??'local');
    } else if(type==='scene.entities.delete') {
      const removed=new Set(selectedRoots(scene.entities,data.entityIds));let changed=true;while(changed){changed=false;for(const e of scene.entities)if(removed.has(e.parentId)&&!removed.has(e.id)){removed.add(e.id);changed=true;}}
      scene.entities=scene.entities.filter(e=>!removed.has(e.id));if(scene.script)scene.script.attachments=scene.script.attachments.filter(id=>!removed.has(id));
    } else if(type==="scene.primitive.create") {
      const sprite=scene.twoD&&data.dimension===2,bytes=sprite?primitiveSprite(data.shape):primitiveGlb(data.dimension,data.shape),asset=await this.assets.put(this.project.id,`${data.dimension}D-${data.shape}.${sprite?'png':'glb'}`,bytes.toString('base64'),importInWorker);
      scene.assets??=[];if(!scene.assets.some(a=>a.id===asset.id)){if(scene.assets.length>=128)fail("AX_ASSET_0001","Project asset limit is 128");scene.assets.push(asset);}
      scene.entities.push({id:`entity://${randomUUID()}`,name:`${data.dimension}D ${data.shape}`,transform:{position:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]},renderable:{kind:sprite?'sprite':'mesh',assetId:asset.id},...(sprite?{sprite2D:structuredClone(component2DDefaults.sprite2D)}:{})});
      await this.pipeline.build(this.project.id,scene,this.project.scene.assets??[]);
    } else if(type==="scene.component.remove" && ["Camera","AudioSource","AudioListener","Animator","Sprite2D","SpriteAnimation","Tilemap","Light2D","Particles2D","UI2D","Collider","RigidBody","Material","Light","LOD"].includes(data.component)) {
      if(index<0)fail("AX_SCENE_0001","Entity no longer exists");
      delete scene.entities[index][({Camera:"camera",AudioSource:"audioSource",AudioListener:"audioListener",Animator:"animator",Sprite2D:"sprite2D",SpriteAnimation:"spriteAnimation",Tilemap:"tilemap",Light2D:"light2D",Particles2D:"particles2D",UI2D:"ui2D",Collider:"collider",RigidBody:"rigidBody",Material:"material",Light:"light",LOD:"lod"})[data.component]];
      if(data.component==="Sprite2D")delete scene.entities[index].spriteAnimation;
      if(data.component==="Collider")delete scene.entities[index].rigidBody;
    } else if(type==="scene.component.add" || type==="scene.component.remove") {
      if(index<0)fail("AX_SCENE_0001","Entity no longer exists");
      if(data.component==='Script'){
        if(!scene.script)fail("AX_SCRIPT_0001","Compile a script first");
        scene.script.attachments=type==='scene.component.remove'?scene.script.attachments.filter(id=>id!==data.entityId):[...new Set([...scene.script.attachments,data.entityId])];
      } else {
      if(data.component!=="Renderable")fail("AX_PROJECT_0002","Only the optional Renderable component is supported");
      if(type==="scene.component.remove"){delete scene.entities[index].animator;delete scene.entities[index].renderable;delete scene.entities[index].lod;delete scene.entities[index].sprite2D;delete scene.entities[index].spriteAnimation;}
      else {
        if(scene.entities[index].renderable)fail("AX_PROJECT_0002","Renderable already exists");
        const asset=scene.assets?.find(a=>a.id===data.value?.assetId);
        if(!asset||asset.kind!==data.value.kind||asset.kind==="audio")fail("AX_ASSET_0001","Component requires an imported sprite or mesh");
        scene.entities[index].renderable=copy(data.value);
      }
      }
    } else if(type==='scene.audio.update') {
      scene.audio=copy(data.value);
    } else if(type==='scene.twoD.update') {
      scene.twoD=copy(data.value);if(scene.cameraMode!=='entities')scene.camera={position:[0,0,10],target:[0,0,0],fov:60,orthoHeight:6,...scene.camera,projection:'orthographic'};
    } else if(type==="scene.rendering.update") {
      scene.rendering=copy(data.value);
    } else if(type==="scene.camera.update") {
      if(!data.camera||typeof data.camera!=="object"||Array.isArray(data.camera))fail("AX_PROJECT_0002","Camera update must be an object");
      if(scene.cameraMode==='entities'){const e=scene.entities.find(e=>e.camera?.active);if(!e)fail('AX_SCENE_0001','No active Camera entity');for(const key of ['projection','fov','orthoHeight'])if(data.camera[key]!==undefined)e.camera[key]=data.camera[key];if(data.camera.position)e.transform.position=copy(data.camera.position);if(data.camera.target)e.transform.rotation=cameraRotation(e.transform.position,data.camera.target);}else scene.camera={projection:'perspective',position:[0,0,6],target:[0,0,0],orthoHeight:6,fov:60,...scene.camera,...data.camera};
    } else if(type==='project.files.edit'){
      try{scene.projectFiles=editProjectFiles(scene,data);reconcileScriptComponents(scene);}catch(error){fail('AX_FS_0001',error.message);}
    } else if(type==='scene.entities.paste'){
      if(!Array.isArray(data.entities)||!data.entities.length||data.entities.length>256)fail('AX_SCENE_0001','Copy up to 256 entities');
      const ids=new Map(data.entities.map(e=>[e.id,'entity://'+randomUUID()]));if(ids.size!==data.entities.length)fail('AX_SCENE_0001','Duplicate clipboard entity IDs');
      for(const source of data.entities){const e=copy(source);e.id=ids.get(source.id);e.name=source.name+' Copy';if(ids.has(source.parentId))e.parentId=ids.get(source.parentId);else if(data.parentId)e.parentId=data.parentId;else delete e.parentId;if(e.camera)e.camera.active=false;if(e.audioListener)e.audioListener.enabled=false;scene.entities.push(e);}
      if(scene.script)for(const old of data.scriptAttachments??[])if(ids.has(old))scene.script.attachments.push(ids.get(old));
    } else if(type==="scene.example.create") {
      try{addExample(scene,data.example,`entity://${randomUUID()}`);}catch(e){fail("AX_PROJECT_0002",e.message);}
    } else if (type === "scene.entity.create") {
      scene.entities.push({ id: `entity://${randomUUID()}`, name: data.name ?? "Entity", transform: { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: [1, 1, 1] } });
    } else if (["scene.entity.update", "scene.entity.delete"].includes(type)) {
      if (index < 0) fail("AX_SCENE_0001", "Entity no longer exists");
      if (type === "scene.entity.delete") {const removed=new Set([data.entityId]);let changed=true;while(changed){changed=false;for(const e of scene.entities)if(removed.has(e.parentId)&&!removed.has(e.id)){removed.add(e.id);changed=true;}}scene.entities=scene.entities.filter(e=>!removed.has(e.id));if(scene.script)scene.script.attachments=scene.script.attachments.filter(id=>!removed.has(id));}
      else {
        if (data.name !== undefined) scene.entities[index].name = data.name;
        if (data.transform !== undefined) {
          if (!data.transform || typeof data.transform !== "object" || Array.isArray(data.transform)) fail("AX_PROJECT_0002", "Transform must be an object");
          scene.entities[index].transform = { ...scene.entities[index].transform, ...data.transform };
        }
      }
    } else fail("AX_COMMAND_0002", "Command type is not registered");
    if(data.parentId&&['scene.entity.create','scene.example.create','scene.primitive.create'].includes(type)){if(!scene.entities.some(e=>e.id===data.parentId))fail('AX_SCENE_0001','Parent entity missing');scene.entities.at(-1).parentId=data.parentId;}
    if(type==="asset.import")await this.pipeline.build(this.project.id,scene,this.project.scene.assets??[]);
    syncImportedFiles(scene,this.project.scene);
    validateProject({ ...this.project, scene });
    if(["scene.component.paste","scene.audioSource.set","scene.animator.set","scene.sprite2D.set","scene.tilemap.set","scene.asset.place","scene.component.add","scene.lod.set","scene.primitive.create"].includes(type))await this.validateResources(scene);
    if (Buffer.byteLength(JSON.stringify({ ...this.project, scene }, null, 2) + "\n") > 192 * 1024) fail("AX_PROJECT_0002", "Project size exceeds limit");
    this.check(data);
    this.commitScene(scene);
    return this.snapshot();
  }
}
