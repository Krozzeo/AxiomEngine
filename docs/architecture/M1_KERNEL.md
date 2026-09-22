# M1 kernel and browser integration (0.0.9)

The master specification section 120 defines M1 as WebGPU + Engine Kernel.
The 0.0.7 handoff incorrectly called it Schema & Protocol Foundation; 0.0.8
corrects that label. Schema generation remains required cross-cutting work.

## Current boundaries

`axiom-core` defines `Scene`, stable `Entity` IDs, `Transform` and `Camera`.
Transforms default to unit scale and an identity quaternion. Scenes reject
duplicate IDs. Parenting, mesh components and camera projection are not yet
implemented. The schema Transform definition has not yet been connected through
code generation, so schema/type duplication must be removed before API lock-in.

`EngineLoop::tick` advances a variable clock and a configurable fixed clock.
It rejects negative/non-finite deltas before mutation and caps catch-up work at
`max_fixed_steps`. Excess backlog is discarded, preserving the fractional step
for interpolation. This is a bootstrap overload policy; dropped time is not
yet exposed as a diagnostic. It does not implement pause controls or simulation
callbacks. `JobQueue` stores FIFO work descriptors with causal IDs; it does not
execute jobs or create threads. Callers must drain it; it is not capacity-bound.

`ResourceManager<T>` invalidates stale references using index/generation pairs.
Deletion increments the generation before a slot is reused. Exhaustion returns
an error without removing the resource. Lookup never falls back to a name/path.

`axiom-renderer` has a deterministic dependency graph that rejects missing
dependencies and cycles. `RenderFrame::from_scene` currently counts entities;
it does not extract meshes, cull or project geometry. `NullRenderer` reports that
count with zero GPU submissions. Its CPU and GPU timings are `None`, because
neither has been measured. This does not yet establish WebGPU/Null scene parity.

`axiom-diagnostics::FrameProfiler` retains bounded profiles with caller-supplied
timings and trace IDs. It does not access the DOM or a platform clock.

## Browser integration (0.0.9)

`engine/core/src/demo.rs` owns a fixed demo camera and triangle mesh. It projects
vertices into WebGPU clip coordinates with a 0..1 depth interval. This small
shared demo is distinct from the unfinished generic scene/ECS extraction path.
`axiom-wasm` exports ABI v1 scalar functions and isolates explicit world handles.
`engine/wasm/host.mjs` checks the ABI, ticks Rust clocks and copies twelve vertex
floats into a packet. The same projected mesh is passed to Rust Null processing.
The WebGPU shader accepts the packet through a vertex buffer; it no longer
contains triangle coordinates. The core/renderer still forbid unsafe Rust; only
bridge export-name attributes have a narrowly scoped exception (ADR-0016).

The editor records CPU work through submission, not GPU execution latency. It
retains 120 traces and refreshes the panel every 15 frames. A first-frame GPU
sample is read asynchronously when timestamp queries are supported. Forced Null
(`?renderer=null`), missing GPU and device loss continue Wasm ticks and Null
processing. The trace includes a UUID plus the scalar kernel trace identity;
the latter is read back from Rust, not merely echoed by JavaScript.

The build compiles the Wasm module using the pinned Rust target, then copies
it with the host module into `dist/editor`. Both daemons permit Wasm compilation
in CSP while JavaScript eval stays blocked. No generated Wasm is a source file.

## Verification

```sh
npm run check
npm run check:native
cargo check --locked -p axiom-core --target wasm32-unknown-unknown
```

On 0.0.9: 16 Node tests and 22 Rust tests pass. Node executes the real release
Wasm and tests the editor's Null flow with a simulated DOM. This proves the
kernel/host boundary and headless frame trace, not hardware rendering. The M0 CI
record remains historical. See the M1 report for the new physical GPU smoke.

## Next implementation

Verify the changed WebGPU viewport and GPU timing sample before closing M1.
Then audit the master-spec feature list, record remaining limitations and start
the next milestone only with an accurate handoff. General scene extraction and
schema generation must replace demo-specific bindings before API lock-in.

## User evidence update

Windows startup, WebGPU triangle and Null rendering were confirmed by the user
for 0.0.9 with the Cargo discovery fix. Screenshots show frames 840 and 225,
one mesh in each backend, finite CPU timings and a first GPU sample of 0 ms.
Earlier references to pending visual evidence above are superseded by this
record. The remaining closure gate is current remote CI. Do not repeat the
browser smoke for unchanged code. Zero GPU sample is not a zero-cost claim.
