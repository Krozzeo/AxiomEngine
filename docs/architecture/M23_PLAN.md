# M23 — Serialization, ScriptableObject and prefabs

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M20, M22.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- ScriptableObject, serialization attributes/callbacks, fields/arrays/lists/structs/references and Unity-supported graphs.
- Polymorphism/managed references and actual JsonUtility semantics, asset identity/cycles/missing references.
- Assigned prefabs/instances/overrides/variants; persistence/migration preserve references and Undo.

## Planned batches

- 23.1 Serialized model/ScriptableObject.
- 23.2 Graphs/callbacks/JSON.
- 23.3 Prefabs/overrides/migration.

## Closure criteria

- [ ] Save/reopen preserves values/identity/relationships, including nested/polymorphic cases.
- [ ] Invalid/incompatible data cannot corrupt projects; earlier versions have tested migration.
- [ ] Do not silently replace JsonUtility restrictions with a different serializer behavior.

## Required editable demo

Save Graph & Prefab Lab: shared ScriptableObjects, overrides and reopening.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
