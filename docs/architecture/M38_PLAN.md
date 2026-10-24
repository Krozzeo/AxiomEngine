# M38 — Editor APIs, assets, extensions and builds

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M20, M23, M24, M30, M33, M37.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- UnityEditor bridge for Editor/EditorWindow/SerializedObject/Property/CustomEditor/PropertyDrawer/Undo and assigned tools.
- AssetDatabase/importers/inspection/selection/gizmos/handles/prefabs/callbacks with real Axiom extensions.
- BuildPipeline/settings/tests/profiling/diagnostics/package management; produce Axiom builds under the compatibility contract.

## Planned batches

- 38.1 Editor extensions/serialization.
- 38.2 AssetDatabase/importers/tools.
- 38.3 Builds/tests/packages.

## Closure criteria

- [ ] Compatible public extension code creates a window/Inspector/tools.
- [ ] Import/reimport/Undo/Redo/rename/save preserve references/projects.
- [ ] A project builds/exports and runs outside the editor; compatible APIs do not imply producing Unity binaries.

## Required editable demo

Editor SDK Lab: custom Inspector, importer and reproducible build.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
