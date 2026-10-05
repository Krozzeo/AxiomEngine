# M15 — Replay, diagnostic replay and entity camera authoring

Version 0.0.28. Complete, 100%. Project: approximately 84% (87/104 roadmap points).

## Delivered

- Bounded controlled input-plan recording, uint32 ReplayRandom seeds, observable
  checkpoints and export/import against exact project/workspace/resource scope.
- Range replay reconstructs the input prefix, including private C# lifecycle state,
  verifies saved checkpoints and re-executes causal diagnostics with source and fresh
  trace provenance. Completion/cancellation release input/runtime and preserve MAIN.
- Human Config replay controls and public replay.control share the M14 runtime.
- Three editable demos: Seeded Input Replay, Collision Diagnostic Replay and
  Animation Checkpoints; actual C#, Rust/Wasm contacts and animator state are covered.
- Six requested AI menu entries, existing proposal review, UTF-8 project master-file
  loading, saved assistant instructions/brief and external MCP context export.
- Editable Camera entity/component with default Audio Listener, Inspector projection,
  FOV/orthographic height/active fields, hierarchical Transform and Scene marker/gizmos.
  File Game Camera is removed; stopped/parallel Game resolves the active entity.
- Explicitly lit 3D/2D starter templates (Camera + listener, light, Cube/Square), direct
  Create Object lists and compatible alpha sprite primitives in production 2D.
- Fixed legacy sunlight/ambient removed; lit meshes use authored light entities.
  HDR environment remains an explicit Config parameter; starters use zero ambient.

## Required acceptance

| Criterion | Result |
| --- | --- |
| Controlled plan recording and actual seeded C# input | Passed |
| Checkpoints, verified ranges and import/export scope | Passed |
| Re-executed collision/script/animator diagnostics and provenance | Passed |
| Bounded public/human controls, cancel, Null and MAIN isolation | Passed |
| Six AI entries and persistent plain master-document loading | Passed |
| Camera Inspector, Transform/physical gizmo, stopped/parallel Game | Passed |
| Explicit lighting, 2D/3D starters and flattened creation menus | Passed |
| Editable demos, all earlier regressions and synchronized closure | Passed |

## Automated evidence

All 25 jobs pass in [CI run 37386247344](https://github.com/Krozzeo/AxiomEngine/actions/runs/37386247344)
on executable commit `6a2e93ba430837f6a2bffeea7fbd59a49a17382d`, tree `e244ffd01da8e2558c23db2d2433d5dbcdcc705b`. Documentation closure is a
separate docs-only commit; delivered executable files match the files validated in this tree.
183 Node tests (177 locally available plus six clean-build server checks), 39 Rust
tests, 18 schema documents, 82 semantic tools, bindings, architecture and daemon
parity pass. CI freshly built Wasm and compiled actual C#; platform development/AOT
and earlier browser gates remain green. M15 browser: 14/14 criteria,
zero page/console errors. See m15-browser-evidence.json. Replay and Camera Inspector
screenshots were visually reviewed. No physical GPU benchmark is claimed.

## User-only manual checks

None. Builds, C#, UI interactions, camera drag, parallel window, stopped Game,
explicit lighting removal, replay and prior regressions have equivalent automation.

## Limits and compatibility

Recording captures explicit input plans, not live Play keyboard sessions. Restoration
re-runs the earlier prefix; it does not deserialize arbitrary .NET heaps or offer
instant seeking. Limits are 600 frames, 64 entities, 11 checkpoints, 30 seconds,
240,000 bytes for recording files and bounded diagnostic payloads. GPU/audio/wall
clocks and arbitrary random/network sources are outside deterministic guarantees.

AI chat/model credentials remain in an external MCP client; the engine shows this
truthfully rather than simulating integrated provider chat. Master files support
plain UTF-8 Markdown/text/JSON up to 32 KiB. Old scene-level Game cameras remain
readable until opting into entity cameras. Old light-free mesh projects need an
explicit light after removing fixed sunlight. Pixel-perfect 2D requires XY-facing
orthographic cameras and derives zoom from reference height/pixels per unit.

## Delivery and next work

Run npm.cmd run demo, then npm.cmd run dev; see demos/M15_GUIDE.md. Preserve your
existing .axiom/projects when moving source folders. PR #18 is ready/open, stacked
on #17; do not merge automatically. M16 is Performance & Low-End Pass: measured
Tier 0 memory/scaling/loading/cache/UI/compiler improvements; see M16_PLAN.md.
