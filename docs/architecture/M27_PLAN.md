# M27 — 2D physics geometry and queries

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M20, M21, M22.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Assigned Capsule/Polygon/Edge/Composite/other Collider2D, materials and TilemapCollider geometry with M34.
- Complete Physics2D, ContactFilter2D, casts/overlaps/distances/contacts and physics scenes.
- Align scale/rotation/depth/normals/units, native representation and C# bridge.
- CPU2D reference corpus for M28 GPU: plane/shapes/filters/triggers/queries, with explicit snapshot/readback contract rather than hidden stale results.

## Planned batches

- 27.1 Geometry/materials.
- 27.2 Queries/filters/contacts.
- 27.3 Integration/precision.

## Closure criteria

- [ ] Polygons/edges/capsules collide and answer measured queries.
- [ ] Layer/depth/normal/trigger filters and overloads covered.
- [ ] Degenerate cases/limits preserve state with useful errors.
- [ ] Reusable 2D contact/query corpus/tolerances for M28; this is not GPU backend implementation.

## Required editable demo

2D Collider & Query Lab: polygons, edges, filters and sweeps.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
