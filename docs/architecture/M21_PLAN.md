# M21 — Mathematics, geometry and utilities

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M19, M20.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete vectors/quaternions/matrices/colors/rectangles/bounds/planes/rays, integer types and inventoried conversions.
- Assigned Mathf, reproducible Random, interpolation, curves, gradients and geometry; equality/tolerance/float-double follow M19.
- Validate zero, singularities, large coordinates and documented NaN/infinity behavior.

## Planned batches

- 21.1 Types/operators.
- 21.2 Matrices/spaces/geometry.
- 21.3 Curves/random/precision.

## Closure criteria

- [ ] Reference vectors and algebraic properties cover normal and degenerate cases.
- [ ] Seeds/curves/conversions reproduce across supported .NET/Wasm configurations.
- [ ] Quantify allowed numeric differences per member; matching names do not prove equivalence.

## Required editable demo

Math & Geometry Lab: inspect matrices, rays, curves and random sequences.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
