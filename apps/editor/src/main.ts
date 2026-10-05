import {readSessionToken} from './session-token.mjs';
import {createEditorDocument} from './dock-layout.mjs';
import {mountProfilerEditor} from "./profiler-editor.mjs";
import {mountProposalEditor} from "./proposal-editor.js";
import {startAgentBridge} from "./agent-bridge.js";
import { mountProjectEditor } from "./project-editor.js";
import { createSceneRenderer } from "./scene-renderer.js";
import {mountSceneTools} from './scene-tools.mjs';

const document=createEditorDocument(globalThis.document);
const token = readSessionToken(location, globalThis.sessionStorage, history);

const connection = document.querySelector("#connection");
const logs = document.querySelector("#logs");
const counter = document.querySelector("#counter");
const traceOutput = document.querySelector("#trace");
const capabilities = document.querySelector("#capabilities");
const frameTraceOutput = document.querySelector("#frame-trace");
let renderer=null;
let sceneTools=null,activeView='scene';
let agentBridgeEnabled=false;
const agentErrors=[];
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
  agentErrors.push({code:error.code??error.message?.match(/^AX_[A-Z]+_\d{4}/)?.[0]??"AX_EDITOR_0001",cause:error.message});if(agentErrors.length>16)agentErrors.shift();
  log("error", error.data?.payload?.code ?? error.data?.code ?? error.code ?? error.message?.match(/^AX_[A-Z]+_\d{4}/)?.[0] ?? "AX_EDITOR_0001", error.message);
}
async function sendCommand(type, data = {}) {
  if(pendingSnapshot?.workspaceId&&/^(scene|asset|script|play)\./.test(type))data={...data,workspaceId:data.workspaceId??pendingSnapshot.workspaceId};
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
const proposalEditor=mountProposalEditor({document,send:sendCommand,reportError});
let unsavedScene = false;
const projectEditor = mountProjectEditor({ getRenderer:()=>renderer,document, send: sendCommand, reportError,onSelection:id=>sceneTools?.select(id),onView:view=>{activeView=view;renderer?.setView(view);}, onDirty: value => { unsavedScene = value; }, onState: async snapshot => {
  const changed=!pendingSnapshot||(pendingSnapshot.workspaceId??null)!==(snapshot.workspaceId??null)||pendingSnapshot.sceneRevision!==snapshot.sceneRevision||pendingSnapshot.project?.id!==snapshot.project?.id;
  pendingSnapshot=snapshot;
  if(renderer&&changed) await renderer.setSnapshot(snapshot);
} });
addEventListener("beforeunload", event => {
  if (unsavedScene) { event.preventDefault(); event.returnValue = ""; }
});

async function initializeWebGpu() {
  const response=await fetch("/axiom-kernel.wasm");
  if(!response.ok)throw new Error("AX_WASM_0001: failed to load kernel");
  renderer=await createSceneRenderer({canvas:document.querySelector("#viewport"),stateElement:document.querySelector("#gpu-state"),traceOutput:frameTraceOutput,bytes:await response.arrayBuffer(),reportError,
    reportScriptLog:(message,context)=>log("info","AX_SCRIPT_0005",message,context),
    forceNull:new URLSearchParams(location.search).get("renderer")==="null",
    readAudio:async data=>(await sendCommand("asset.audio.read",data)).payload.data,
    loadAsset:async(id,assetId,workspaceId)=>{const asset=(await sendCommand("asset.get",{id,assetId,...(workspaceId?{workspaceId}:{})})).payload.data.asset;for(const warning of asset.warnings??[])log("warning","AX_ASSET_0002",warning);return asset;}});
  addEventListener("pagehide",()=>renderer.dispose(),{once:true});
  if(pendingSnapshot)await renderer.setSnapshot(pendingSnapshot);
  renderer.setView(activeView);
  sceneTools=mountSceneTools({document,canvas:document.querySelector('#viewport'),getRenderer:()=>renderer,editor:projectEditor,reportError});sceneTools.select(projectEditor.selectedEntities());
  addEventListener('pagehide',()=>sceneTools.dispose(),{once:true});
}

async function boot() {
  try {
    const handshake = await api("/v1/handshake");
    agentBridgeEnabled=handshake.capabilities.includes("editor.bridge");
    if(handshake.capabilities.includes("command.script.compile")){const sample=await fetch("/default-game.cs");if(sample.ok)projectEditor.setDefaultSource(await sample.text());}
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
        for(const event of events){sequence=Math.max(sequence,event.payload.sequence);if(event.actor?.kind==="agent"&&!event.payload.type.endsWith(".result"))log("info","AX_AGENT_0005",event.payload.type,{traceId:event.traceId});}
        if(events.some(e=>["asset.jobFinished","script.jobFinished"].includes(e.payload.type)&&e.payload.data.status==="completed"))pendingRefresh=true;
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
    const stopProfiler=mountProfilerEditor({document,getRenderer:()=>renderer,getSnapshot:()=>pendingSnapshot,reportError});addEventListener("pagehide",stopProfiler,{once:true});
    if(agentBridgeEnabled){const stop=startAgentBridge({api,projectEditor,getRenderer:()=>renderer,getSnapshot:()=>pendingSnapshot,takeErrors:()=>agentErrors.splice(0),onProposals:proposalEditor.refresh,reportError});addEventListener("pagehide",stop,{once:true});}
  } catch (error) {
    document.querySelector("#gpu-state").textContent = "Renderer initialization failed; preview disabled.";
    log("error", "AX_RENDERER_0005", error.message);
  }
}

document.querySelector("#ping").addEventListener("click", () => execute("system.ping", { echo: "editor" }));
document.querySelector("#increment").addEventListener("click", () => execute("demo.increment", { amount: 1 }));
document.querySelector("#undo").addEventListener("click", () => execute("editor.undo"));
document.querySelector("#clear").addEventListener("click", () => logs.replaceChildren());
document.querySelector('#deep-trace').addEventListener('change',event=>renderer?.setDeepTrace(event.target.checked));
document.querySelector('#diagnostic-explain').addEventListener('click',()=>{
 const kind=document.querySelector('#diagnostic-kind').value,entityId=projectEditor.selectedEntity(),otherId=document.querySelector('#diagnostic-other').value,assetId=document.querySelector('#asset-list').value,traceId=document.querySelector('#diagnostic-trace').value.trim();
 const result=renderer?.explain({kind,entityId,otherId,assetId,expectedSceneRevision:pendingSnapshot?.sceneRevision,...(traceId?{traceId}:{})});document.querySelector('#decision-graph').textContent=JSON.stringify(result,null,2);
 document.querySelector('#causal-summary').textContent=result?`${result.status}: ${result.message}`:'No renderer evidence available';const path=document.querySelector('#causal-path');path.replaceChildren();for(const node of result?.nodes??[]){const item=document.createElement('li');item.textContent=`${node.code} · ${node.message}`;path.append(item);}
});
document.querySelector('#diagnostic-kind').addEventListener('change',()=>{const options=document.querySelector('#diagnostic-other');options.replaceChildren();for(const e of pendingSnapshot?.project?.scene.entities??[]){const option=document.createElement('option');option.value=e.id;option.textContent=e.name;options.append(option);}});
// Native details menus close when focus moves back into the workspace.
document.addEventListener('pointerdown',event=>{for(const menu of document.querySelectorAll('.menubar > details'))if(!menu.contains(event.target))menu.open=false;});
boot();
