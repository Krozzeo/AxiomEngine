import test from "node:test";
import assert from "node:assert/strict";
import { FrameProfiler } from "../apps/editor/src/frame-profiler.mjs";

test("frame profiler retains bounded inspectable CPU and GPU traces", () => {
  const profiler = new FrameProfiler(1);
  const first = profiler.finish(profiler.begin(10, "trace-1"), 12.5);
  assert.equal(first.cpuTimeMs, 2.5);
  assert.deepEqual(first.stages, ["frame.begin", "render.submitted", "frame.end"]);

  const second = profiler.finish(profiler.begin(20, "trace-2"), 21);
  assert.equal(profiler.dropped, 1);
  assert.equal(profiler.latest(), second);
  assert.equal(profiler.attachGpuTiming(second.frameSequence, 0.75), true);
  assert.equal(second.gpuTimeMs, 0.75);
  assert.ok(second.stages.includes("gpu.timestamp.resolved"));
});

test("frame profiler rejects invalid capacity", () => {
  assert.throws(() => new FrameProfiler(0), RangeError);
});
