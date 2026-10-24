# M40 — Final stabilization, product and end-to-end acceptance

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M18.4, M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38, M39.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Move the entire former M19 scope here: stability/performance/docs/examples/onboarding/safe mode/crash recovery/migrations/project health/tiers.
- Resolve expansion regressions including intermittent M18.2 Apply timeout; clean install/corruption/interruption/recovery.
- Master-spec end-to-end2D/3D sample with human-reviewed AI enemy following/taking damage/feedback and full evidence.
- CPU/GPU hardening: absence/device loss/resources/memory/long sessions/safe backend transition/replay; complete editor/physics performance on integrated and dedicated GPUs from different vendors per M19.

## Planned batches

- 40.1 Installation/recovery/migrations.
- 40.2 Performance/stability/platform matrix, CPU/GPU shaders/device loss/transfer/readback.
- 40.3 End-to-end sample/AI/docs/release.

## Closure criteria

- [ ] M18.4 and M19–M39 accepted with evidence; pending exclusions cannot masquerade as passed tests.
- [ ] Full sample runs in declared tiers with reproducible builds/stability/representative measures.
- [ ] Agent inspects/edits/compiles/runs/verifies/repairs/measures and presents reviewable proposal; required account/hardware acceptance uses real evidence.
- [ ] GPU physics/shaders/CPU fallback have real per-tier evidence; software WebGPU/Null cannot replace hardware or close a hardware blocker.

## Required editable demo

Original Axiom End-to-End Sample from master-spec sections 138–139, expanded with SDK conformance.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
