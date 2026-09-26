export function mountProjectEditor({ document, send, reportError, confirmDiscard = () => confirm("Discard unsaved scene changes?"), onDirty = () => {}, onState = async () => {} }) {
  const $ = id => document.querySelector(`#${id}`);
  const supported = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo", "asset.import", "asset.get", "scene.asset.place", "scene.camera.update", "play.start", "play.stop", "project.close"];
  let enabled = false, pipelineEnabled=false, currentJob=null;
  let busy = false;
  let state = { project: null, dirty: false, sceneRevision: 0, canUndo: false, canRedo: false };
  let selected = null;
  function draw(updateFields = true) {
    const project = state.project;
    const entity = project?.scene.entities.find(item => item.id === selected);
    const editing=enabled&&!busy&&!state.playing;
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
    $("scene-tab").disabled=busy||!state.playing;
    $("game-tab").disabled=!editing||!project;
    $("scene-tab").className=state.playing?"":"active";
    $("game-tab").className=state.playing?"active":"";
    $("play-status").textContent=state.playing?"Play · runtime copy":"Scene · authoring";
    $("preview-note").textContent=project ? `${project.name} · ${state.playing?"Game":"Scene"}` : "Create or open a project to begin";
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
    for (const group of ["position", "scale"]) for (let i = 0; i < 3; i++) $(`${group}-${i}`).value = String(entity?.transform[group][i] ?? (group === "scale" ? 1 : 0));
    }
    onDirty(state.dirty);
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
  }
  async function run(type, data = {}) {
    const event = await send(type, data);
    adopt(event.payload.data);
    if("project" in event.payload.data) await onState(event.payload.data);
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
  for(const id of ["play-start","game-tab"])$(id).addEventListener("click",()=>act(()=>run("play.start",mutation())));
  for(const id of ["play-stop","scene-tab"])$(id).addEventListener("click",()=>act(()=>run("play.stop",mutation())));
  $("project-list").addEventListener("change", draw);
  $("project-refresh").addEventListener("click", () => act(list));
  $("workspace-refresh").addEventListener("click", () => act(() => run("scene.get")));
  $("scene-add").addEventListener("click", () => act(() => run("scene.entity.create", mutation({ name: "Entity" }))));
  $("scene-delete").addEventListener("click", () => act(() => run("scene.entity.delete", mutation({ entityId: selected }))));
  for (const action of ["save", "undo", "redo"]) $("scene-" + action).addEventListener("click", () => act(() => run("scene." + action, mutation())));
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
    async refreshAssets() {if(enabled&&!busy)await act(()=>run("scene.get"));},
    async connect(capabilities) {
      pipelineEnabled=["asset.job.start","asset.job.get","asset.job.cancel","asset.explain"].every(c=>capabilities.includes(`command.${c}`));
      enabled = supported.every(command => capabilities.includes(`command.${command}`));
      draw();
      if (enabled) await act(async () => { await list(); await run("scene.get"); });
    }
  };
}
