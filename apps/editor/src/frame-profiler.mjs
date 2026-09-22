export class FrameProfiler {
  #capacity;
  #frames = [];
  #nextSequence = 1;
  #dropped = 0;

  constructor(capacity = 120) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("capacity must be a positive integer");
    this.#capacity = capacity;
  }

  begin(cpuStartMs, traceId = crypto.randomUUID()) {
    return {
      frameSequence: this.#nextSequence++,
      traceId,
      cpuStartMs,
      cpuTimeMs: null,
      gpuTimeMs: null,
      stages: ["frame.begin"]
    };
  }

  finish(frame, cpuEndMs, renderer = "webgpu") {
    frame.cpuTimeMs = Math.max(0, cpuEndMs - frame.cpuStartMs);
    frame.stages.push(renderer === "null" ? "render.null" : "render.submitted", "frame.end");
    delete frame.cpuStartMs;
    if (this.#frames.length === this.#capacity) {
      this.#frames.shift();
      this.#dropped += 1;
    }
    this.#frames.push(frame);
    return frame;
  }

  attachGpuTiming(frameSequence, gpuTimeMs) {
    const frame = this.#frames.find((candidate) => candidate.frameSequence === frameSequence);
    if (!frame) return false;
    frame.gpuTimeMs = Math.max(0, gpuTimeMs);
    frame.stages.splice(-1, 0, "gpu.timestamp.resolved");
    return true;
  }

  latest() {
    return this.#frames.at(-1) ?? null;
  }

  get dropped() {
    return this.#dropped;
  }
}
