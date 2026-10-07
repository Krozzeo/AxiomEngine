import {mountCodeEditor} from './code-editor.mjs';
import {mountProjectBrowser} from './project-browser.mjs';
import {mountEditorActions} from './editor-actions.mjs';
import {cameraDefaults} from '../../../engine/scene/camera.mjs';
import {mountAudioEditor} from './audio-editor.mjs';
import {mountTwoDEditor} from './two-d-editor.mjs';
import {hierarchyRows,rangeSelection} from '../../../engine/scene/editor-operations.mjs';
import {mountPanelLayout} from './panel-layout.mjs';
import {localTransform} from '../../../engine/scene/hierarchy.mjs';
import {quaternionFromEuler,eulerFromQuaternion} from './view-math.mjs';
import {mountAnimationEditor} from './animation-editor.mjs';
import {materialDefaults,renderingDefaults} from '../../../engine/renderer/render-plan.mjs';
export function mountProjectEditor({ document, send, reportError, confirmDiscard = () => confirm("Discard unsaved scene changes?"), onDirty = () => {}, onState = async () => {}, onSelection=()=>{},onView=()=>{},onLocate=()=>{},getRenderer=()=>null, defaultScript = "" }) {
  const $ = id => document.querySelector(`#${id}`);
  const supported = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo", "asset.import", "asset.get", "scene.asset.place", "scene.camera.update", "play.start", "play.stop", "project.close"];
  let enabled = false, pipelineEnabled=false, currentJob=null;
  let scriptEnabled=false,currentScriptJob=null,scriptProject=null,scriptBuild=null;
  let busy = false;
  let state = { project: null, dirty: false, sceneRevision: 0, canUndo: false, canRedo: false };
  let filePaths=[],ideDirty=false;
  let selected = null, selection=new Set(), collapsed=new Set(),scriptDraft=new Set();
  let hierarchyScrolling=false,hierarchyPaint=null;
  let view='scene',anchor=null,folderPath='Project',fileSelected=null,foldersCollapsed=false;
  const panels=mountPanelLayout({document,onParallel:value=>getRenderer()?.setParallelViewport?.(value),onView:name=>{view=name;onView(name);},save:value=>act(()=>run('project.editor.update',mutation({value}))),isBusy:()=>busy||!state.project||!!state.workspaceId});
  function draw(updateFields = true) {
    $("editor-workspace").setAttribute("aria-busy",String(busy));
    const project = state.project;if(!busy)panels.set(project?.editor);
    const entity = selection.size===1?project?.scene.entities.find(item => item.id === selected):null;
    const file=browser.files().find(f=>filePaths.length===1&&f.path===filePaths[0]);
    if($('file-inspector')){$('file-inspector').hidden=!file;$('file-inspector-name').textContent=file?file.path.split('/').at(-1):'';$('file-inspector-path').textContent=file?.path??'';$('file-inspector-kind').textContent=file?.kind??'';$('file-inspector-open').hidden=file?.kind!=='script';}
    if($('entity-form'))$('entity-form').hidden=!!file;
    const attached=project?.scene.script?.attachments.includes(entity?.id);
    if($('selection-status')){
      $('selection-status').textContent=selection.size>1?`${selection.size} entities selected · transform editing enabled`:file?file.path.split('/').at(-1):entity?.name??'Select an entity';
      for(const [id,visible]of [['camera',!!entity?.camera],['material',!!entity?.material],['light',!!entity?.light],['lod',!!entity?.lod],['physics',!!entity?.collider],['rigidbody',!!entity?.rigidBody],['renderable',!!entity?.renderable],['script',!!entity&&(attached||scriptDraft.has(entity.id))]])$(id+'-component').hidden=!visible;
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
    $("camera-fields").disabled=!editing||!entity?.camera;
    $("play-start").disabled=!editing||!project;
    $("play-stop").disabled=busy||!state.playing;
    $("scene-tab").disabled=busy||!project;
    $("game-tab").disabled=busy||!project;
    if(!$("editor-workspace").classList?.contains?.("docked")){
      $("scene-tab").className=view==='scene'?"active":"";
      $("game-tab").className=view==='game'?"active":"";
    }
    $("play-status").textContent=state.playing?"Play · runtime copy":"Stopped · authoring";
    $("preview-note").textContent=project ? `${view==='game'?'Game camera':'Scene camera'}` : "Create or open a project to begin";
    let hierarchyScrollTop=$("entities").scrollTop??0;
    $("entities").replaceChildren();
    const entities=project?.scene.entities??[];
    const childrenByParent=new Map();for(const e of entities){const p=e.parentId??null;if(!childrenByParent.has(p))childrenByParent.set(p,[]);childrenByParent.get(p).push(e);}
    function drop(node,parentId,beforeId){node.addEventListener('dragover',event=>{if(!event.dataTransfer.types.includes('application/axiom-entities'))return;event.preventDefault();event.stopPropagation();node.classList.add('drag-target');});node.addEventListener('dragleave',()=>node.classList.remove('drag-target'));node.addEventListener('drop',event=>{if(!event.dataTransfer.types.includes('application/axiom-entities'))return;event.preventDefault();event.stopPropagation();node.classList.remove('drag-target');try{const ids=JSON.parse(event.dataTransfer.getData('application/axiom-entities'));void act(()=>run('scene.entity.reparent',mutation({entityIds:ids,...(parentId?{parentId}:{}),...(beforeId?{beforeId}:{})})));}catch(error){reportError(error);}});}
    const root=document.createElement('div');root.className='tree-row scene-root';root.setAttribute('role','treeitem');root.setAttribute('aria-expanded',String(!collapsed.has('root')));const rootToggle=document.createElement('button');rootToggle.className='tree-toggle';rootToggle.textContent=collapsed.has('root')?'▸':'▾';rootToggle.setAttribute('aria-label','Expand or collapse Scene root');rootToggle.addEventListener('click',()=>{if(collapsed.has('root'))collapsed.delete('root');else collapsed.add('root');draw(false);});root.append(rootToggle);const rootButton=document.createElement('button');rootButton.className='scene-root-button';rootButton.textContent='Scene root';rootButton.addEventListener('click',()=>select(null));root.append(rootButton);drop(root,null);$('entities').append(root);
    const rows=collapsed.has('root')?[]:hierarchyRows(entities,collapsed),virtual=document.defaultView&&rows.length>150;
    const viewportHeight=Math.max(120,($('entities').parentElement?.clientHeight??650)-145),rowHeight=28;
    $('entities').style.maxHeight=virtual?viewportHeight+'px':'';$('entities').style.overflowY=virtual?'auto':'';
    if(virtual&&!hierarchyScrolling&&selected){const index=rows.findIndex(r=>r.entity.id===selected);const top=hierarchyScrollTop;if(index>=0&&(index*rowHeight<top||(index+1)*rowHeight>top+viewportHeight))hierarchyScrollTop=Math.max(0,index*rowHeight-viewportHeight/2);}
    const start=virtual?Math.max(0,Math.min(rows.length-1,Math.floor(hierarchyScrollTop/rowHeight)-6)):0,end=virtual?Math.min(rows.length,start+Math.ceil(viewportHeight/rowHeight)+12):rows.length;
    const spacer=height=>{const n=document.createElement('div');n.style.height=height+'px';n.setAttribute('aria-hidden','true');$('entities').append(n);};if(start)spacer(start*rowHeight);
    for(const {entity:item,depth} of rows.slice(start,end)){
      const parentId=item.parentId??null,gap=document.createElement('div');gap.className='tree-gap';gap.dataset.beforeId=item.id;gap.dataset.parentId=parentId??'';gap.setAttribute('aria-label','Insert before '+item.name);drop(gap,parentId,item.id);$('entities').append(gap);
      const row=document.createElement('div');row.className='tree-row';row.style.paddingLeft=((depth+1)*12)+'px';row.setAttribute('role','treeitem');row.setAttribute('aria-selected',String(selection.has(item.id)));row.dataset.entityId=item.id;
      const children=childrenByParent.has(item.id),toggle=document.createElement('button');toggle.className='tree-toggle';toggle.textContent=collapsed.has(item.id)?'▸':'▾';toggle.disabled=!children;toggle.setAttribute('aria-label','Expand or collapse '+item.name);if(children)row.setAttribute('aria-expanded',String(!collapsed.has(item.id)));toggle.addEventListener('click',()=>{if(collapsed.has(item.id))collapsed.delete(item.id);else collapsed.add(item.id);draw(false);});
      const button=document.createElement('button');button.textContent=item.name;button.className=selection.has(item.id)?'entity selected':'entity';button.setAttribute('aria-pressed',String(selection.has(item.id)));button.disabled=busy;button.draggable=!busy&&!state.playing;button.addEventListener('click',event=>select(item.id,{toggle:event.ctrlKey||event.metaKey,range:event.shiftKey}));row.addEventListener('click',event=>{if(event.target.closest('.entity,.tree-toggle,input'))return;select(item.id,{toggle:event.ctrlKey||event.metaKey,range:event.shiftKey});});
      button.addEventListener('dragstart',event=>{if(!selection.has(item.id)){selection=new Set([item.id]);selected=item.id;anchor=item.id;}event.dataTransfer.setData('application/axiom-entities',JSON.stringify([...selection]));});drop(row,item.id);row.append(toggle,button);$('entities').append(row);
    }
    if(end<rows.length)spacer((rows.length-end)*rowHeight);const endGap=document.createElement('div');endGap.className='tree-gap';endGap.setAttribute('aria-label','Append to Scene root');drop(endGap,null);$('entities').append(endGap);if(virtual)$('entities').scrollTop=hierarchyScrollTop;
    browser.draw();
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
    $("camera-projection").value=entity?.camera?.projection??"perspective";$("camera-active").checked=entity?.camera?.active??false;$("camera-fov").value=String(entity?.camera?.fov??60);$("camera-ortho").value=String(entity?.camera?.orthoHeight??6);
    $("entity-name").value = entity?.name ?? "";
    if($("rotation-0"))eulerFromQuaternion(entity?.transform.rotation??[0,0,0,1]).forEach((v,i)=>$("rotation-"+i).value=String(v));
    const m={...materialDefaults,...entity?.material},l=entity?.light??{kind:'point',color:[1,1,1],intensity:20,range:10,direction:[0,-1,0],innerAngle:15,outerAngle:30,shadow:false},r={...renderingDefaults,...project?.scene.rendering};
    const putVector=(id,value)=>value.forEach((v,i)=>{$(id+'-'+i).value=String(v);});
    putVector('material-color',m.baseColor);putVector('material-emissive',m.emissive);for(const [id,value]of [['material-metallic',m.metallic],['material-roughness',m.roughness],['material-alpha',m.alphaMode],['material-cutoff',m.alphaCutoff],['light-kind',l.kind],['light-intensity',l.intensity],['light-range',l.range],['light-inner',l.innerAngle],['light-outer',l.outerAngle],['render-scale',r.renderScale??1],['render-tier',r.tier],['render-culling',r.culling],['render-exposure',r.exposure],['render-tone',r.toneMapping],['render-shadow-size',r.shadowSize],['render-bloom',r.bloom]])$(id).value=String(value);
    putVector('light-color',l.color);putVector('light-direction',l.direction);putVector('render-environment',r.environment);
    for(const [id,value]of [['material-unlit',m.unlit],['material-shadow',m.castShadow],['light-shadow',l.shadow],['render-shadows',r.shadows],['render-fxaa',r.fxaa]])$(id).checked=value;
    for(let i=0;i<3;i++){const select=$('lod-asset-'+i);select.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='None';select.append(none);for(const a of project?.scene.assets??[])if(a.kind==='mesh'){const o=document.createElement('option');o.value=a.id;o.textContent=a.name;select.append(o);}select.value=entity?.lod?.levels[i]?.assetId??'';$('lod-distance-'+i).value=String(entity?.lod?.levels[i]?.distance??(i+1)*10);}
    $('render-remove').disabled=true;if($('ambient-fields')){$('ambient-fields').disabled=!editing||!project;(project?.scene.twoD?.ambient??r.environment).forEach((v,i)=>$('ambient-'+i).value=String(v));}

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
    if($("toolbar-save")){
      $("toolbar-save").disabled=$("scene-save").disabled;
      $("toolbar-save").title=state.dirty?"Save project · Unsaved changes · Ctrl+S":"Save project · Ctrl+S";
      $("toolbar-save").setAttribute("aria-label",state.dirty?"Save project (unsaved changes)":"Save project");
    }
    if($("save-dirty"))$("save-dirty").hidden=!state.dirty;
    twoDEditor.draw();animationEditor.draw();audioEditor.draw();actions.draw();
    ide.draw();
    $("scene-save").textContent=state.dirty?"Save*":"Save";$("scene-save").classList?.toggle?.("dirty-save",state.dirty);
    paintDirty();
    onSelection([...selection]);onView(view);
  }
  function adopt(data) {
    if (!("project" in data)) return;
    const oldIds = new Set(state.project?.scene.entities.map(entity => entity.id));
    state = data;
    if (!state.project?.scene.entities.some(entity => entity.id === selected)) selected = null;
    const added = state.project?.scene.entities.find(entity => !oldIds.has(entity.id));
    if (added) {filePaths=[];browser.clear(false);selected = added.id;selection=new Set([selected]);}
    else {selection=new Set([...selection].filter(id=>state.project?.scene.entities.some(e=>e.id===id)));selected=[...selection].at(-1)??null;}
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
    if(['project.create','project.open','project.close','scene.asset.place','scene.primitive.create','scene.example.create','scene.camera.update','scene.save','scene.undo','scene.redo','scene.rendering.update','asset.import','asset.job.start'].includes(type)){if($('file-menu'))$('file-menu').open=false;if($('settings-menu'))$('settings-menu').open=false;}
    if(type==='scene.example.create'||type==='scene.primitive.create'||type==='scene.entity.create'){for(const id of ['create-menu','file-menu'])if($(id))$(id).open=false;}
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
  function fileSelection(paths){filePaths=paths;selected=null;selection.clear();draw();}
  function paintDirty(){const pending=state.dirty||ideDirty;if($('project-title')){$('project-title').textContent=state.project?(state.project.name+(pending?'*':'')):'';$('project-title').classList?.toggle?.('dirty-title',pending);}if($('scene-save')){$('scene-save').textContent=pending?'Save*':'Save';$('scene-save').classList?.toggle?.('dirty-save',pending);$('scene-save').disabled=!state.project||state.playing||busy||!pending;}if($('toolbar-save'))$('toolbar-save').disabled=$('scene-save').disabled;if($('save-dirty'))$('save-dirty').hidden=!pending;onDirty(pending&&!state.workspaceId);}
  const ide=mountCodeEditor({document,getState:()=>state,write:data=>act(()=>run('project.files.edit',mutation(data))),show:panels.openPanel,onOpen:file=>{$('script-source').value=file.text;},onDirty:value=>{ideDirty=value;paintDirty();},reportError});
  const browser=mountProjectBrowser({document,getState:()=>state,mutate:data=>act(()=>run('project.files.edit',mutation(data))),selectAsset:id=>{$('asset-list').value=id;},selectScript:file=>void ide.open(file),onSelection:fileSelection,beforeEdit:()=>ide.flush(),onFilesChanged:data=>{ide.filesChanged(data);filePaths=browser.selection();},reportError});
  $('file-inspector-open')?.addEventListener('click',()=>browser.open(filePaths[0]));
  const actions=mountEditorActions({document,getState:()=>state,getSelection:()=>[...selection],select,act,run,mutation,browser,reportError,locate:onLocate});
  const number=id=>Number($(id).value),vector=(id,n)=>Array.from({length:n},(_,i)=>number(id+'-'+i));
  for(const key of ['material','light','lod','render']){
    $(key+'-form').addEventListener('submit',event=>{event.preventDefault();return act(async()=>{
      let value;
      if(key==='material')value={baseColor:vector('material-color',4),metallic:number('material-metallic'),roughness:number('material-roughness'),emissive:vector('material-emissive',3),alphaMode:$('material-alpha').value,alphaCutoff:number('material-cutoff'),unlit:$('material-unlit').checked,castShadow:$('material-shadow').checked};
      if(key==='light')value={kind:$('light-kind').value,color:vector('light-color',3),intensity:number('light-intensity'),range:number('light-range'),direction:vector('light-direction',3),innerAngle:number('light-inner'),outerAngle:number('light-outer'),shadow:$('light-shadow').checked};
      if(key==='lod')value={levels:Array.from({length:3},(_,i)=>({assetId:$('lod-asset-'+i).value,distance:number('lod-distance-'+i)})).filter(l=>l.assetId)};
      if(key==='render')value={renderScale:number('render-scale'),tier:$('render-tier').value,culling:$('render-culling').value,exposure:number('render-exposure'),toneMapping:$('render-tone').value,environment:vector('render-environment',3),shadows:$('render-shadows').checked,shadowSize:number('render-shadow-size'),bloom:number('render-bloom'),fxaa:$('render-fxaa').checked};
      await run(key==='render'?'scene.rendering.update':'scene.'+key+'.set',mutation({...(key==='render'?{}:{entityId:selected}),value}));
    });});
    if(key!=='render')$(key+'-remove').addEventListener('click',()=>act(()=>run('scene.component.remove',mutation({entityId:selected,component:({material:'Material',light:'Light',lod:'LOD'})[key]}))));
  }
  async function switchProject(type, data) {
    if ((state.dirty||ideDirty) && !confirmDiscard()) return;
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
    const dimension=document.defaultView?document.querySelector('input[name="project-dimension"]:checked')?.value:undefined;
    if (!name) { $("project-error").textContent = "Enter a project name."; return; }
    return act(() => switchProject("project.create", { name,...(["2","3"].includes(dimension)?{dimension:Number(dimension)}:{}) }));
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
  $("camera-form").addEventListener("submit",event=>{event.preventDefault();return act(()=>run('scene.camera.set',mutation({entityId:selected,value:{active:$("camera-active").checked,projection:$("camera-projection").value,fov:number('camera-fov'),orthoHeight:number('camera-ortho')}})));});
  $("camera-remove").addEventListener('click',()=>act(()=>run('scene.component.remove',mutation({entityId:selected,component:'Camera'}))));
  $("project-close").addEventListener("click",()=>act(async()=>{if((state.dirty||ideDirty)&&!confirmDiscard())return;await run("project.close",mutation({discardChanges:state.dirty}));}));
  $("play-start").addEventListener("click",()=>act(async()=>{await run("play.start",mutation());if(!getRenderer()?.parallelViewport?.()){view='game';panels.activateView('game');}}));
  $("play-stop").addEventListener("click",()=>act(()=>run("play.stop",mutation())));
  for(const name of ['scene','game'])$(name+'-tab').addEventListener('click',()=>{view=name;panels.activateView(name);draw(false);});
  $("project-list").addEventListener("change", draw);
  $("project-refresh").addEventListener("click", () => act(list));
  $("workspace-refresh").addEventListener("click", () => act(async () => {await run("scene.get");if($("file-menu"))$("file-menu").open=false;if($("settings-menu"))$("settings-menu").open=false;}));
  $("scene-add").addEventListener("click", () => act(() => run("scene.entity.create", mutation({ name: "Entity" }))));
  $("scene-delete").addEventListener("click",deleteSelected);
  async function saveProject(){try{await ide.flush();if(state.dirty)return act(()=>run('scene.save',mutation()));}catch(e){reportError(e);}}
  for(const action of ['save','undo','redo'])$('scene-'+action).addEventListener('click',()=>action==='save'?saveProject():act(()=>run('scene.'+action,mutation())));
  $('ambient-form')?.addEventListener('submit',event=>{event.preventDefault();return act(()=>{const value=[0,1,2].map(i=>number('ambient-'+i));return state.project.scene.twoD?run('scene.twoD.update',mutation({value:{...state.project.scene.twoD,ambient:value}})):run('scene.rendering.update',mutation({value:{...renderingDefaults,...state.project.scene.rendering,environment:value}}));});});
  $("physics-form").addEventListener("submit",event=>{event.preventDefault();const shape=$("physics-shape").value;return act(()=>shape==='none'?run('scene.component.remove',mutation({entityId:selected,component:'Collider'})):run('scene.collider.set',mutation({entityId:selected,value:{shape,dimension:Number($("physics-dimension").value),halfExtents:[0,1,2].map(i=>Number($("physics-half-"+i).value)),trigger:$("physics-trigger").checked,layer:Number($("physics-layer").value),mask:Number($("physics-mask").value)}})));});
  $('rigidbody-form')?.addEventListener('submit',event=>{event.preventDefault();return act(()=>{if($('physics-motion').value==='static')return run('scene.component.remove',mutation({entityId:selected,component:'RigidBody'}));const old=state.project.scene.entities.find(e=>e.id===selected).rigidBody;return run('scene.rigidBody.set',mutation({entityId:selected,value:{...old,mass:Number($('physics-mass').value),friction:Number($('physics-friction').value),restitution:Number($('physics-restitution').value),gravityScale:Number($('physics-gravity').value),freezeRotation:$('physics-freeze').checked}}));});});
  $("entity-form").addEventListener("submit", event => {
    event.preventDefault();const updates=state.project.scene.entities.filter(e=>selection.has(e.id)).map(e=>{const t=structuredClone(e.transform);const rotation=eulerFromQuaternion(t.rotation);for(const group of ['position','rotation','scale'])for(let i=0;i<3;i++){const raw=$(group+'-'+i).value.trim();if(raw!==''){const value=Number(raw);if(!Number.isFinite(value))throw Error('Transform values must be finite');if(group==='rotation')rotation[i]=value;else t[group][i]=value;}}t.rotation=quaternionFromEuler(rotation);return {entityId:e.id,transform:t};});
    return act(()=>updates.length===1?run('scene.entity.update',mutation({...updates[0],name:$('entity-name').value})):run('scene.entities.update',mutation({updates,space:'local'})));
  });
  function select(id,options=false){if(busy)return;filePaths=[];browser.clear(false);const o=typeof options==='boolean'?{toggle:options}:options;const valid=state.project?.scene.entities.some(e=>e.id===id);if(o.range&&valid){selection=new Set(rangeSelection(hierarchyRows(state.project.scene.entities,collapsed),anchor,id));}else{if(!o.toggle)selection.clear();if(valid){if(o.toggle&&selection.has(id))selection.delete(id);else selection.add(id);}anchor=id;}selected=selection.has(id)?id:[...selection].at(-1)??null;draw();}
  function deleteSelected(){if(!selection.size||state.playing||busy)return;return act(()=>run('scene.entities.delete',mutation({entityIds:[...selection]})));}
  if($('component-add')){
    $('component-add').addEventListener('click',()=>act(async()=>{const component=$('component-choice').value,entity=state.project.scene.entities.find(e=>e.id===selected);if(selection.size!==1)throw Error('Select one entity');
      if(component==='Camera'){if(entity.camera)throw Error('Camera is already attached');await run('scene.camera.set',mutation({entityId:selected,value:{...cameraDefaults,projection:state.project.scene.twoD?'orthographic':'perspective'}}));return;}
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
    for(const button of document.querySelectorAll?.('.create-example')??[])button.addEventListener('click',()=>act(()=>run('scene.example.create',mutation({example:button.dataset.example}))));
    for(const button of document.querySelectorAll?.('.create-primitive')??[])button.addEventListener('click',()=>act(()=>run('scene.primitive.create',mutation({dimension:Number(button.dataset.dimension),shape:button.dataset.shape}))));
    $('component-search')?.addEventListener('input',()=>{const query=$('component-search').value.trim().toLowerCase();const choice=$('component-choice'),names=['Camera','Renderable','Material','Light','LOD','Collider','RigidBody','Script','Animator',...audioEditor.names,...twoDEditor.names].filter(name=>name.toLowerCase().startsWith(query));choice.replaceChildren();for(const name of names){const option=document.createElement('option');option.textContent=option.value=name;choice.append(option);}$('component-add').disabled=!names.length||selection.size!==1||busy||state.playing;});
    $('toolbar-save')?.addEventListener('click',()=>{if(!$("scene-save").disabled)$("scene-save").click();});
    globalThis.addEventListener?.('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.code==='KeyS'){event.preventDefault();if(!state.playing&&!state.workspaceId&&!busy&&enabled&&state.project&&(state.dirty||ideDirty))void saveProject();return;}if(/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName??'')||event.target?.isContentEditable)return;
      if(event.code==='Escape'){select(null);browser.clear();}if(event.code==='Escape')for(const detail of document.querySelectorAll?.('.menubar details')??[])detail.open=false;
      if(event.code==='Delete'&&!event.target.closest?.('#project-content')){event.preventDefault();void deleteSelected();}
      if((event.ctrlKey||event.metaKey)&&['KeyZ','KeyY'].includes(event.code)){event.preventDefault();if(!state.playing&&!busy&&enabled){const redo=event.code==='KeyY'||event.shiftKey;if(redo?state.canRedo:state.canUndo)void act(()=>run(redo?'scene.redo':'scene.undo',mutation()));}}
    });
  }
  if(document.defaultView)document.querySelector('.hierarchy').addEventListener('click',event=>{if(!event.target.closest('[data-entity-id],.tree-toggle,.scene-root-button,button,input,select,.dock-panel-controls'))select(null);});
  $('entities').addEventListener('scroll',()=>{if(!document.defaultView||hierarchyPaint!==null)return;hierarchyPaint=requestAnimationFrame(()=>{hierarchyPaint=null;hierarchyScrolling=true;draw(false);hierarchyScrolling=false;});});
  draw();
  return {
    isBusy:()=>busy,
    selectedEntity:()=>selected,
    snapshot:()=>structuredClone(state),
    selectedEntities:()=>[...selection],
    selectEntity(id,options=false){select(id,options);},
    transformEntities(updates){return act(()=>run("scene.entities.update",mutation({updates,space:"world"})));},
    transformEntity(entityId,transform){return act(()=>run('scene.entity.update',mutation({entityId,transform:localTransform(state.project.scene.entities,entityId,transform)})));},
    async saveAiSettings(value){return act(()=>run('project.editor.update',mutation({value:{leftWidth:220,rightWidth:290,bottomHeight:190,...state.project.editor,...value}})));},
    async saveTestSuites(gameTests){return act(()=>run('project.editor.update',mutation({value:{leftWidth:220,rightWidth:290,bottomHeight:190,...state.project.editor,gameTests}})));},
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
