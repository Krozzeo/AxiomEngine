# M13 — Measured frame profiler

FrameProfiler retains 120 lean metric records (hard maximum 240) and only the
latest full diagnostic. Records contain trace ID, monotonically increasing frame
sequence, project/workspace/revision/generation, view, Play state and render route.
Snapshot preparation suspends RAF measurement until its new world commits;
snapshot replacement resets history; Pause and Clear are transient human controls.
They never mutate authoring or pause gameplay. Paused frames still render.

## Timing semantics

All durations are milliseconds measured with monotonic clocks. Main scopes are
nonoverlapping synchronous intervals: script.prepare, script.apply (wall interval
when resource preparation awaits), kernel.world-physics, animation.evaluate,
render.prepare, render.submit and audio.update. kernel.world-physics combines
world/physics work; it does not isolate collision cost. Main totals exclude editor
DOM diagnostics after finish. cpuTimeMs remains the legacy elapsed interval,
including script waits; it is not thread CPU or RAF cadence/FPS. Worker dispatch
is timed around synchronous .NET dispatch inside its worker. It overlaps
script.roundtrip; do not add those values. Scheduling/preemption can affect all
CPU intervals. Unmeasured gaps are not attributed to speculative causes.

Timestamp-query is optional. One fixed 32-entry query set and two 256-byte buffers
sample at most 16 passes every 10 frames, with one asynchronous readback in flight.
Legacy color, 2D color and HDR tile/cull compute, shadow, color, bloom and post are
instrumented. GPU total is the sum of observed passes. Queue waits and skinning
compute are excluded. Negative/invalid ranges, missing feature and Null report
unavailable with null timings. Late readbacks attach only to their retained frame
and matching generation, never the newest frame. No queue.onSubmittedWorkDone is
introduced; unsupported GPUs do not get fabricated zeros.

## Shared human / agent evidence

Profiler tab: table and elapsed bars, collection Pause, Clear, frame selector,
metric selector and Explain. Refresh is bounded to the latest 20 records (byte
budget can return fewer). Select any retained sequence to inspect a result.
profiler.query and profiler.explainFrameSpike are readonly semantic MCP tools.
They require an open project ID, exact revision and optional workspace ID.
Bridge replies also bind editor client and generation; stale replies are rejected.
History responses fit 15,000 bytes with backwards pagination nextBefore; public
maxBytes can request a stricter bound and receives an explicit budget error if
it cannot accommodate a result. Explain is limited to 16 KiB and eight contributors.
Renderer status carries a small profiler summary, not a world dump.

explainFrameSpike takes frameSequence, metric elapsed/main/gpu and baselineWindow
8–60 (default 30). It compares only earlier records of the same view, Play state
and route. Eight measured comparable samples are required. Threshold is max of
2×median, median+5ms and median+6×MAD. Positive per-scope differences above 0.1ms
are ranked. These are observed contributions, not proofs of underlying causes.
Unavailable GPU and evicted/cleared frames return unavailable; insufficient
baseline returns inconclusive. A measured normal frame returns explained/spike=false.
GPU baselines include only frames with resolved timestamps, not missing samples.

## Validation and boundaries

Node tests exercise known CPU/GPU regressions, waits, robust baseline, bounds,
eviction, copies, sessions, pause, asynchronous readback/backpressure, stale bridge
replies, canonical demos and preservation of existing projects. Browser acceptance
runs real C# pulse, human/API equality, real WebGPU timestamp routes, lifecycle and
Null. Benchmark measures bounded bookkeeping only, not full-frame FPS.
Demos/M13_GUIDE.md describes editable projects. Recording is local transient state;
no profiling data is saved to projects. OS thread CPU, allocation sampling,
call-stack sampling and uninstrumented GPU skin cost remain unavailable.

The full authoring/profile path uses the Node bootstrap. Native daemon remains
the M0 HTTP/security adapter; its existing aggregate Rust profiler is not claimed
as the new editor API. Earlier audio acceptance explicitly validates and records
PCM reads invalidated by a newer Stop revision; unrelated HTTP/console errors fail.
