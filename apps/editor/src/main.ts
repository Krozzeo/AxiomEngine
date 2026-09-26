import { mountProjectEditor } from "./project-editor.js";
import { createSceneRenderer } from "./scene-renderer.js";

const token = new URLSearchParams(location.hash.slice(1)).get("token");
history.replaceState(null, "", location.pathname + location.search);

const connection = document.querySelector("#connection");
const logs = document.querySelector("#logs");
const counter = document.querySelector("#counter");
const traceOutput = document.querySelector("#trace");
const capabilities = document.querySelector("#capabilities");
const frameTraceOutput = document.querySelector("#frame-trace");
let renderer=null;
let pendingSnapshot=null;

function log(level, code, message, data = null) {
  const item = document.createElement("li");
  item.className = level;
  const time = document.createElement("time");
  time.textContent = new Date().toLocaleTimeString();
  const body = document.createElement("span");
  body.textContent = `${code} · ${message}${data ? ` · ${JSON.stringify(data)}` : ""}`;
  item.append(time, body);
  logs.prepend(item);
  while(logs.children?.length>256)logs.lastElementChild.remove();
}

async function api(path, options = {}) {
  if (!token) throw new Error("Missing session token. Open the URL printed by the daemon.");
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Axiom-Protocol-Version": "1",
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.payload?.cause ?? data.cause ?? `HTTP ${response.status}`), { data });
  return data;
}

function command(type, data = {}) {
  const id = crypto.randomUUID();
  return {
    protocolVersion: 1,
    messageId: crypto.randomUUID(),
    kind: "command",
    timestamp: new Date().toISOString(),
    correlationId: id,
    traceId: id,
    causationId: null,
    actor: { kind: "human", id: "local-editor" },
    payload: { type, data }
  };
}

function reportError(error) {
  log("error", error.data?.payload?.code ?? error.data?.code ?? "AX_EDITOR_0001", error.message);
}
async function sendCommand(type, data = {}) {
  const result = await api("/v1/commands", { method: "POST", body: JSON.stringify(command(type, data)) });
  log("info", result.payload.reasonCode ?? "AX_EVENT_0001", result.payload.type);
  if ("current" in result.payload.data) counter.value = String(result.payload.data.current);
  try {
    const trace = await api(`/v1/traces/${encodeURIComponent(result.traceId)}`);
    traceOutput.textContent = JSON.stringify(trace, null, 2);
  } catch (error) { reportError(error); }
  return result;
}
async function execute(type, data = {}) {
  try { return await sendCommand(type, data); } catch (error) { reportError(error); }
}
let unsavedScene = false;
const projectEditor = mountProjectEditor({ document, send: sendCommand, reportError, onDirty: value => { unsavedScene = value; }, onState: async snapshot => {
  pendingSnapshot=snapshot;
  if(renderer) await renderer.setSnapshot(snapshot);
} });
addEventListener("beforeunload", event => {
  if (unsavedScene) { event.preventDefault(); event.returnValue = ""; }
});

async function initializeWebGpu() {
  const response=await fetch("/axiom-kernel.wasm");
  if(!response.ok)throw new Error("AX_WASM_0001: failed to load kernel");
  renderer=await createSceneRenderer({canvas:document.querySelector("#viewport"),stateElement:document.querySelector("#gpu-state"),traceOutput:frameTraceOutput,bytes:await response.arrayBuffer(),reportError,
    forceNull:new URLSearchParams(location.search).get("renderer")==="null",
    loadAsset:async(id,assetId)=>{const asset=(await sendCommand("asset.get",{id,assetId})).payload.data.asset;for(const warning of asset.warnings??[])log("warning","AX_ASSET_0002",warning);return asset;}});
  addEventListener("pagehide",()=>renderer.dispose(),{once:true});
  if(pendingSnapshot)await renderer.setSnapshot(pendingSnapshot);
}

async function boot() {
  try {
    const handshake = await api("/v1/handshake");
    connection.textContent = `Connected · protocol v${handshake.protocol.selected}`;
    connection.className = "status ok";
    for (const [name, value] of Object.entries({ schema: handshake.schemaHash.slice(0, 20), capabilities: handshake.capabilities.length, eventBuffer: handshake.limits.retainedEvents })) {
      const term = document.createElement("dt");
      term.textContent = name;
      const description = document.createElement("dd");
      description.textContent = String(value);
      capabilities.append(term, description);
    }
    log("info", "AX_PROTOCOL_0004", "Capability negotiation completed", handshake.server);
    await projectEditor.connect(handshake.capabilities);
    if(handshake.capabilities.includes("command.asset.job.start")) {
      let sequence=0,stopped=false,pendingRefresh=false;
      addEventListener("pagehide",()=>{stopped=true;},{once:true});
      const poll=async()=>{try{
        const {events}=await api(`/v1/events?since=${sequence}`);
        for(const event of events)sequence=Math.max(sequence,event.payload.sequence);
        if(events.some(e=>e.payload.type==="asset.jobFinished"&&e.payload.data.status==="completed"))pendingRefresh=true;
        if(pendingRefresh && await projectEditor.refreshAssets())pendingRefresh=false;
      }catch(error){if(!stopped)reportError(error);}finally{if(!stopped)setTimeout(poll,750);}};
      void poll();
    }
  } catch (error) {
    connection.textContent = "Disconnected";
    connection.className = "status error";
    log("error", error.data?.code ?? "AX_EDITOR_0002", error.message);
  }
  try {
    await initializeWebGpu();
  } catch (error) {
    document.querySelector("#gpu-state").textContent = "Renderer initialization failed; preview disabled.";
    log("error", "AX_RENDERER_0005", error.message);
  }
}

document.querySelector("#ping").addEventListener("click", () => execute("system.ping", { echo: "editor" }));
document.querySelector("#increment").addEventListener("click", () => execute("demo.increment", { amount: 1 }));
document.querySelector("#undo").addEventListener("click", () => execute("editor.undo"));
document.querySelector("#clear").addEventListener("click", () => logs.replaceChildren());
boot();
