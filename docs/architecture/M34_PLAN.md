# M34 — 2D/3D worlds, particles, terrain and video

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M24, M25, M27, M30, M31, M32.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete sprites/atlases/tilemaps/tile collision, LOD/culling/world construction.
- Actual ParticleSystem/trails/lines/Terrain/vegetation/wind/Cloth simulation/rendering.
- VideoPlayer and audiovisual synchronization; external VFX/Terrain packages separately inventoried where applicable.

## Planned batches

- 34.1 Sprites/tilemaps/LOD.
- 34.2 Particles/Terrain/wind/Cloth.
- 34.3 Video/synchronization/budgets.

## Closure criteria

- [ ] C# tile/terrain/particle edits/queries change actual simulation/pixels.
- [ ] Representative Cloth/collision/LOD/resources tests expose limits.
- [ ] Video/audio respect play/seek/pause/unload; formats depend on declared backends.

## Required editable demo

World Systems Lab: 2D map, 3D terrain, particles, cloth and synchronized video.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
