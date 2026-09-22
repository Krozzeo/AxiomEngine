const token = new URLSearchParams(location.hash.slice(1)).get("token");
history.replaceState(null, "", location.pathname);

const connection = document.querySelector("#connection");
const logs = document.querySelector("#logs");
const counter = document.querySelector("#counter");
const traceOutput = document.querySelector("#trace");
const capabilities = document.querySelector("#capabilities");

function log(level, code, message, data = null) {
  const item = document.createElement("li");
  item.className = level;
  const time = document.createElement("time");
  time.textContent = new Date().toLocaleTimeString();
  const body = document.createElement("span");
  body.textContent = `${code} · ${message}${data ? ` · ${JSON.stringify(data)}` : ""}`;
  item.append(time, body);
  logs.prepend(item);
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
  if (!response.ok) throw Object.assign(new Error(data.cause ?? `HTTP ${response.status}`), { data });
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

async function execute(type, data = {}) {
  try {
    const result = await api("/v1/commands", { method: "POST", body: JSON.stringify(command(type, data)) });
    log("info", result.payload.reasonCode ?? "AX_EVENT_0001", result.payload.type, result.payload.data);
    if ("current" in result.payload.data) counter.value = String(result.payload.data.current);
    const trace = await api(`/v1/traces/${encodeURIComponent(result.traceId)}`);
    traceOutput.textContent = JSON.stringify(trace, null, 2);
  } catch (error) {
    log("error", error.data?.code ?? "AX_EDITOR_0001", error.message, error.data ?? null);
  }
}

async function initializeWebGpu() {
  const canvas = document.querySelector("#viewport");
  const state = document.querySelector("#gpu-state");
  if (!navigator.gpu) {
    state.textContent = "No GPU mode · WebGPU unavailable; project tools remain active.";
    log("warning", "AX_RENDERER_0001", "WebGPU is unavailable; Null Renderer selected");
    return;
  }
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) {
    state.textContent = "No GPU mode · no compatible adapter.";
    log("warning", "AX_RENDERER_0002", "No compatible WebGPU adapter; Null Renderer selected");
    return;
  }
  const device = await adapter.requestDevice();
  device.lost.then((info) => {
    state.textContent = `WebGPU device lost · ${info.reason}`;
    log("error", "AX_RENDERER_0003", "WebGPU device lost", { reason: info.reason, message: info.message });
  });
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });
  const module = device.createShaderModule({ code: `
    @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
      let p = array(vec2f(0.0, 0.62), vec2f(-0.58, -0.48), vec2f(0.58, -0.48));
      return vec4f(p[i], 0.0, 1.0);
    }
    @fragment fn fs() -> @location(0) vec4f {
      return vec4f(0.38, 0.74, 1.0, 1.0);
    }
  ` });
  const compilation = await module.getCompilationInfo();
  const errors = compilation.messages.filter((item) => item.type === "error");
  if (errors.length) throw new Error(errors.map((item) => item.message).join("; "));
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: { module, entryPoint: "fs", targets: [{ format }] },
    primitive: { topology: "triangle-list" }
  });
  const encoder = device.createCommandEncoder({ label: "axiom-m0-frame" });
  const pass = encoder.beginRenderPass({
    colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: { r: 0.025, g: 0.035, b: 0.055, a: 1 }, loadOp: "clear", storeOp: "store" }]
  });
  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();
  device.queue.submit([encoder.finish()]);
  state.textContent = `WebGPU active · ${format}${device.features.has("timestamp-query") ? " · GPU timestamps" : " · timestamps unavailable"}`;
  state.classList.add("success");
  log("info", "AX_RENDERER_0004", "WebGPU spike rendered a triangle", { format, timestampQuery: device.features.has("timestamp-query") });
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
  } catch (error) {
    connection.textContent = "Disconnected";
    connection.className = "status error";
    log("error", error.data?.code ?? "AX_EDITOR_0002", error.message);
  }
  try {
    await initializeWebGpu();
  } catch (error) {
    document.querySelector("#gpu-state").textContent = "Renderer initialization failed; Null Renderer selected.";
    log("error", "AX_RENDERER_0005", error.message);
  }
}

document.querySelector("#ping").addEventListener("click", () => execute("system.ping", { echo: "editor" }));
document.querySelector("#increment").addEventListener("click", () => execute("demo.increment", { amount: 1 }));
document.querySelector("#undo").addEventListener("click", () => execute("editor.undo"));
document.querySelector("#clear").addEventListener("click", () => logs.replaceChildren());
boot();

