# M35 — NavMesh and complete navigation

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M21, M24, M25.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Triangular NavMesh construction/baking/surfaces/regions/costs/queries.
- NavMeshAgent/obstacles/carving/avoidance/links/full-partial paths and scene ownership.
- Updates/concurrency/visual debugging/scalability; existing grid retains its distinct identity.

## Planned batches

- 35.1 NavMesh/queries.
- 35.2 Agents/links/obstacles.
- 35.3 Updates/crowds.

## Closure criteria

- [ ] Use actual navigation mesh with slopes/multiple floors and obstacles.
- [ ] Agents/partial paths/destination changes/scene unload have verifiable results.
- [ ] Measure baking/crowd budgets; a grid is not NavMesh equivalence.

## Required editable demo

Navigation Crowd Lab: multiple floors, links, dynamic obstacles and agents.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
