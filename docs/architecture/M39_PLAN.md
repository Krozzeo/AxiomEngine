# M39 — Remaining modules, packages and full conformance

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Close residual M19 members including accessibility/utilities/services/modules outside earlier families.
- Versioned adapters for M19-selected Input System/Addressables/Timeline/text/UI/Transport/Netcode/Jobs/Collections/Burst/ECS/other packages; measure separately from core.
- Broad migration corpus and final signature/platform audit; repair differences/overloads/regressions.
- CPU/GPU physics/shader conformance including acceleration/fallback/precision/replay/platform matrix; CPU execution is not GPU acceleration.

## Planned batches

- 39.1 Explicitly owned residual modules.
- 39.2 Versioned packages/backends.
- 39.3 Full audit/published coverage.
- 39.4 Cross-backend physics/shader conformance and profile restrictions.

## Closure criteria

- [ ] Future target: >=95% of frozen core public signatures verified and 100% P0; not current coverage.
- [ ] Retain complete denominator, obsolete/excluded/partial/blocked APIs; do not remove them to reach target.
- [ ] Packages/platforms have separate metrics/corpus/exact differences; blocked targets keep milestone open.
- [ ] M26/M28/M30 provide required GPU and fallback evidence; partial/blocked functions remain visible and prevent affected closure.

## Required editable demo

Compatibility Gallery: migrated reference projects and reproducible family/package corpus.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
