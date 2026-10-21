# M24 — Scenes, resources, asynchronous loading and memory

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M22, M23.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Scene/SceneManager, additive scenes, ownership/activation/events/persistent objects.
- Resources/AsyncOperation/binary resources; actual asynchronous I/O/progress/dependencies and core-inventory asset bundles.
- Unload/handles/CPU-GPU-audio release/reopen and browser/daemon I/O contracts. Addressables is a separate M39 package.

## Planned batches

- 24.1 Scenes/ownership.
- 24.2 Async I/O/resource formats.
- 24.3 Unload/failure/memory.

## Closure criteria

- [ ] Repeated load/unload uses real I/O; resident LoadAsync is not streaming.
- [ ] References/events/persistent objects survive or invalidate at the correct point.
- [ ] Cancellation/failure/memory budgets leave no orphan assets or lost authoring.

## Required editable demo

Streaming Scenes Lab: scene transitions, large resources and memory measurement.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
