# M3 — Asset Pipeline closure report

Version 0.0.13. Completed 2026-09-26. All seven acceptance criteria pass.

## Outcome

Replacing source bytes preserves asset/entity references, rebuilds affected
resources and refreshes the running editor without navigation. The embedded
versioned Asset DB records logical IDs, source hashes, dependency keys and build
reasons. Persistent derived cache avoids rebuilding unrelated content.

Imports run in bounded background workers, support cancellation and publish one
revision-checked, undoable change. Failed or stale jobs preserve authoring state.
PNG/static GLB support is joined by PCM WAV source metadata. The editor exposes
replacement, texture binding and resource explanations.

## Acceptance matrix

| # | Criterion | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Versioned Asset DB, stable IDs, source hashing | Passed | Source replacement/restart preserve entity and logical asset IDs |
| 2 | Dependency graph, selective builds, persistent cache | Passed | Shared texture and mesh rebuild; independent asset key/cache timestamp unchanged; corrupt cache regenerates |
| 3 | Background jobs, cancellation, revision-safe commit | Passed | Queued receipts, live Ping, cancelled/failed/stale jobs retain state |
| 4 | Image, static GLB and audio importer API | Passed | PNG/GLB resources and bounded PCM WAV metadata; malformed alignment rejected |
| 5 | Texture hot reload without editor restart | Passed | Second API client changes source; browser keeps page identity and draws updated sprite/mesh |
| 6 | whyAssetNotLoaded, whyWasRebuilt, whatUses | Passed | Source checks, persisted reasons and direct/transitive consumers verified |
| 7 | Failure safety, undo/redo, save/restart identity | Passed | Node failure/undo tests and identical post-restart browser pixels |

## Automated evidence

Implementation commit: `869af6d1b9d2525a754b8e65a43e286b83a41156`.
CI: https://github.com/Krozzeo/AxiomEngine/actions/runs/36268402446

All five jobs pass: Linux/Windows bootstrap, Rust, C# Wasm publish and
browser-milestones. There are 42 passing Node tests, 24 Rust tests, 11 schema
documents, three architecture rules and the shared M0 parity checks. Rust fmt,
Clippy with denied warnings and core Wasm checks pass. Browser runs retain M2's
11-action regression flow and add M3 dependency/update/restart assertions.

M3 browser evidence: two resources rebuilt, one independent resource unchanged,
43,553 blue-classified pixels after replacement, stable IDs, same page identity,
verified diagnostics and exact reopened pixels. See m3-browser-evidence.json.
CI artifacts include before-update.png, after-update.png and full editor captures.
Software Vulkan under Xvfb validates behavior, not hardware performance.

Locally, fourteen focused asset/scene tests and schema/architecture/parity checks
pass. The current restricted sandbox could not launch rustc; clean builds and
current Rust/.NET validation are provided by CI, not claimed as local results.

## Manual tests requested

None. The required workflow is covered by automated real-browser execution.

## Limitations

The update path uploads replacement bytes through commands; arbitrary filesystem
paths and OS file watching are not exposed. Texture dependencies bind one imported
PNG to all primitives of a mesh. Import formats retain the bounded M2 static GLB
subset; WAV imports metadata only. Jobs/events are session diagnostics and do not
resume after daemon crashes. Save persists Asset DB and build reasons; source
and cache cleanup/eviction remain future policy. Rendering refresh may reallocate
unchanged GPU buffers even though independent importer outputs are reused.

Node bootstrap is the verified authoring path. Native parity, general schema
code generation, C# gameplay and audio playback are not claimed. Full contract:
../architecture/M3_ASSET_PIPELINE.md; identity decision: ADR-0017.

## Completion and next work

M3: **7/7 = 100%**. M0–M3 are complete. Whole-project estimate:
**5 + 6 + 7 + 6 = 24%** of the weighted roadmap, not a time estimate.
Method: ../architecture/MILESTONE_REPORTING.md.

Next: M4 C# Gameplay Runtime, per ../architecture/M4_PLAN.md. PR #3 is stacked
on unmerged #2 and #1. This closure does not merge main.
