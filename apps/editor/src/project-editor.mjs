import {mountAudioEditor} from './audio-editor.mjs';
import {mountTwoDEditor} from './two-d-editor.mjs';
import {hierarchyRows,rangeSelection} from '../../../engine/scene/editor-operations.mjs';
import {mountPanelLayout} from './panel-layout.mjs';
import {localTransform} from '../../../engine/scene/hierarchy.mjs';
import {quaternionFromEuler,eulerFromQuaternion} from './view-math.mjs';
import {mountAnimationEditor} from './animation-editor.mjs';
import {materialDefaults,renderingDefaults} from '../../../engine/renderer/render-plan.mjs';
export function mountProjectEditor({ document, send, reportError, confirmDiscard = () => confirm("Discard unsaved scene changes?"), onDirty = () => {}, onState = async () => {}, onSelection=()=>{},onView=()=>{},getRenderer=()=>null, defaultScript = "" }) {
  const $ = id => document.querySelector(`#${id}`);
  const supported = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo", "asset.import", "asset.get", "scene.asset.place", "scene.camera.update", "play.start", "play.stop", "project.close"];
  let enabled = false, pipelineEnabled=false, currentJob=null;
  let scriptEnabled=false,currentScriptJob=null,scriptProject=null,scriptBuild=null;
  let busy = false;
  let state = { project: null, dirty: false, sceneRevision: 0, canUndo: false, canRedo: false };
  let selected = null, selection=new Set(), collapsed=new Set(),scriptDraft=new Set();
  let view='scene',anchor=null,folderPath='Project',fileSelected=null,foldersCollapsed=false;
  const panels=mountPanelLayout({document,onView:name=>{view=name;onView(name);},save:value=>act(()=>run('project.editor.update',mutation({value}))),isBusy:()=>busy||!state.project||!!state.workspaceId});
  function draw(updateFields = true) {
    $("editor-workspace").setAttribute("aria-busy",String(busy));
    const project = state.project;panels.set(project?.editor);
    const entity = selection.size===1?project?.scene.entities.find(item => item.id === selected):null;
    const attached=project?.scene.script?.attachments.includes(entity?.id);
    if($('selection-status')){
      $('selection-status').textContent=selection.size>1?`${selection.size} entities selected · transform editing enabled`:entity?.name??'Select an entity';
      for(const [id,visible]of [['material',!!entity?.material],['light',!!entity?.light],['lod',!!entity?.lod],['physics',!!entity?.collider],['rigidbody',!!entity?.rigidBody],['renderable',!!entity?.renderable],['script',!!entity&&(attached||scriptDraft.has(entity.id))]])$(id+'-component').hidden=!visible;
      $('component-add').disabled=!enabled||busy||state.playing||!entity;
      $('renderable-status').textContent=entity?.renderable?`${entity.renderable.kind} · ${project.scene.assets?.find(a=>a.id===entity.renderable.assetId)?.name??''}`:'';
      $('physics-freeze').checked=entity?.rigidBody?.freezeRotation??false;
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
    $("scene-delete").disabled = !editing || !selection.size;
    $("entity-fields").disabled = !editing || !selection.size;
    $("entity-name").disabled=selection.size!==1;
    for(const key of ['material','light','lod','render'])$(key+'-fields').disabled=!editing||!(key==='render'?project:entity);
    $("physics-fields").disabled = !editing || !entity;
    if($("rigidbody-fields"))$("rigidbody-fields").disabled=!editing||!entity;
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
    if(!$("editor-workspace").classList.contains?.("docked")){
      $("scene-tab").className=view==='scene'?"active":"";
      $("game-tab").className=view==='game'?"active":"";
    }
    $("play-status").textContent=state.playing?"Play · runtime copy":"Stopped · authoring";
    $("preview-note").textContent=project ? `${project.name} · ${view==='game'?'Game camera':'Scene camera'}` : "Create or open a project to begin";
    $("entities").replaceChildren();
    const entities=project?.scene.entities??[];
    function drop(node,parentId,beforeId){node.addEventListener('dragover',event=>{if(!event.dataTransfer.types.includes('application/axiom-entities'))return;event.preventDefault();event.stopPropagation();node.classList.add('drag-target');});node.addEventListener('dragleave',()=>node.classList.remove('drag-target'));node.addEventListener('drop',event=>{if(!event.dataTransfer.types.includes('application/axiom-entities'))return;event.preventDefault();event.stopPropagation();node.classList.remove('drag-target');try{const ids=JSON.parse(event.dataTransfer.getData('application/axiom-entities'));void act(()=>run('scene.entity.reparent',mutation({entityIds:ids,...(parentId?{parentId}:{}),...(beforeId?{beforeId}:{})})));}catch(error){reportError(error);}});}
    const root=document.createElement('div');root.className='tree-row scene-root';root.setAttribute('role','treeitem');root.setAttribute('aria-expanded',String(!collapsed.has('root')));const rootToggle=document.createElement('button');rootToggle.className='tree-toggle';rootToggle.textContent=collapsed.has('root')?'▸':'▾';rootToggle.setAttribute('aria-label','Expand or collapse Scene root');rootToggle.addEventListener('click',()=>{if(collapsed.has('root'))collapsed.delete('root');else collapsed.add('root');draw(false);});root.append(rootToggle);const rootButton=document.createElement('button');rootButton.className='scene-root-button';rootButton.textContent='Scene root';rootButton.addEventListener('click',()=>select(null));root.append(rootButton);drop(root,null);$('entities').append(root);
    function branch(parentId=null,depth=1){const siblings=entities.filter(e=>(e.parentId??null)===parentId);for(const item of siblings){
      const gap=document.createElement('div');gap.className='tree-gap';gap.dataset.beforeId=item.id;gap.dataset.parentId=parentId??'';gap.setAttribute('aria-label','Insert before '+item.name);drop(gap,parentId,item.id);$('entities').append(gap);
      const row=document.createElement('div');row.className='tree-row';row.style.paddingLeft=(depth*12)+'px';row.setAttribute('role','treeitem');row.setAttribute('aria-selected',String(selection.has(item.id)));row.dataset.entityId=item.id;
      const children=entities.some(e=>e.parentId===item.id),toggle=document.createElement('button');toggle.className='tree-toggle';toggle.textContent=collapsed.has(item.id)?'▸':'▾';toggle.disabled=!children;toggle.setAttribute('aria-label','Expand or collapse '+item.name);if(children)row.setAttribute('aria-expanded',String(!collapsed.has(item.id)));toggle.addEventListener('click',()=>{if(collapsed.has(item.id))collapsed.delete(item.id);else collapsed.add(item.id);draw(false);});
      const button=document.createElement('button');button.textContent=item.name;button.className=selection.has(item.id)?'entity selected':'entity';button.setAttribute('aria-pressed',String(selection.has(item.id)));button.disabled=busy;button.draggable=!busy&&!state.playing;button.addEventListener('click',event=>select(item.id,{toggle:event.ctrlKey||event.metaKey,range:event.shiftKey}));
      button.addEventListener('dragstart',event=>{if(!selection.has(item.id)){selection=new Set([item.id]);selected=item.id;anchor=item.id;}event.dataTransfer.setData('application/axiom-entities',JSON.stringify([...selection]));});drop(row,item.id);
      row.append(toggle,button);$('entities').append(row);if(children&&!collapsed.has(item.id))branch(item.id,depth+1);
    }const end=document.createElement('div');end.className='tree-gap';end.dataset.parentId=parentId??'';end.setAttribute('aria-label','Append to '+(parentId??'Scene root'));drop(end,parentId);$('entities').append(end);}if(!collapsed.has('root'))branch();
    if($('project-files')){
      $('project-files').replaceChildren();if($('project-icons'))$('project-icons').replaceChildren();
      const folders=['Project','Scenes','Assets','Scripts'];
      for(const name of folders.filter(name=>name==='Project'||!foldersCollapsed)){const button=document.createElement('button');button.className=name===folderPath?'selected':'';button.textContent=(name==='Project'?(foldersCollapsed?'▸ ':'▾ '):'  ▰ ')+name;button.setAttribute('role','treeitem');button.setAttribute('aria-level',name==='Project'?'1':'2');if(name==='Project')button.setAttribute('aria-expanded',String(!foldersCollapsed));button.addEventListener('click',()=>{if(name==='Project')foldersCollapsed=!foldersCollapsed;folderPath=name;fileSelected=null;$('project-file-preview').hidden=true;draw(false);});$('project-files').append(button);}
      if($('project-breadcrumb'))$('project-breadcrumb').textContent=folderPath==='Project'?'Project':'Project / '+folderPath;
      const files=folderPath==='Project'?folders.slice(1).map(name=>({id:name,name,folder:true})):!project?[]:folderPath==='Scenes'?[{id:project.id,name:project.name+'.json',value:project.scene}]:folderPath==='Scripts'?(project.scene.script?[{id:'script',name:'Game.cs',value:project.scene.script.source}]:[]):(project.scene.assets??[]).map(a=>({id:a.id,name:a.name,value:a,kind:a.kind}));
      for(const file of files){const button=document.createElement('button');button.className='project-file'+(fileSelected===file.id?' selected':'');button.setAttribute('role','listitem');button.title=file.name;const icon=document.createElement('span');icon.className='file-symbol';icon.textContent=file.folder?'▰':file.kind==='mesh'?'⬡':file.kind==='sprite'?'▧':file.kind==='audio'?'♫':file.id==='script'?'#':'▤';const label=document.createElement('span');label.className='file-name';label.textContent=file.name;button.append(icon,label);button.addEventListener('click',()=>{if(file.folder){folderPath=file.name;fileSelected=null;}else{fileSelected=file.id;if(file.kind)$('asset-list').value=file.id;$('project-file-preview').textContent=typeof file.value==='string'?file.value:JSON.stringify(file.value,null,2);$('project-file-preview').hidden=false;}draw(false);});($('project-icons')??$('project-files')).append(button);}
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
    for(const [id,key,defaultValue]of [["physics-friction","friction",.5],["physics-restitution","restitution",0],["physics-gravity","gravityScale",1]])if($(id))$(id).value=String(entity?.rigidBody?.[key]??defaultValue);
    $("physics-layer").value=String(entity?.collider?.layer??1);
    $("physics-mask").value=String(entity?.collider?.mask??4294967295);
    for (const group of ["position", "scale"]) for (let i = 0; i < 3; i++) $(`${group}-${i}`).value = String(entity?.transform[group][i] ?? (group === "scale" ? 1 : 0));
    if(selection.size>1){const chosen=entities.filter(e=>selection.has(e.id));for(const group of ['position','rotation','scale'])for(let i=0;i<3;i++){const values=chosen.map(e=>group==='rotation'?eulerFromQuaternion(e.transform.rotation)[i]:e.transform[group][i]);const field=$(group+'-'+i);field.value=values.every(v=>Math.abs(v-values[0])<1e-8)?String(values[0]):'';field.placeholder='Mixed';field.required=false;}}else for(const group of ['position','rotation','scale'])for(let i=0;i<3;i++)$(group+'-'+i).required=true;
    }
    if(state.workspaceId){for(const id of ["project-new","project-open","project-close","scene-save"])$(id).disabled=true;$("preview-note").textContent="Isolated AI proposal · "+(state.playing?"running":"editing");}
    twoDEditor.draw();animationEditor.draw();audioEditor.draw();
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
    if(type!=="project.editor.update"&&"project" in event.payload.data) await onState({...event.payload.data,commandLineage:{messageId:event.causationId,correlationId:event.correlationId,traceId:event.traceId}});
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
  const audioEditor=mountAudioEditor({document,act,run,mutation,getState:()=>state,getSelection:()=>selection.size===1?selected:null,getRenderer});
  const animationEditor=mountAnimationEditor({document,act,run,mutation,getState:()=>state,getSelection:()=>selection.size===1?selected:null,getRenderer});
  const twoDEditor=mountTwoDEditor({document,act,run,mutation,getState:()=>state,getSelection:()=>selection.size===1?selected:null});
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
  $("play-start").addEventListener("click",()=>act(async()=>{await run("play.start",mutation());view='game';panels.activateView('game');}));
  $("play-stop").addEventListener("click",()=>act(()=>run("play.stop",mutation())));
  for(const name of ['scene','game'])$(name+'-tab').addEventListener('click',()=>{view=name;panels.activateView(name);draw(false);});
  $("project-list").addEventListener("change", draw);
  $("project-refresh").addEventListener("click", () => act(list));
  $("workspace-refresh").addEventListener("click", () => act(async () => {await run("scene.get");if($("file-menu"))$("file-menu").open=false;if($("settings-menu"))$("settings-menu").open=false;}));
  $("scene-add").addEventListener("click", () => act(() => run("scene.entity.create", mutation({ name: "Entity" }))));
  $("scene-delete").addEventListener("click",deleteSelected);
  for (const action of ["save", "undo", "redo"]) $("scene-" + action).addEventListener("click", () => act(() => run("scene." + action, mutation())));
  $("physics-form").addEventListener("submit",event=>{event.preventDefault();const shape=$("physics-shape").value;return act(()=>shape==='none'?run('scene.component.remove',mutation({entityId:selected,component:'Collider'})):run('scene.collider.set',mutation({entityId:selected,value:{shape,dimension:Number($("physics-dimension").value),halfExtents:[0,1,2].map(i=>Number($("physics-half-"+i).value)),trigger:$("physics-trigger").checked,layer:Number($("physics-layer").value),mask:Number($("physics-mask").value)}})));});
  $('rigidbody-form')?.addEventListener('submit',event=>{event.preventDefault();return act(()=>{if($('physics-motion').value==='static')return run('scene.component.remove',mutation({entityId:selected,component:'RigidBody'}));const old=state.project.scene.entities.find(e=>e.id===selected).rigidBody;return run('scene.rigidBody.set',mutation({entityId:selected,value:{...old,mass:Number($('physics-mass').value),friction:Number($('physics-friction').value),restitution:Number($('physics-restitution').value),gravityScale:Number($('physics-gravity').value),freezeRotation:$('physics-freeze').checked}}));});});
  $("entity-form").addEventListener("submit", event => {
    event.preventDefault();const updates=state.project.scene.entities.filter(e=>selection.has(e.id)).map(e=>{const t=structuredClone(e.transform);const rotation=eulerFromQuaternion(t.rotation);for(const group of ['position','rotation','scale'])for(let i=0;i<3;i++){const raw=$(group+'-'+i).value.trim();if(raw!==''){const value=Number(raw);if(!Number.isFinite(value))throw Error('Transform values must be finite');if(group==='rotation')rotation[i]=value;else t[group][i]=value;}}t.rotation=quaternionFromEuler(rotation);return {entityId:e.id,transform:t};});
    return act(()=>updates.length===1?run('scene.entity.update',mutation({...updates[0],name:$('entity-name').value})):run('scene.entities.update',mutation({updates,space:'local'})));
  });
  function select(id,options=false){if(busy)return;const o=typeof options==='boolean'?{toggle:options}:options;const valid=state.project?.scene.entities.some(e=>e.id===id);if(o.range&&valid){selection=new Set(rangeSelection(hierarchyRows(state.project.scene.entities,collapsed),anchor,id));}else{if(!o.toggle)selection.clear();if(valid){if(o.toggle&&selection.has(id))selection.delete(id);else selection.add(id);}anchor=id;}selected=selection.has(id)?id:[...selection].at(-1)??null;draw();}
  function deleteSelected(){if(!selection.size||state.playing||busy)return;return act(()=>run('scene.entities.delete',mutation({entityIds:[...selection]})));}
  if($('component-add')){
    $('component-add').addEventListener('click',()=>act(async()=>{const component=$('component-choice').value,entity=state.project.scene.entities.find(e=>e.id===selected);if(selection.size!==1)throw Error('Select one entity');
      if(await audioEditor.add(component,entity))return;
      if(await animationEditor.add(component,entity))return;
      if(await twoDEditor.add(component,entity))return;
      if(component==='Script'){if(state.project.scene.script)await run('scene.component.add',mutation({entityId:selected,component}));else scriptDraft.add(selected);$('script-component').open=true;return;}
      const key={Material:'material',Light:'light',LOD:'lod',Collider:'collider',RigidBody:'rigidBody',Renderable:'renderable'}[component];if(entity[key])throw Error(component+' is already attached');
      if(component==='Renderable'){const asset=state.project.scene.assets?.find(a=>a.id===$('asset-list').value&&a.kind!=='audio');if(!asset)throw Error('Select an imported drawable in Project first');await run('scene.component.add',mutation({entityId:selected,component,value:{assetId:asset.id,kind:asset.kind}}));return;}
      const values={Material:{...materialDefaults},Light:{kind:'point',color:[1,1,1],intensity:20,range:10,direction:[0,0,-1],innerAngle:15,outerAngle:30,shadow:false},Collider:{dimension:3,shape:'box',halfExtents:[.5,.5,.5],trigger:false,layer:1,mask:4294967295},RigidBody:{mass:1,velocity:[0,0,0],angularVelocity:[0,0,0],freezeRotation:false,restitution:0,friction:.5,gravityScale:1},LOD:{levels:[{assetId:entity.renderable?.assetId,distance:10}]}};
      if(component==='RigidBody'&&!entity.collider)throw Error('Add a Collider first');if(component==='LOD'&&entity.renderable?.kind!=='mesh')throw Error('LOD requires a mesh Renderable');await run('scene.'+key+'.set',mutation({entityId:selected,value:values[component]}));const detail=$((({Collider:'physics',RigidBody:'rigidbody'})[component]??key)+'-component');if(detail)detail.open=true;
    }));
    for(const [id,component]of [['renderable','Renderable'],['collider','Collider'],['rigidbody','RigidBody'],['script','Script']])$(id+'-remove').addEventListener('click',()=>act(async()=>{if(component==='Script'&&!state.project.scene.script){scriptDraft.delete(selected);return;}await run('scene.component.remove',mutation({entityId:selected,component}));scriptDraft.delete(selected);}));
    for(const button of document.querySelectorAll?.('.create-primitive')??[])button.addEventListener('click',()=>act(()=>run('scene.primitive.create',mutation({dimension:Number(button.dataset.dimension),shape:button.dataset.shape}))));
    $('component-search')?.addEventListener('input',()=>{const query=$('component-search').value.trim().toLowerCase();const choice=$('component-choice'),names=['Renderable','Material','Light','LOD','Collider','RigidBody','Script','Animator',...audioEditor.names,...twoDEditor.names].filter(name=>name.toLowerCase().startsWith(query));choice.replaceChildren();for(const name of names){const option=document.createElement('option');option.textContent=option.value=name;choice.append(option);}$('component-add').disabled=!names.length||selection.size!==1||busy||state.playing;});
    for(const detail of document.querySelectorAll?.('.menubar details')??[]){detail.addEventListener('toggle',()=>{if(!detail.open)return;const popup=detail.querySelector(':scope > .submenu');if(!popup?.getBoundingClientRect)return;popup.style.left='100%';popup.style.right='auto';if(popup.getBoundingClientRect().right>globalThis.innerWidth){popup.style.left='auto';popup.style.right='100%';}});detail.querySelector('summary')?.addEventListener('click',()=>{for(const sibling of detail.parentElement.children)if(sibling!==detail&&sibling.tagName==='DETAILS')sibling.open=false;});}
    globalThis.addEventListener?.('keydown',event=>{if(/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??'')||event.target?.isContentEditable)return;
      if(event.code==='Escape')for(const detail of document.querySelectorAll?.('.menubar details')??[])detail.open=false;
      if(event.code==='Delete'){event.preventDefault();void deleteSelected();}
      if((event.ctrlKey||event.metaKey)&&['KeyZ','KeyY'].includes(event.code)){event.preventDefault();if(!state.playing&&!busy&&enabled){const redo=event.code==='KeyY'||event.shiftKey;if(redo?state.canRedo:state.canUndo)void act(()=>run(redo?'scene.redo':'scene.undo',mutation()));}}
    });
  }
  draw();
  return {
    isBusy:()=>busy,
    selectedEntity:()=>selected,
    selectedEntities:()=>[...selection],
    selectEntity(id,options=false){select(id,options);},
    transformEntities(updates){return act(()=>run("scene.entities.update",mutation({updates,space:"world"})));},
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
