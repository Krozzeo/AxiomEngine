# Profiles, CPU/GPU synchronization and frozen workload gates

Policy v1, frozen before solver prototypes. These are future acceptance thresholds, not measured GPU results.

| Profile | Current evidence | Required acceptance / limitation |
| --- | --- | --- |
| Windows managed ABI6000.3.27f1 | Actual PE tables from official editor and Android/iOS editor extensions; hashes/MVIDs retained | Declared reference only; no vendor code runs in Axiom |
| Axiom C# development / Wasm | Editable M19 corpus, positive/negative/lifecycle observations, known discrepancies and Stop restoration | Alias observations; no native Unity signature credit |
| Axiom AOT / Wasm | Existing product CI checks compilation/runtime; M19 corpus attribution is reported per execution | AOT is a separate harness mode; an unexecuted corpus mode is not credited |
| Axiom native CPU | Rust/core tests and declared parity vectors | Not every browser/daemon domain service is a native equivalent |
| Browser Null | UI/authoring and CPU simulation may be exercised | No rendering pixels, audio, GPU timestamps or GPU-physics proof |
| WebGPU preferred / software fallback | Renderer reports actual adapter mode | Rendering/compute availability is not a physics solver or physical-GPU benchmark |
| GPU3D / GPU2D | No production solver accepted | M25/M26/M28 implement and measure; CPU remains available |
| Unity6.3 execution oracle | Not run locally | Installed newer/older editors are not substitutes; reference metadata is not an execution result |
| Other platforms/devices/packages | Explicit pending/blocked inventories | M37/M39 adapters and exact version/device validation remain required |

## Numeric and lifecycle contracts

Unity single-precision public parameters/fields must retain their source types. Axiom currently exposes many doubles; that is partial compatibility, not a silent widening rule. Freeze finite-input/reference cases separately from NaN/infinity/subnormal behavior. Simple transform/query reference tolerances: absolute position1e-4 units, velocity1e-3 units/s and normalized rotation angle1e-4 radians. Invalid inputs must be validated before submitting GPU work; define exact exception/error and mutation/no-write behavior per signature.

Queries observe a documented committed simulation snapshot. A synchronous Raycast cannot secretly return an old result because work is in flight. Callbacks have stable entity identity and enter/stay/exit ordering, execute once per committed step and never mutate authoring state during Play. Destruction timing, scaled/unscaled time, fixed phases, scene activation, async cancellation, references and ownership must agree across eligible backends. Stop cancels outstanding work and releases owned handles/buffers before a new generation can use the same identities.

Cross-device bitwise replay is not promised for floating GPU solvers. Publish same-device deterministic guarantees and cross-backend tolerance/aggregate results separately. Keep query ordering and tie-breaking explicit. Unsupported joints/materials/controllers/queries force a declared CPU fallback or an explicit blocked result; never silently omit bodies or callbacks.

## Workloads

`workloads.json` fixes seeds, dimensions, counts, layout, timestep, warmup and measurement duration. Use separated bodies, stacked contacts, queries/triggers and lifecycle churn; include100/1024/10000-body tiers. The small CPU smoke benchmark is a diagnostic subset and cannot replace the complete duration/contact workload.

Full timing gate: warmup10 simulated seconds, measurement60 simulated seconds, fixed step1/60s, at least5 runs. Report median/p95/p99 end-to-end frame, simulation, bridge, readback, memory, body/contact counts and exact software/device versions. Include a current CPU baseline on the **same device and scene**. CPU/Wasm microbenchmarks and Null FPS cannot prove physical GPU throughput.

For Auto to select GPU, require supported capabilities/features, all scene features eligible, at least20% median end-to-end improvement over CPU, no p99 regression beyond10%, bounded synchronous-query readback p95<=2ms, and no correctness/lifecycle failure. The1024-body reference tier targets p99 simulation<=16.67ms; failing it remains visible and never changes the frozen tier retroactively. Dense-stack aggregate gates: center-of-mass deviation<=1%, kinetic-energy deviation<=5%, p95 penetration<=0.01 scene units, with callback/query correctness independently exact where specified. These thresholds are engineering policy; no current pass is claimed.

## Resources, shaders and fallback

M25.0 supplies WGSL compute compilation, bind/resource layouts, bounds checks, dispatch limits, synchronization and diagnostics before solver kernels. M30 adds shared shader/material infrastructure. Validate actual dispatch and observable results; compiling a shader is insufficient. Budget solver-owned GPU allocation to512MiB for the reference tier and publish actual peaks. Ten Play/Stop/reopen cycles must show no live owned resources after Stop and no monotonic retained allocation beyond5% or64KiB over the warmed baseline.

Device loss, unsupported features or budget exhaustion must preserve a committed state, reject stale readbacks and restore a valid CPU path or stop explicitly. Do not migrate a partially committed step. Tests must include cancellation, failed shader compilation, device loss and resource reuse across generations. Physical GPU acceptance records adapter/vendor/device/driver/browser/OS and timestamp capability; software adapters remain separately labeled.

## Capability and hardware recording

Initial GPU solver eligibility requires a physical WebGPU compute adapter with f32 storage-buffer arithmetic and sufficient advertised limits for the frozen workload. Validate buffer/bind-group/dispatch limits before allocation; optional shader-f16 and timestamp-query cannot be assumed. Use f32 for the initial cross-backend target; precision changes require a new profile. Record limits/features, discrete/integrated/software classification, vendor/device/driver, browser/OS and actual clock/timestamp support. Required future hardware matrix includes at least one physical integrated and one physical discrete adapter plus unsupported-device/CPU fallback. These rows are currently blocked/unmeasured; no specific device is invented as accepted.

The Observatory HTTP endpoint is currently served by the Node product host. The Rust daemon's limited parity profile does not acquire a full domain-service claim through this audit. Metadata and scope files remain usable offline.
