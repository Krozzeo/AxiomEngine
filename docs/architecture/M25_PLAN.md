# M25 — 3D physics geometry, queries and compute infrastructure

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M20, M21, M22, M24.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete primitive/capsule/compound/mesh/convex/terrain colliders, physics materials and collider transforms.
- Assigned raycasts/sweeps/overlaps/filters/contacts/overloads and physics-scene queries.
- Choose backend/units/tolerances/budgets; extend/replace solver through an evidence-backed ADR.
- Shared WebGPU compute/WGSL buffers/layouts/dispatch/synchronization/readback/cache/diagnostics/capabilities/device loss. Measure/reduce C#-JS bridge cost; retain CPU/Wasm.

## Planned batches

- 25.0 Shared WGSL compute resources/synchronization and CPU/bridge benchmark; no dependency on completing M30.
- 25.1 Backend/geometry/materials.
- 25.2 Queries/filters.
- 25.3 Contacts/scenes/performance.

## Closure criteria

- [ ] Queries verify distances/normals/layers/triggers on reference geometry.
- [ ] Scale/rotation/parenting/limits yield documented results or explicit errors.
- [ ] Native/Wasm/C# cover the same cases and report precision/cost.
- [ ] M25.0 runs real verified WGSL kernels, releases resources and exposes failures/baselines; reused by M26/M28/M30 without dependency cycle.

## Required editable demo

3D Collider & Query Lab: capsules, meshes, compounds and sweeps.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
