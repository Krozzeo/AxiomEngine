# GPU physics and shader development plan

Owner scope decision2026-10-19. **Planned, not implemented;0% new acceptance.** Original executable baseline0.0.49/SDK 8/CI315; see current implementation status for newer candidates. Planning does not enable GPU physics, resolve dense performance or implement unrelated UI fixes.

## Decision and result

ADR0009 already proposed measured CPU-first hybrid physics; ADR0006 chooses WGSL and M30 included shader/compute/readback. This extension makes2D/3D GPU work explicit required batches with owners/dependencies/acceptance. Current roadmap keeps45 main milestones,23 historically closed/22 pending after M18.4; earlier pre-closure counts are historical. M40 stays final. Nine new sub-batches do not add main milestones or API credit.

Provide optional WebGPU2D/3D physics with production WGSL compute, CPU/GPU/Auto selection and complete CPU/Wasm fallback. Choose GPU based on capability, supported scene features and measured benefit, without requiring CUDA/vendor. A future native backend belongs to M37 with separate evidence. CPU remains necessary without compatible GPU, for small/unsupported scenes and strict replay. Keep incompatible scenes on CPU with visible reason; do not split mutually colliding bodies into separate CPU/GPU worlds without a verified interaction algorithm.

## Required batches

| Batch | Delivery | Dependencies / acceptance |
| --- | --- | --- |
| M19.3 expanded | CPU/GPU functions/queries/events/precision/selection/hardware matrix; freeze workloads/thresholds/budgets | Audit first; no invented FPS/percentages |
| M25.0 new | Shared buffers/layouts/dispatch/synchronization/ownership/async readback/limits/device loss/cache/WGSL diagnostics; measure/reduce C#-JS bridge | M19/M21/M22/M24; before M26/M28 GPU, no need to finish M30 |
| M26.4 new | Limited3D gravity/velocity/rotation/simple bodies/floor prototype, first WGSL kernels and explicit selection | CPU base and M25.0; partial prototype, not complete solver |
| M26.5 new | GPU broadphase/pairs/contacts/narrowphase for contracted3D shapes, capacity/filter handling | M26.4 and verified CPU geometry; explicit unsupported-shape fallback |
| M26.6 new |3D contacts/friction/restitution/inertia/sleep/islands/constraints, CCD/joints/controllers per matrix, queries/callbacks/scripting | M26.5 and CPU batches; stable tolerance scenarios/full benchmark |
| M28.4 new |2D-specific integration/broadphase/contact kernels for circles/boxes/contracted shapes preserving plane | M27/M25.0; independent of completing GPU3D |
| M28.5 new |2D solver/friction/restitution/sleep/joints/motors/limits/effectors | M28.4 and CPU2D batches;3D kernels do not imply2D semantics |
| M28.6 new | Physics2D/Rigidbody2D API, queries/events/create/destroy/activation and CPU/GPU comparison/stress | M28.5; same scene/corpus in both backends |
| M30.4 new | Shared render/compute shader resources/cache/variants/validation/source diagnostics/safe recompilation/tests and assigned Shader/ComputeShader APIs | Reuse M25.0; retain graphics shader/language/pipeline scope |
| M39.4 new | Cross-backend inventory conformance; publish accelerated/partial/fallback/blocked capabilities | Accepted M26/M28/M30; compile-only backends gain no credit |
| M40.2 expanded | Real hardware/tiers, absence/loss/memory/long sessions/install/recovery | Cannot close with pending GPU gates or Null evidence |

M25 gains M24 resource-lifecycle dependency; M28/M30 depend on shared M25 foundation. M25.0 may ship before remaining geometry and before full M30, so there is no reverse cycle. Independent CPU work can proceed. Current editor/render/CPU/bridge issues remain separate work; the prototype is evaluated before expanding the solver.

## Production kernels

Develop active-body/state management, force/velocity/position/orientation integration; spatial bounds/broadphase structures/pair/contact generation/compaction with bounded counters; contracted2D/3D narrowphase/filters/triggers/materials; iterative contact/constraint solving with explicit parallel order/barriers/concurrency, sleep/wake/islands; assigned GPU queries/result/event extraction. A CPU mirror query is not a GPU query.

Each kernel has versioned WGSL, recorded layout/variants, memory/work limits, source-linked diagnostics and functional tests. Physics shaders do not replace graphics shaders. No universal HLSL/ShaderLab translation or Shader Graph is implied by compute.

## Scripting/render/replay contract

Preserve common C# facade/fixed step; Axiom backend controls are extensions, not Unity members. Synchronous properties/queries correspond to the documented tick, never hidden stale data. Keep simulation on GPU/reuse for drawing when viable; reduce whole JSON snapshots/allocations/readback and measure C#-JS overhead as well as kernels.

Bound query/callback readback and synchronization. If a mode cannot preserve its contract, use whole-scene CPU fallback or record a blocker, never fake success. Switch at a safe tick boundary with coherent bodies/velocities/rotations/constraints/state, no duplicate events or silent reset. Report actual backend/reason/capabilities/memory/dispatch/CPU-GPU/readback times and combined budgets; no unlimited bodies/contacts.

Define numeric/stability tolerances; no cross-vendor bitwise identity promise. Strict replay keeps CPU/Wasm. GPU replay records backend/config/kernel version/hash/comparison policy. Device loss either recovers to verified coherent CPU state or pauses with diagnostic. Test Play/Stop/scene switches/Always active/activation/destruction during simulation.

## Demos and acceptance

Extend editable Stress Physics2D &3D API Lab and add CPU/GPU Physics & Shader Lab through real engine APIs, not demo-only solvers. Compare identical scene/seed/fixed step, show backend/reason and preserve authored state on Stop.

Initial loads16/64/256/1024/4096 bodies within declared budgets: scattered falling/dense stacks/sustained contacts/joints/fast bodies/triggers/raycasts/topology changes. Compare same render/scripts/physical quality. Measure isolated physics and complete editor/game, phase times/FPS/median/P95/create-delete/memory/transfer. Never secretly reduce iterations/precision to claim acceleration.

M19 freezes duration/warmup/repetitions/hardware/tiers/improvement/stability thresholds before evaluation. Auto needs demonstrated benefit on declared workloads; compilation alone is not performance acceptance. Physical GPU evidence requires at least one integrated and one dedicated device from different vendors within the supported matrix. Software-WebGPU CI is regression evidence only; unavailable hardware is a blocked gate, not pass.

Negative tests: forced CPU, absent/incompatible GPU, memory limits, invalid shader, device loss and failed recovery. Null proves only fallback/CPU behavior. C# development/AOT/Windows, native/Wasm and query/event/lifecycle corpus pass per profile. Required GPU minimum cannot be completed entirely through CPU fallback; unsupported functions remain visible. No promised date/FPS multiplier; M19/prototype measure effort/benefit and M26/M28 cannot close without required function/stability/hardware evidence.

[Roadmap](ROADMAP_M19_M40.md), [manifest](roadmap-v2.json), [ADR0009](../adr/0009-cpu-first-hybrid-physics.md), [ADR0006](../adr/0006-wgsl-native-shaders.md), [ADR0033](../adr/0033-gpu-physics-and-shader-roadmap.md), [WebGPU](https://www.w3.org/TR/webgpu/), [historical CPU measurements](../reports/M18_3_11_CURRENT_REPORT.md).
