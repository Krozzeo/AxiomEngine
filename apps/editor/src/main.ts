import { mountProjectEditor } from "./project-editor.js";
import { FrameProfiler } from "./frame-profiler.js";
import { loadKernel } from "./kernel-host.js";

const token = new URLSearchParams(location.hash.slice(1)).get("token");
history.replaceState(null, "", location.pathname + location.search);

const connection = document.querySelector("#connection");
const logs = document.querySelector("#logs");
const counter = document.querySelector("#counter");
const traceOutput = document.querySelector("#trace");
const capabilities = document.querySelector("#capabilities");
const frameTraceOutput = document.querySelector("#frame-trace");
const frameProfiler = new FrameProfiler(120);

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
const projectEditor = mountProjectEditor({ document, send: sendCommand, reportError, onDirty: value => { unsavedScene = value; } });
addEventListener("beforeunload", event => {
  if (unsavedScene) { event.preventDefault(); event.returnValue = ""; }
});

async function initializeWebGpu() {
  const canvas = document.querySelector("#viewport");
  const state = document.querySelector("#gpu-state");
  const response = await fetch("/axiom-kernel.wasm");
  if (!response.ok) throw new Error(`AX_WASM_0001: HTTP ${response.status}`);
  const kernel = await loadKernel(await response.arrayBuffer());
  let running = true;
  let animationId = null;
  let nullActive = false;
  let disposed = false;
  addEventListener("pagehide", () => {
    running = false;
    nullActive = false;
    disposed = true;
    if (animationId !== null) cancelAnimationFrame(animationId);
    kernel.dispose();
  }, { once: true });
  let previousTime = null;
  let traceSequence = 0n;
  function kernelStep(now) {
    const delta = previousTime === null ? 0 : (now - previousTime) / 1000;
    previousTime = now;
    return kernel.step(delta, ++traceSequence, canvas.width / canvas.height);
  }
  function startNull(reason) {
    if (nullActive || disposed) return;
    running = false;
    nullActive = true;
    state.textContent = `Null Renderer · ${reason}`;
    function nullFrame(now) {
      if (!nullActive) return;
      const frame = frameProfiler.begin(performance.now());
      const packet = kernelStep(now);
      frame.kernel = { frame: packet.frame, trace: packet.trace, fixedSteps: packet.fixedSteps, meshes: packet.nullProcessedMeshes, renderer: "null" };
      frameProfiler.finish(frame, performance.now(), "null");
      if (packet.frame === 1 || packet.frame % 15 === 0) frameTraceOutput.textContent = JSON.stringify(frame, null, 2);
      animationId = requestAnimationFrame(nullFrame);
    }
    animationId = requestAnimationFrame(nullFrame);
  }
  if (new URLSearchParams(location.search).get("renderer") === "null") {
    startNull("selected explicitly");
    return;
  }
  if (!navigator.gpu) {
    startNull("WebGPU unavailable");
    log("warning", "AX_RENDERER_0001", "WebGPU is unavailable; preview disabled");
    return;
  }
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
  if (!adapter) {
    startNull("no compatible adapter");
    log("warning", "AX_RENDERER_0002", "No compatible WebGPU adapter; preview disabled");
    return;
  }
  const timestampQuerySupported = adapter.features.has("timestamp-query");
  let device;
  try {
    device = await adapter.requestDevice({ requiredFeatures: timestampQuerySupported ? ["timestamp-query"] : [] });
  } catch (error) {
    log("warning", "AX_RENDERER_0005", error.message);
    startNull("device creation failed");
    return;
  }
  device.lost.then((info) => {
    running = false;
    if (animationId !== null) cancelAnimationFrame(animationId);
    state.textContent = `WebGPU device lost · ${info.reason}`;
    log("error", "AX_RENDERER_0003", "WebGPU device lost", { reason: info.reason, message: info.message });
    startNull("GPU device lost");
  });
  const context = canvas.getContext("webgpu");
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: "opaque" });
  const module = device.createShaderModule({ code: `
    @vertex fn vs(@location(0) position: vec4f) -> @builtin(position) vec4f {
      return position;
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
    vertex: { module, entryPoint: "vs", buffers: [{ arrayStride: 16, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x4" }] }] },
    fragment: { module, entryPoint: "fs", targets: [{ format }] },
    primitive: { topology: "triangle-list" }
  });
  const vertexBuffer = device.createBuffer({ size: 48, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  const timestampQuery = device.features.has("timestamp-query");
  const querySet = timestampQuery ? device.createQuerySet({ type: "timestamp", count: 2 }) : null;
  const queryResolveBuffer = timestampQuery ? device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC }) : null;
  const queryReadBuffer = timestampQuery ? device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }) : null;
  let lastTimestampFrame = 0;
  let timestampReadPending = false;
  let gpuTimingSample = null;

  function renderFrame(now) {
    if (!running) return;
    try {
    const started = performance.now();
    const frame = frameProfiler.begin(started);
    const packet = kernelStep(now);
    frame.kernel = { frame: packet.frame, trace: packet.trace, fixedSteps: packet.fixedSteps, meshes: packet.nullProcessedMeshes, renderer: "webgpu" };
    device.queue.writeBuffer(vertexBuffer, 0, packet.vertices);
    const encoder = device.createCommandEncoder({ label: "axiom-m1-frame" });
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: { r: 0.025, g: 0.035, b: 0.055, a: 1 }, loadOp: "clear", storeOp: "store" }],
      ...(timestampQuery && lastTimestampFrame === 0 ? { timestampWrites: { querySet, beginningOfPassWriteIndex: 0, endOfPassWriteIndex: 1 } } : {})
    });
    pass.setPipeline(pipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(3);
    pass.end();
    if (timestampQuery && lastTimestampFrame === 0) {
      encoder.resolveQuerySet(querySet, 0, 2, queryResolveBuffer, 0);
      encoder.copyBufferToBuffer(queryResolveBuffer, 0, queryReadBuffer, 0, 16);
      lastTimestampFrame = frame.frameSequence;
    }
    device.queue.submit([encoder.finish()]);
    frameProfiler.finish(frame, performance.now());
    if (timestampQuery && lastTimestampFrame === frame.frameSequence && !timestampReadPending) {
      timestampReadPending = true;
      queryReadBuffer.mapAsync(GPUMapMode.READ).then(() => {
        const timestamps = new BigUint64Array(queryReadBuffer.getMappedRange().slice(0));
        gpuTimingSample = {
          frameSequence: lastTimestampFrame,
          milliseconds: Number(timestamps[1] - timestamps[0]) / 1_000_000
        };
        queryReadBuffer.unmap();
        frameProfiler.attachGpuTiming(lastTimestampFrame, gpuTimingSample.milliseconds);
      }).catch((error) => log("warning", "AX_RENDERER_0006", "GPU timestamp read failed", { message: error.message }));
    }
    if (frame.frameSequence === 1 || frame.frameSequence % 15 === 0) {
      frameTraceOutput.textContent = JSON.stringify({ ...frameProfiler.latest(), gpuTimingSample, retainedFrames: Math.min(frame.frameSequence, 120), droppedFrames: frameProfiler.dropped }, null, 2);
    }
    animationId = requestAnimationFrame(renderFrame);
    } catch (error) {
      running = false;
      state.textContent = "Rendering stopped · inspect the console.";
      log("error", "AX_RENDERER_0005", error.message);
    }
  }

  animationId = requestAnimationFrame(renderFrame);
  state.textContent = `WebGPU active · ${format}${timestampQuery ? " · GPU timestamps" : " · CPU timing only"}`;
  state.classList.add("success");
  log("info", "AX_RENDERER_0004", "WebGPU engine loop rendering triangle scene", { format, timestampQuery });
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
