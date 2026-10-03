export function mountProjectEditor({ document, send, reportError, confirmDiscard = () => confirm("Discard unsaved scene changes?"), onDirty = () => {}, onState = async () => {}, onSelection=()=>{},onView=()=>{}, defaultScript = "" }) {
  const $ = id => document.querySelector(`#${id}`);
  const supported = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo", "asset.import", "asset.get", "scene.asset.place", "scene.camera.update", "play.start", "play.stop", "project.close"];
  let enabled = false, pipelineEnabled=false, currentJob=null;
  let scriptEnabled=false,currentScriptJob=null,scriptProject=null,scriptBuild=null;
  let busy = false;
  let state = { project: null, dirty: false, sceneRevision: 0, canUndo: false, canRedo: false };
  let selected = null;
  let view='scene';
  function draw(updateFields = true) {
    const project = state.project;
    const entity = project?.scene.entities.find(item => item.id === selected);
    const editing=enabled&&!busy&&!state.playing;
    $("script-source").disabled=!scriptEnabled||!project||busy;
    $("script-mode").disabled=!scriptEnabled||!project||busy;
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
    for (const item of project?.scene.entities ?? []) {
      const button = document.createElement("button");
      button.textContent = item.name;
      button.className = item.id === selected ? "entity selected" : "entity";
      button.setAttribute("aria-pressed", String(item.id === selected));
      button.disabled = busy;
      button.addEventListener("click", () => { selected = item.id; draw(); });
      $("entities").append(button);
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
    onSelection(selected);onView(view);
  }
  function adopt(data) {
    if (!("project" in data)) return;
    const oldIds = new Set(state.project?.scene.entities.map(entity => entity.id));
    state = data;
    if (!state.project?.scene.entities.some(entity => entity.id === selected)) selected = state.project?.scene.entities[0]?.id ?? null;
    const added = state.project?.scene.entities.find(entity => !oldIds.has(entity.id));
    if (added) selected = added.id;
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
  $("workspace-refresh").addEventListener("click", () => act(() => run("scene.get")));
  $("scene-add").addEventListener("click", () => act(() => run("scene.entity.create", mutation({ name: "Entity" }))));
  $("scene-delete").addEventListener("click", () => act(() => run("scene.entity.delete", mutation({ entityId: selected }))));
  for (const action of ["save", "undo", "redo"]) $("scene-" + action).addEventListener("click", () => act(() => run("scene." + action, mutation())));
  $("physics-form").addEventListener("submit",event=>{event.preventDefault();const shape=$("physics-shape").value;const collider={shape,dimension:Number($("physics-dimension").value),halfExtents:[0,1,2].map(i=>Number($("physics-half-"+i).value)),trigger:$("physics-trigger").checked,layer:Number($("physics-layer").value),mask:Number($("physics-mask").value)};const dynamic=$("physics-motion").value==="dynamic",mass=Number($("physics-mass").value);return act(async()=>{
    const old=state.project.scene.entities.find(e=>e.id===selected)?.rigidBody;
    if(shape==="none"){await run("scene.component.remove",mutation({entityId:selected,component:"Collider"}));return;}
    await run("scene.collider.set",mutation({entityId:selected,value:collider}));
    if(dynamic)await run("scene.rigidBody.set",mutation({entityId:selected,value:{velocity:[0,0,0],restitution:0,friction:0.5,gravityScale:1,...old,mass}}));
    else if(old)await run("scene.component.remove",mutation({entityId:selected,component:"RigidBody"}));
  });});
  $("entity-form").addEventListener("submit", event => {
    event.preventDefault();
    const transform = {};
    for (const group of ["position", "scale"]) transform[group] = [0, 1, 2].map(i => {
      const value = $(`${group}-${i}`).value.trim();
      return value === "" ? NaN : Number(value);
    });
    if (Object.values(transform).flat().some(value => !Number.isFinite(value))) { $("project-error").textContent = "Transform values must be finite numbers."; return; }
    const data = mutation({ entityId: selected, name: $("entity-name").value, transform });
    return act(() => run("scene.entity.update", data));
  });
  draw();
  return {
    isBusy:()=>busy,
    selectedEntity:()=>selected,
    selectEntity(id){if(busy)return;selected=state.project?.scene.entities.some(e=>e.id===id)?id:null;draw();},
    transformEntity(entityId,transform){return act(()=>run('scene.entity.update',mutation({entityId,transform})));},
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
