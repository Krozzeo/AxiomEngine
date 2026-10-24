# M28 — 2D CPU/GPU joints and advanced simulation

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M27, M25.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Rigidbody2D/interpolation/sleep/CCD/effectors/simulation settings.
- Inventoried Joint2D families, motors/limits/breaking/connected collisions.
- Validate 2D platforms/vehicles/chains, animation/tile integration and stable performance.
- 2D WGSL GPU backend over M25.0 with 2D solver/constraints and Physics2D/Rigidbody2D integration, CPU/GPU/Auto/fallback and measured comparisons; no dependency on finishing M26 GPU3D.

## Planned batches

- 28.1 Solver/effectors.
- 28.2 Joints/motors/limits.
- 28.3 Mechanics/stress.
- 28.4 GPU2D integration/broadphase/contacts for agreed shapes.
- 28.5 GPU2D solver/friction/restitution/sleep/joints/motors/effectors.
- 28.6 API/queries/events/lifecycle and CPU/GPU stress metrics/diagnostics.

## Closure criteria

- [ ] Each assigned family has force/limit/break scenarios and verifiable results.
- [ ] Pause/body-type changes/deactivation/destruction leave no orphan constraints.
- [ ] Queries/simulation stay coherent between C# and kernel at different fixed steps.
- [ ] Actual 2D GPU shader results match CPU tolerances, preserve the plane and cover contracted queries/events/constraints.
- [ ] CPU/GPU comparison and recovery pass M19 hardware matrix with demos/median/P95; unaccelerated functions stay visible and do not complete the GPU minimum.

## Required editable demo

2D Mechanics Lab: platforms/pendulums/chains/suspension; extend Stress Physics2D and CPU/GPU Physics & Shader Lab.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
