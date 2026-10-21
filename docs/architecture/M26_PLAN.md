# M26 — 3D CPU/GPU advanced solver and controllers

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M25.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Rigidbody, center of mass/inertia/interpolation/automatic sleep/CCD/solver configuration.
- Inventoried joints/articulations, CharacterController and WheelCollider/vehicles with real behavior.
- Separate topology creation from stable simulation; measure stability/throughput. Cloth belongs to M34 with physics integration.
- Optional WebGPU physics using production WGSL from simple bodies through broadphase/contact/solver/constraints; coherent C#/queries/events/render and measured CPU/GPU/Auto selection/fallback.

## Planned batches

- 26.1 Dynamics/interpolation/CCD.
- 26.2 Joints/articulations.
- 26.3 Characters/vehicles/stress.
- 26.4 3D GPU prototype: gravity/integration/rotation/simple bodies using M25.0.
- 26.5 GPU broadphase/narrowphase/pairs/contacts/filters and shape budgets.
- 26.6 GPU contact solver/friction/inertia/sleep/islands/constraints/API and stable CPU/GPU benchmark.

## Closure criteria

- [ ] Joints/controllers/vehicles have behavior and stability assertions.
- [ ] Fast/angular cases validate actual CCD modes and limits.
- [ ] Stress measures stable simulation/memory/regression, not universal FPS from maximum capacity.
- [ ] Accelerated scope performs real GPU physics within CPU tolerances, including queries/events/activation/topology; fallback/limits visible.
- [ ] Same CPU/GPU scenario, backend/reason, complete-system median/P95 and physical hardware evidence per M19; CPU cannot replace required GPU minimum.

## Required editable demo

3D Mechanics Lab: ragdoll/character/vehicle/stress; extend Stress Physics3D and CPU/GPU Physics & Shader Lab.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
