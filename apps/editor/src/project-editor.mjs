import {localTransform} from '../../../engine/scene/hierarchy.mjs';
import {quaternionFromEuler,eulerFromQuaternion} from './view-math.mjs';
import {materialDefaults,renderingDefaults} from '../../../engine/renderer/render-plan.mjs';
export function mountProjectEditor({ document, send, reportError, confirmDiscard = () => confirm("Discard unsaved scene changes?"), onDirty = () => {}, onState = async () => {}, onSelection=()=>{},onView=()=>{}, defaultScript = "" }) {
  const $ = id => document.querySelector(`#${id}`);
  const supported = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo", "asset.import", "asset.get", "scene.asset.place", "scene.camera.update", "play.start", "play.stop", "project.close"];
  let enabled = false, pipelineEnabled=false, currentJob=null;
  let scriptEnabled=false,currentScriptJob=null,scriptProject=null,scriptBuild=null;
  let busy = false;
  let state = { project: null, dirty: false, sceneRevision: 0, canUndo: false, canRedo: false };
  let selected = null, selection=new Set(), collapsed=new Set(),scriptDraft=new Set();
  let view='scene';
  function draw(updateFields = true) {
    $("editor-workspace").setAttribute("aria-busy",String(busy));
    const project = state.project;
    const entity = selection.size===1?project?.scene.entities.find(item => item.id === selected):null;
    const attached=project?.scene.script?.attachments.includes(entity?.id);
    if($('selection-status')){
      $('selection-status').textContent=selection.size>1?`${selection.size} entities selected · property editing disabled`:entity?.name??'Select an entity';
      for(const [id,visible]of [['material',!!entity?.material],['light',!!entity?.light],['lod',!!entity?.lod],['physics',!!entity?.collider],['renderable',!!entity?.renderable],['script',!!entity&&(attached||scriptDraft.has(entity.id))]])$(id+'-component').hidden=!visible;
      $('component-add').disabled=!enabled||busy||state.playing||!entity;
      $('renderable-status').textContent=entity?.renderable?`${entity.renderable.kind} · ${project.scene.assets?.find(a=>a.id===entity.renderable.assetId)?.name??''}`:'';
      $('physics-freeze').checked=entity?.rigidBody?.freezeRotation??false;
      for(const id of ['physics-motion','physics-mass','physics-freeze'])if($(id).closest)$(id).closest('label').hidden=!entity?.rigidBody;
      $('rigidbody-remove').hidden=!entity?.rigidBody;
    }
    const editing=enabled&&!busy&&!state.playing;
    $("script-source").disabled=!scriptEnabled||!project||!entity||busy;
    $("script-mode").disabled=!scriptEnabled||!project||!entity||busy;
    $("script-compile").disabled=!scriptEnabled||!project||!entity||busy;
    $("script-cancel").disabled=!currentScriptJob;
    if(project?.id!==scriptProject||project?.scene.script?.build.id!==scriptBuild) {
      $("script-source").value=project?.scene.script?.source??defaultScript;scriptProject=project?.id;scriptBuild=project?.scene.script?.build.id;
    }
    $("project-status").textContent = project ? `${project.name} · ${state.dirty ? "Unsaved changes" : "Saved"} · revision ${project.revision}` : enabled ? "Create or open a project" : "Project editing is unavailable on this daemon";
    $("project-new").disabled = !editing;
    $("project-open").disabled = !editing || !$("project-list").value;
    $("project-refresh").disabled = !enabled || busy;
    $("workspace-refresh").disabled = !enabled || busy;
    $("scene-add").disabled = !editing || !project;
    $("scene-save").disabled = !editing || !project || !state.dirty;
    $("scene-undo").disabled = !editing || !state.canUndo;
    $("scene-redo").disabled = !editing || !state.canRedo;
    $("scene-delete").disabled = !editing || !entity;
    $("entity-fields").disabled = !editing || !entity;
    for(const key of ['material','light','lod','render'])$(key+'-fields').disabled=!editing||!(key==='render'?project:entity);
    $("physics-fields").disabled = !editing || !entity;
    $("project-close").disabled=!editing||!project;
    const chosen=project?.scene.assets?.find(a=>a.id===$("asset-list").value);
    $("asset-replace").disabled=!editing||!pipelineEnabled||!chosen;
    $("asset-bind").disabled=!editing||!pipelineEnabled||chosen?.kind!=="mesh";
    $("asset-explain").disabled=!enabled||busy||!pipelineEnabled||!chosen;
    $("asset-cancel").disabled=!currentJob;
    $("asset-file").disabled=!editing||!project;
    $("asset-import").disabled=!editing||!project;
    $("asset-place").disabled=!editing||!project||!$("asset-list").value;
    $("camera-projection").disabled=!editing||!project;
    $("play-start").disabled=!editing||!project;
    $("play-stop").disabled=busy||!state.playing;
    $("scene-tab").disabled=busy||!project;
    $("game-tab").disabled=busy||!project;
    $("scene-tab").className=view==='scene'?"active":"";
    $("game-tab").className=view==='game'?"active":"";
    $("play-status").textContent=state.playing?"Play · runtime copy":"Stopped · authoring";
    $("preview-note").textContent=project ? `${project.name} · ${view==='game'?'Game camera':'Scene camera'}` : "Create or open a project to begin";
    $("entities").replaceChildren();
    const entities=project?.scene.entities??[];
    function branch(parentId=null,depth=0){for(const item of entities.filter(e=>(e.parentId??null)===parentId)){
      const row=document.createElement('div');row.className='tree-row';row.style.paddingLeft=(depth*14)+'px';row.setAttribute('role','treeitem');row.setAttribute('aria-selected',String(selection.has(item.id)));row.dataset.entityId=item.id;
      const children=entities.some(e=>e.parentId===item.id),toggle=document.createElement('button');toggle.className='tree-toggle';toggle.textContent=collapsed.has(item.id)?'▸':'▾';toggle.disabled=!children;toggle.setAttribute('aria-label','Expand or collapse '+item.name);if(children)row.setAttribute('aria-expanded',String(!collapsed.has(item.id)));toggle.addEventListener('click',()=>{if(collapsed.has(item.id))collapsed.delete(item.id);else collapsed.add(item.id);draw(false);});
      const button=document.createElement('button');button.textContent=item.name;button.className=selection.has(item.id)?'entity selected':'entity';button.setAttribute('aria-pressed',String(selection.has(item.id)));button.disabled=busy;button.draggable=!busy&&!state.playing;button.addEventListener('click',event=>select(item.id,event.altKey||event.ctrlKey||event.metaKey));
      button.addEventListener('dragstart',event=>{if(!selection.has(item.id)){selection=new Set([item.id]);selected=item.id;}event.dataTransfer.setData('application/axiom-entities',JSON.stringify([...selection]));});row.addEventListener('dragover',event=>{event.preventDefault();row.classList.add('drag-target');});row.addEventListener('dragleave',()=>row.classList.remove('drag-target'));row.addEventListener('drop',event=>{event.preventDefault();row.classList.remove('drag-target');try{const ids=JSON.parse(event.dataTransfer.getData('application/axiom-entities'));void act(()=>run('scene.entity.reparent',mutation({entityIds:ids,parentId:item.id})));}catch(error){reportError(error);}});
      row.append(toggle,button);$('entities').append(row);if(children&&!collapsed.has(item.id))branch(item.id,depth+1);
    }}branch();
    if($('entity-parent')){const previous=$('entity-parent').value;$('entity-parent').replaceChildren();for(const item of [{id:'',name:'Scene root'},...entities.filter(e=>!selection.has(e.id))]){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;$('entity-parent').append(option);}$('entity-parent').value=previous;$('entity-reparent').disabled=$('entity-unparent').disabled=!editing||!selection.size;}
    if($('project-files')){
      $('project-files').replaceChildren();
      const folder=(name)=>{const d=document.createElement('details');d.open=true;const label=document.createElement('summary');label.textContent=name;d.append(label);$('project-files').append(d);return d;};
      const scenes=folder('Scenes'),assets=folder('Assets'),scripts=folder('Scripts');
      const file=(parent,name,action)=>{const button=document.createElement('button');button.textContent=name;button.addEventListener('click',action);parent.append(button);};
      if(project){file(scenes,project.name+' · '+project.id.slice(10)+'.json',()=>{$('project-file-preview').textContent=JSON.stringify(project.scene,null,2);});for(const asset of project.scene.assets??[])file(assets,asset.name,()=>{$('asset-list').value=asset.id;$('project-file-preview').textContent=JSON.stringify(asset,null,2);draw(false);});if(project.scene.script)file(scripts,'Game.cs',()=>{$('project-file-preview').textContent=project.scene.script.source;});}
    }
    $("entity-empty").hidden = !!project?.scene.entities.length;
    if (updateFields) {
    const assetSelection=$("asset-list").value;
    $("asset-list").replaceChildren();
    for(const asset of project?.scene.assets??[]) {const option=document.createElement("option");option.value=asset.id;option.textContent=`${asset.kind} · ${asset.name}`;$("asset-list").append(option);}
    if(project?.scene.assets?.some(asset=>asset.id===assetSelection))$("asset-list").value=assetSelection;
    $("asset-place").disabled=!editing||!project||!$("asset-list").value;
    const textureSelection=$("asset-texture").value;
    $("asset-texture").replaceChildren();
    for(const asset of project?.scene.assets??[])if(asset.kind==="sprite"){const option=document.createElement("option");option.value=asset.id;option.textContent=asset.name;$("asset-texture").append(option);}
    if(project?.scene.assets?.some(a=>a.id===textureSelection))$("asset-texture").value=textureSelection;
    $("camera-projection").value=project?.scene.camera?.projection??"perspective";
    $("entity-name").value = entity?.name ?? "";
    if($("rotation-0"))eulerFromQuaternion(entity?.transform.rotation??[0,0,0,1]).forEach((v,i)=>$("rotation-"+i).value=String(v));
    const m={...materialDefaults,...entity?.material},l=entity?.light??{kind:'point',color:[1,1,1],intensity:20,range:10,direction:[0,-1,0],innerAngle:15,outerAngle:30,shadow:false},r={...renderingDefaults,...project?.scene.rendering};
    const putVector=(id,value)=>value.forEach((v,i)=>{$(id+'-'+i).value=String(v);});
    putVector('material-color',m.baseColor);putVector('material-emissive',m.emissive);for(const [id,value]of [['material-metallic',m.metallic],['material-roughness',m.roughness],['material-alpha',m.alphaMode],['material-cutoff',m.alphaCutoff],['light-kind',l.kind],['light-intensity',l.intensity],['light-range',l.range],['light-inner',l.innerAngle],['light-outer',l.outerAngle],['render-tier',r.tier],['render-culling',r.culling],['render-exposure',r.exposure],['render-tone',r.toneMapping],['render-shadow-size',r.shadowSize],['render-bloom',r.bloom]])$(id).value=String(value);
    putVector('light-color',l.color);putVector('light-direction',l.direction);putVector('render-environment',r.environment);
    for(const [id,value]of [['material-unlit',m.unlit],['material-shadow',m.castShadow],['light-shadow',l.shadow],['render-shadows',r.shadows],['render-fxaa',r.fxaa]])$(id).checked=value;
    for(let i=0;i<3;i++){const select=$('lod-asset-'+i);select.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='None';select.append(none);for(const a of project?.scene.assets??[])if(a.kind==='mesh'){const o=document.createElement('option');o.value=a.id;o.textContent=a.name;select.append(o);}select.value=entity?.lod?.levels[i]?.assetId??'';$('lod-distance-'+i).value=String(entity?.lod?.levels[i]?.distance??(i+1)*10);}
    $('render-remove').disabled=true;

    $("physics-shape").value=entity?.collider?.shape??"none";
    $("physics-dimension").value=String(entity?.collider?.dimension??2);
    $("physics-motion").value=entity?.rigidBody?"dynamic":"static";
    $("physics-trigger").checked=entity?.collider?.trigger??false;
    for(let i=0;i<3;i++)$("physics-half-"+i).value=String(entity?.collider?.halfExtents[i]??0.5);
    $("physics-mass").value=String(entity?.rigidBody?.mass??1);
    $("physics-layer").value=String(entity?.collider?.layer??1);
    $("physics-mask").value=String(entity?.collider?.mask??4294967295);
    for (const group of ["position", "scale"]) for (let i = 0; i < 3; i++) $(`${group}-${i}`).value = String(entity?.transform[group][i] ?? (group === "scale" ? 1 : 0));
    }
    if(state.workspaceId){for(const id of ["project-new","project-open","project-close","scene-save"])$(id).disabled=true;$("preview-note").textContent="Isolated AI proposal · "+(state.playing?"running":"editing");}
    onDirty(state.dirty&&!state.workspaceId);
    onSelection([...selection]);onView(view);
  }
  function adopt(data) {
    if (!("project" in data)) return;
    const oldIds = new Set(state.project?.scene.entities.map(entity => entity.id));
    state = data;
    if (!state.project?.scene.entities.some(entity => entity.id === selected)) selected = state.project?.scene.entities[0]?.id ?? null;
    const added = state.project?.scene.entities.find(entity => !oldIds.has(entity.id));
    if (added) {selected = added.id;selection=new Set([selected]);}
    else {selection=new Set([...selection].filter(id=>state.project?.scene.entities.some(e=>e.id===id)));if(!selection.size&&selected)selection.add(selected);selected=[...selection].at(-1)??null;}
  }
  async function act(operation) {
    if (!enabled || busy) return;
    busy = true;
    $("project-error").textContent = "";
    draw(false);
    let succeeded = false;
    try { await operation(); succeeded = true; }
    catch (error) { $("project-error").textContent = error.message; reportError(error); }
    finally { busy = false; draw(succeeded); }
    return succeeded;
  }
  async function run(type, data = {}) {
    const event = await send(type, data);
    adopt(event.payload.data);
    if(['project.create','project.open','project.close','scene.asset.place','scene.primitive.create','scene.camera.update','scene.save','scene.undo','scene.redo','scene.rendering.update','asset.import','asset.job.start'].includes(type)){if($('file-menu'))$('file-menu').open=false;if($('settings-menu'))$('settings-menu').open=false;}
    if("project" in event.payload.data) await onState({...event.payload.data,commandLineage:{messageId:event.causationId,correlationId:event.correlationId,traceId:event.traceId}});
    return event.payload.data;
  }
  async function list() {
    const { projects } = await run("project.list");
    const previous = $("project-list").value;
    $("project-list").replaceChildren();
    for (const project of projects) {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      $("project-list").append(option);
    }
    if (projects.some(project => project.id === previous)) $("project-list").value = previous;
  }
  const mutation = extra => ({ id: state.project?.id, expectedSceneRevision: state.sceneRevision, ...extra });
  const number=id=>Number($(id).value),vector=(id,n)=>Array.from({length:n},(_,i)=>number(id+'-'+i));
  for(const key of ['material','light','lod','render']){
    $(key+'-form').addEventListener('submit',event=>{event.preventDefault();return act(async()=>{
      let value;
      if(key==='material')value={baseColor:vector('material-color',4),metallic:number('material-metallic'),roughness:number('material-roughness'),emissive:vector('material-emissive',3),alphaMode:$('material-alpha').value,alphaCutoff:number('material-cutoff'),unlit:$('material-unlit').checked,castShadow:$('material-shadow').checked};
      if(key==='light')value={kind:$('light-kind').value,color:vector('light-color',3),intensity:number('light-intensity'),range:number('light-range'),direction:vector('light-direction',3),innerAngle:number('light-inner'),outerAngle:number('light-outer'),shadow:$('light-shadow').checked};
      if(key==='lod')value={levels:Array.from({length:3},(_,i)=>({assetId:$('lod-asset-'+i).value,distance:number('lod-distance-'+i)})).filter(l=>l.assetId)};
      if(key==='render')value={tier:$('render-tier').value,culling:$('render-culling').value,exposure:number('render-exposure'),toneMapping:$('render-tone').value,environment:vector('render-environment',3),shadows:$('render-shadows').checked,shadowSize:number('render-shadow-size'),bloom:number('render-bloom'),fxaa:$('render-fxaa').checked};
      await run(key==='render'?'scene.rendering.update':'scene.'+key+'.set',mutation({...(key==='render'?{}:{entityId:selected}),value}));
    });});
    if(key!=='render')$(key+'-remove').addEventListener('click',()=>act(()=>run('scene.component.remove',mutation({entityId:selected,component:({material:'Material',light:'Light',lod:'LOD'})[key]}))));
  }
  async function switchProject(type, data) {
    if (state.dirty && !confirmDiscard()) return;
    await run(type, { ...data, discardChanges: state.dirty, expectedSceneRevision: state.sceneRevision });
    await list();
  }
  $("script-compile").addEventListener("click",()=>act(async()=>{
    const source=$("script-source").value,mode=$("script-mode").value;
    $("script-diagnostics").textContent="";
    currentScriptJob=(await run("script.compile",mutation({source,mode,attachments:[selected]}))).job;draw(false);
    try {
      while(["queued","running"].includes(currentScriptJob.status)) {
        $("script-status").textContent=`Compilation ${currentScriptJob.status}…`;
        await new Promise(resolve=>setTimeout(resolve,250));
        currentScriptJob=(await run("script.job.get",{id:state.project.id,jobId:currentScriptJob.id})).job;
      }
      $("script-status").textContent=`Compilation ${currentScriptJob.status}`;
      if(currentScriptJob.status!=="completed") {
        $("script-diagnostics").textContent=(currentScriptJob.error?.diagnostics??[]).map(d=>`${d.file}:${d.line}:${d.column} ${d.code}: ${d.message}`).join("\n");
        throw new Error(currentScriptJob.error?.message??"Compilation did not complete");
      }
      await run("scene.get");
    }finally{currentScriptJob=null;}
  }));
  $("script-cancel").addEventListener("click",async()=>{try{if(currentScriptJob)await send("script.job.cancel",{id:state.project.id,jobId:currentScriptJob.id});}catch(error){reportError(error);}});
  $("project-new").addEventListener("click", () => {
    const name = $("project-name").value.trim();
    if (!name) { $("project-error").textContent = "Enter a project name."; return; }
    return act(() => switchProject("project.create", { name }));
  });
  $("project-open").addEventListener("click", () => act(() => switchProject("project.open", { id: $("project-list").value })));
  $("asset-list").addEventListener("change",draw);
  async function sourceFile() {
    const file=$("asset-file").files?.[0];
    if(!file)throw new Error("Choose a PNG, GLB or PCM WAV source first.");
    if(file.size>8*1024*1024)throw new Error("The file exceeds 8 MiB.");
    const bytes=new Uint8Array(await file.arrayBuffer());let raw="";
    for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return {name:file.name,base64:btoa(raw)};
  }
  async function assetJob(data) {
    const receipt=await run("asset.job.start",mutation(data));currentJob=receipt.job;
    draw(false);
    try {
      while(["queued","running"].includes(currentJob.status)) {
        $("asset-job-status").textContent=`Import ${currentJob.status}…`;
        await new Promise(resolve=>setTimeout(resolve,100));
        currentJob=(await run("asset.job.get",{id:state.project.id,jobId:currentJob.id})).job;
      }
      $("asset-job-status").textContent=`Import ${currentJob.status}`;
      if(currentJob.status!=="completed")throw new Error(currentJob.error?.message??"Import did not complete");
      await run("scene.get");$("asset-file").value="";
    } finally {currentJob=null;}
  }
  $("asset-import").addEventListener("click",()=>act(async()=>{const data=await sourceFile();if(pipelineEnabled)await assetJob({operation:"import",...data});else await run("asset.import",mutation(data));}));
  $("asset-replace").addEventListener("click",()=>act(async()=>assetJob({operation:"replace",assetId:$("asset-list").value,...await sourceFile()})));
  $("asset-bind").addEventListener("click",()=>act(()=>assetJob({operation:"bindTexture",assetId:$("asset-list").value,textureId:$("asset-texture").value})));
  $("asset-explain").addEventListener("click",()=>act(async()=>{$("asset-explanation").textContent=JSON.stringify(await run("asset.explain",{id:state.project.id,assetId:$("asset-list").value}),null,2);}));
  $("asset-cancel").addEventListener("click",async()=>{try{if(currentJob)await send("asset.job.cancel",{id:state.project.id,jobId:currentJob.id});}catch(error){reportError(error);}});
  $("asset-place").addEventListener("click",()=>act(()=>run("scene.asset.place",mutation({assetId:$("asset-list").value}))));
  $("camera-projection").addEventListener("change",()=>{const projection=$("camera-projection").value;return act(()=>run("scene.camera.update",mutation({camera:{projection}})));});
  $("project-close").addEventListener("click",()=>act(async()=>{if(state.dirty&&!confirmDiscard())return;await run("project.close",mutation({discardChanges:state.dirty}));}));
  $("play-start").addEventListener("click",()=>act(async()=>{await run("play.start",mutation());view='game';}));
  $("play-stop").addEventListener("click",()=>act(()=>run("play.stop",mutation())));
  for(const name of ['scene','game'])$(name+'-tab').addEventListener('click',()=>{view=name;draw(false);});
  $("project-list").addEventListener("change", draw);
  $("project-refresh").addEventListener("click", () => act(list));
  $("workspace-refresh").addEventListener("click", () => act(async () => {await run("scene.get");if($("file-menu"))$("file-menu").open=false;if($("settings-menu"))$("settings-menu").open=false;}));
  $("scene-add").addEventListener("click", () => act(() => run("scene.entity.create", mutation({ name: "Entity" }))));
  $("scene-delete").addEventListener("click", () => act(() => run("scene.entity.delete", mutation({ entityId: selected }))));
  for (const action of ["save", "undo", "redo"]) $("scene-" + action).addEventListener("click", () => act(() => run("scene." + action, mutation())));
  $("physics-form").addEventListener("submit",event=>{event.preventDefault();const shape=$("physics-shape").value;const collider={shape,dimension:Number($("physics-dimension").value),halfExtents:[0,1,2].map(i=>Number($("physics-half-"+i).value)),trigger:$("physics-trigger").checked,layer:Number($("physics-layer").value),mask:Number($("physics-mask").value)};const dynamic=$("physics-motion").value==="dynamic",mass=Number($("physics-mass").value);return act(async()=>{
    const old=state.project.scene.entities.find(e=>e.id===selected)?.rigidBody;
    if(shape==="none"){await run("scene.component.remove",mutation({entityId:selected,component:"Collider"}));return;}
    await run("scene.collider.set",mutation({entityId:selected,value:collider}));
    if(dynamic)await run("scene.rigidBody.set",mutation({entityId:selected,value:{velocity:[0,0,0],restitution:0,friction:0.5,gravityScale:1,...old,mass,freezeRotation:$("physics-freeze")?.checked??false}}));
    else if(old)await run("scene.component.remove",mutation({entityId:selected,component:"RigidBody"}));
  });});
  $("entity-form").addEventListener("submit", event => {
    event.preventDefault();
    const transform = {};
    if($("rotation-0"))transform.rotation=quaternionFromEuler([0,1,2].map(i=>Number($("rotation-"+i).value)));
    for (const group of ["position", "scale"]) transform[group] = [0, 1, 2].map(i => {
      const value = $(`${group}-${i}`).value.trim();
      return value === "" ? NaN : Number(value);
    });
    if (Object.values(transform).flat().some(value => !Number.isFinite(value))) { $("project-error").textContent = "Transform values must be finite numbers."; return; }
    const data = mutation({ entityId: selected, name: $("entity-name").value, transform });
    return act(() => run("scene.entity.update", data));
  });
  function select(id,toggle=false){if(busy)return;const valid=state.project?.scene.entities.some(e=>e.id===id);if(!toggle)selection.clear();if(valid){if(toggle&&selection.has(id))selection.delete(id);else selection.add(id);}selected=[...selection].at(-1)??null;draw();}
  if($('component-add')){
    $('component-add').addEventListener('click',()=>act(async()=>{const component=$('component-choice').value,entity=state.project.scene.entities.find(e=>e.id===selected);if(selection.size!==1)throw Error('Select one entity');
      if(component==='Script'){if(state.project.scene.script)await run('scene.component.add',mutation({entityId:selected,component}));else scriptDraft.add(selected);$('script-component').open=true;return;}
      const key={Material:'material',Light:'light',LOD:'lod',Collider:'collider',RigidBody:'rigidBody',Renderable:'renderable'}[component];if(entity[key])throw Error(component+' is already attached');
      if(component==='Renderable'){const asset=state.project.scene.assets?.find(a=>a.id===$('asset-list').value&&a.kind!=='audio');if(!asset)throw Error('Select an imported drawable in Project first');await run('scene.component.add',mutation({entityId:selected,component,value:{assetId:asset.id,kind:asset.kind}}));return;}
      const values={Material:{...materialDefaults},Light:{kind:'point',color:[1,1,1],intensity:20,range:10,direction:[0,0,-1],innerAngle:15,outerAngle:30,shadow:false},Collider:{dimension:3,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295},RigidBody:{mass:1,velocity:[0,0,0],angularVelocity:[0,0,0],freezeRotation:false,restitution:0,friction:.5,gravityScale:1},LOD:{levels:[{assetId:entity.renderable?.assetId,distance:10}]}};
      if(component==='RigidBody'&&!entity.collider)throw Error('Add a Collider first');if(component==='LOD'&&entity.renderable?.kind!=='mesh')throw Error('LOD requires a mesh Renderable');await run('scene.'+key+'.set',mutation({entityId:selected,value:values[component]}));const detail=$((({Collider:'physics',RigidBody:'physics'})[component]??key)+'-component');if(detail)detail.open=true;
    }));
    for(const [id,component]of [['renderable','Renderable'],['collider','Collider'],['rigidbody','RigidBody'],['script','Script']])$(id+'-remove').addEventListener('click',()=>act(async()=>{if(component==='Script'&&!state.project.scene.script){scriptDraft.delete(selected);return;}await run('scene.component.remove',mutation({entityId:selected,component}));scriptDraft.delete(selected);}));
    $('entity-reparent').addEventListener('click',()=>act(()=>run('scene.entity.reparent',mutation({entityIds:[...selection],parentId:$('entity-parent').value||null}))));$('entity-unparent').addEventListener('click',()=>act(()=>run('scene.entity.reparent',mutation({entityIds:[...selection],parentId:null}))));
    for(const button of document.querySelectorAll?.('.create-primitive')??[])button.addEventListener('click',()=>act(()=>run('scene.primitive.create',mutation({dimension:Number(button.dataset.dimension),shape:button.dataset.shape}))));
    globalThis.addEventListener?.('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.code==='KeyZ'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??'')){event.preventDefault();if(!state.playing&&!busy&&enabled){const redo=event.shiftKey;if(redo?state.canRedo:state.canUndo)void act(()=>run(redo?'scene.redo':'scene.undo',mutation()));}}});
  }
  draw();
  return {
    isBusy:()=>busy,
    selectedEntity:()=>selected,
    selectedEntities:()=>[...selection],
    selectEntity(id,toggle=false){select(id,toggle);},
    transformEntity(entityId,transform){return act(()=>run('scene.entity.update',mutation({entityId,transform:localTransform(state.project.scene.entities,entityId,transform)})));},
    async synchronize(snapshot){if(!enabled||busy||(snapshot.workspaceId??null)===(state.workspaceId??null)&&snapshot.sceneRevision===state.sceneRevision)return false;return act(async()=>{adopt(snapshot);await onState(snapshot);});},
    setDefaultSource(source){defaultScript=source;if(!state.project?.scene.script)$("script-source").value=source;},
    async refreshAssets() {if(!enabled||busy)return false;return act(()=>run("scene.get"));},
    async connect(capabilities) {
      scriptEnabled=["script.compile","script.job.get","script.job.cancel"].every(c=>capabilities.includes(`command.${c}`));
      pipelineEnabled=["asset.job.start","asset.job.get","asset.job.cancel","asset.explain"].every(c=>capabilities.includes(`command.${c}`));
      enabled = supported.every(command => capabilities.includes(`command.${command}`));
      draw();
      if (enabled) await act(async () => { await list(); await run("scene.get"); });
    }
  };
}
