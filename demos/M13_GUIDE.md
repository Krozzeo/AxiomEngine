# M13 demos

Run `npm.cmd run demo` (or `demo:m13`), then `npm.cmd run dev`.
Existing saved projects are preserved; each invocation creates a new pair.
Open from Archivo → Proyectos → Saved projects. Profiler is a tab next to Diagnostics.

## Frame Spike Lab

Five cubes demonstrate live 3D frames. Game can preview without Play. Open Profiler
and observe elapsed/main/GPU columns and bars. Start Play, wait a few seconds for
baseline frames, focus the viewport, then press 1 once. Its real C# controller
executes one ~140ms worker pulse on the key's rising edge. Arrow keys move the first
cube. Pause collection soon after pressing 1; the game continues. Find the slower
frame or enter its retained sequence, select Elapsed and click Explain frame spike.
worker.dispatch and script.roundtrip should increase. They overlap; their durations
must not be added. Main can stay small because the work runs in another worker.

The last 20 rows are shown, out of a retained 120. Pause soon enough to retain the
spike; press 1 again after releasing it if it has been evicted. Clear history starts
a fresh baseline. Stop resets history and restores the authored scene.
C# requires the configured .NET 10 SDK and wasm-tools. If compilation fails, demos
remain saved and timing works, but the controlled keyboard pulse is unavailable;
the creation command prints the actual compiler error.

Optional: Ajustes → HDR Rendering settings enable HDR on this 3D project. GPU samples
then expose tile/culling compute, shadow, color, bloom and post independently.
Legacy mode exposes legacy.color. GPU values appear only on sampled frames and
only when timestamp-query is supported. Null deliberately has no GPU duration.

## 2D Pass Timing

Five colored sprites preview in Game without Play. Profiler separates 2D preparation
and submission from other work; sampled GPU frames contain 2d.color. Edit sprites,
positions and camera normally; a new revision clears history. No controller is
needed here. Compare view/route contexts without mixing their baselines.

These demos demonstrate measurement and evidence, not a full performance budget.
Profiler main timings are synchronous intervals, not OS thread CPU. GPU totals
exclude queue waits and skin compute. See docs/architecture/M13_PROFILER.md.
