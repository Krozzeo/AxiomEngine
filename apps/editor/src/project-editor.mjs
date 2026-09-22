export function mountProjectEditor({ document, send, reportError, confirmDiscard = () => confirm("Discard unsaved scene changes?"), onDirty = () => {} }) {
  const $ = id => document.querySelector(`#${id}`);
  const supported = ["project.create", "project.open", "project.list", "scene.get", "scene.save", "scene.entity.create", "scene.entity.update", "scene.entity.delete", "scene.undo", "scene.redo"];
  let enabled = false;
  let busy = false;
  let state = { project: null, dirty: false, sceneRevision: 0, canUndo: false, canRedo: false };
  let selected = null;
  function draw(updateFields = true) {
    const project = state.project;
    const entity = project?.scene.entities.find(item => item.id === selected);
    $("project-status").textContent = project ? `${project.name} · ${state.dirty ? "Unsaved changes" : "Saved"} · revision ${project.revision}` : enabled ? "Create or open a project" : "Project editing is unavailable on this daemon";
    $("project-new").disabled = !enabled || busy;
    $("project-open").disabled = !enabled || busy || !$("project-list").value;
    $("project-refresh").disabled = !enabled || busy;
    $("workspace-refresh").disabled = !enabled || busy;
    $("scene-add").disabled = !enabled || busy || !project;
    $("scene-save").disabled = !enabled || busy || !project || !state.dirty;
    $("scene-undo").disabled = busy || !state.canUndo;
    $("scene-redo").disabled = busy || !state.canRedo;
    $("scene-delete").disabled = busy || !entity;
    $("entity-fields").disabled = busy || !entity;
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
    async connect(capabilities) {
      enabled = supported.every(command => capabilities.includes(`command.${command}`));
      draw();
      if (enabled) await act(async () => { await list(); await run("scene.get"); });
    }
  };
}
