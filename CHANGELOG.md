# Changelog

## 0.0.29 — M16 — editor authoring and low-end pass (acceptance in progress)

- Portable authoring files, folders, named C# templates, rename/move/copy/delete and bounded Explorer exports.
- Scoped Project/Hierarchy/component context menus and clipboard; consistent list menus and component boxes.
- Automatic Inspector values, radio templates, menubar title, matched Close icons and Game FPS toggle.
- Indexed/virtualized Hierarchy, cached Wasm modules with isolated worlds, shared resource admission and reusable GPU staging.
- Explicit render scaling, bounded GPU submission and two editable stress/workshop demos.

## 0.0.28 — M15 — verified replay and entity cameras

- Bounded controlled input plans, ReplayRandom seeds, checkpoints and verified range replay.
- Fresh diagnostic provenance, scoped recording import/export and three editable demos.
- Six AI menu options, external MCP context, saved instructions and master-document loading.
- Camera entities with Audio Listener, Inspector projection/pose and stopped/parallel Game.
- Explicitly lit 2D/3D starter templates, direct Object menus and production 2D sprite primitives.
- Removed fixed legacy sunlight; preserved explicit HDR environment configuration.

## 0.0.27 — M14 — automated game testing and editor workspace

- Public isolated game-test controls, exact stepping/input and bounded assertions.
- Saved/importable test suites and Frame Step / Collision / Animation editable demos.
- Parallel Scene/Game targets, persistent tab order/closure and compact headers.
- File/Create/Panels/Config/Help menus and canonical quick-create examples.
- Save toolbar icon with confirmed dirty asterisk and Ctrl+S.


## 0.0.26 — M13.1 workspace and profiler corrections

M13.1 (0.0.26) is complete: six correction groups, 100%. Project progress remains approximately 76% (79/104 roadmap weight points); these corrections do not advance M14.
Profiler captures survive Stop, retain their original session and can be saved,
exported/imported and reopened after reload. Analysis visibly identifies its frame.
Eight tabs drag independently into five fixed dock sections, preserving the old
initial arrangement. Separate windows share selection and canonical editing through
one renderer lease; closing returns their controls. Project layout saves without
publishing unsaved scene edits. Same-tab credentials survive reload; pagehide
releases the old lease. Dev opens the default browser, with a printed-link fallback.
All 23 CI jobs pass at 03607cdf87bef62732b4bb39c432be97f3e79611 (tree ae36db768f7c484a02966442b01c401cdf94b08c).
158 Node tests, 39 Rust tests and nine new browser criteria pass, including all
prior gameplay and C# development/AOT regressions. Final screenshots reviewed.
See docs/reports/M13_1_CURRENT_REPORT.md and demos/M13_1_GUIDE.md.
PR #16 is ready for review, stacked on unmerged #15; do not merge automatically.
Next: M14 automated game testing.

## 0.0.25 — M13 Profiler and explainFrameSpike

M13 (0.0.25) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 76% (79/104 roadmap weight points).
The Profiler tab and readonly semantic tools share bounded frame history,
main/worker/wait scopes, sampled GPU passes and median/MAD spike explanations.
Observed contributor increases are separated from overlapping waits and unavailable
GPU evidence. Pause/Clear never pause the game or mutate authored scenes.
Snapshot loading and late GPU replies cannot contaminate a new session.
Two editable demos include a real C# 140ms pulse and independent 2D pass timing.
All 22 jobs in CI run 37259458544 pass at executable commit
0ef4db00bf6b6bc4ec4d016b5d5ddd3f31b02190 (tree 4b247daa5f2a5786ca2ad002cd3f8cb4fdc4118d).
152 Node and 39 Rust tests, eight new browser criteria and earlier regressions pass.
Final profiler screenshots were reviewed. No user-only test remains.
Read docs/reports/M13_CURRENT_REPORT.md, docs/architecture/M13_PROFILER.md,
ADR-0026 and demos/M13_GUIDE.md. Next: M14 automated game testing.
PR #15 is ready for review, stacked on unmerged #14; do not merge automatically.

## 0.0.24 — M12 Audio

M12 (0.0.24) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 75%.
Optional AudioSource/AudioListener, spatial pan and attenuation, mixer buses,
lowpass filters and master dynamics work through Web Audio. Long PCM WAVs stream
through bounded AudioWorklet queues. Human/C#/AI runtime controls are transient;
canonical editing preserves revisions, Undo/Save and isolated proposals.
Stopped previews are silent. Scene and simulation pause preserve transport;
Stop resets it. Null and browser activation expose truthful unavailable reasons.
All 21 jobs in CI run 37245601863 pass at executable commit
aef19432107a017de935319f94d443390972aed1 (tree 178e257f6ffc86e5d1909b274d9a0462c031c6de).
144 Node and 39 Rust tests, ten new browser criteria and earlier regressions pass.
Actual graph signal, stereo pan, pause, streaming and lowpass were measured.
Final screenshots were reviewed. No user-only test remains.
Read docs/reports/M12_CURRENT_REPORT.md, docs/architecture/M12_AUDIO.md,
ADR-0025 and demos/M12_GUIDE.md. Next: M13 profiler/explainFrameSpike.
PR #14 is ready for review, stacked on unmerged #13; do not merge automatically.


## 0.0.23 — M11 General Animation

M11 (0.0.23) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 72%.
General GLB animation includes skeletons/skins, rigid TRS clips, Rust playback,
shortest-path rotation interpolation, crossfades and bounded state machines.
Animator Inspector, C# and AI controls share observed runtime state; canonical
editing retains revisions, Undo, Save and isolated proposals. WebGPU skinning
works in legacy/HDR, and Null consumes the same Rust poses. Pixel-perfect Scene
uses nearest texture filtering while preserving its free editor camera.
All 20 jobs in CI run 37239883665 pass at executable commit
cc4b072cef49ffe7b9e9d8b9aea4a095275f8172 (tree c265d3894305fae4973816320eb08bee6d2d0f8f).
135 Node and 39 Rust tests, nine new browser criteria and earlier regressions pass.
Final software WebGPU/Null screenshots were reviewed. No user-only test remains.
Read docs/reports/M11_CURRENT_REPORT.md, docs/architecture/M11_ANIMATION.md and
demos/M11_GUIDE.md. Next: M12 audio, per M12_PLAN.md/master section 131.
PR #13 is ready for review, stacked on unmerged #12; do not merge automatically.


## 0.0.22 — M10 2D Production Foundation

M10 (0.0.22) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 68%.
Opt-in 2D includes atlas batching, editable tilemaps, Rust/Wasm sprite animation
and seeded particles, pixel-perfect Game preview, radial lighting and screen UI
pause/resume. Inspector and agent tools share revisions, Undo, Save and isolated
proposals. Existing legacy/HDR rendering remains compatible.
All 19 jobs in CI run 37224306330 pass at executable commit
a332e8fcb1017d87fd82f3feafcb3fc1709ae831 (tree a1d0c786e520e7f3d4955303844c76323a23c3f8).
127 Node and 36 Rust tests, eight new browser criteria and earlier regressions pass.
Final software WebGPU/Null screenshots were reviewed. No user-only test remains.
Read docs/reports/M10_CURRENT_REPORT.md, docs/architecture/M10_2D.md and
demos/M10_GUIDE.md. Next: M11 general animation, per M11_PLAN.md/master section 130.
PR #12 is ready for review, stacked on unmerged #11; do not merge automatically.


## 0.0.21 — M9.2 Editor Refinements

- Outward sphere/capsule winding and derived repair of exact old M9.1 sources.
- Ctrl+Y Redo, Delete selection, Move arrows and atomic group transforms.
- Ctrl selection toggles and visible Shift ranges; root drop and sibling ordering.
- Compact framed Hierarchy, searchable components last and Transform first.
- Separate Collider/RigidBody forms and parameters.
- Automatically saved resizable project panels without publishing dirty scenes.
- Compact project folder tree/file icons, lateral menus and right-aligned Clear.
- Refreshed M9.2 demos preserve old projects; Spanish controls guide included.
- 119 Node/33 Rust tests, 15 correction browser criteria and all 18 CI jobs pass.
- M9.2: 100% (12/12); approximate weighted project completion remains 62%.

## 0.0.20 — M9.1 Editor and Angular Physics Corrections

- Focus-based camera orbit and corrected Rotate direction.
- Optional components/scripts, File/Settings menus and project-scoped explorer.
- Expandable hierarchy, Alt multi-selection, world-preserving batch parenting and native drag/drop.
- Separate Clear action, Ctrl+Z and nine imported 2D/3D primitives.
- Live light previews and entity-rotated directional/spot lights.
- Owned Rust/Wasm OBB contacts, inertia, angular impulses and quaternion integration.
- Three editable demos; existing projects remain preserved.
- 112 Node/33 Rust tests and all 18 CI jobs pass, including all browser/C# regressions.
- M9.1: 100% (12/12); approximate weighted project progress remains 62%.

## 0.0.19 — M9 Renderer Production Foundation

- Canonical PBR/light/LOD/HDR components, commands, Undo and Inspector forms.
- HDR rendering, tile lighting, instancing, CPU/GPU culling and postprocessing implemented.
- Editable PBR Gallery and Instancing/LOD Lab, with real browser/Inspector acceptance.
- Smooth GLB normals and bounded PBR import parameters; isolated GPU readback epochs.
- 102 Node tests and M2–M9 browser acceptance pass; all earlier regressions retained.
- CPU/GPU golden parity, actual GPU readback and light/shadow/post pixel effects verified.
- Optional favicon requests return 204; missing static resources correctly return 404.
- Full 17-job CI, including Linux C# development/AOT and Windows development, passes.
- M9: 100% (8/8); approximate weighted whole-project progress: 62%.

## 0.0.18 — M8 Causal Diagnostics and Scene authoring

- Game previews the saved camera independently of Play; Scene owns a transient camera.
- Triangle picking, bidirectional selection, projected bounds and move/rotate/scale gizmos.
- One-drag Undo, Escape cancellation, world/local axes and stable SVG pointer handling.
- Orbit/pan/zoom/fly/framing, global XYZ alignment and editor projection controls.
- Diagnostics tab, four causal queries, bounded Decision Graphs and opt-in deep traces.
- Ten injected faults, explicit expired/stale/evicted evidence and actual loader/script errors.
- Editable M8 Scene Workshop and Diagnostic Lab alongside the two physics samples.
- Atomic GPU/kernel/draw replacement and isolated browser CI jobs.
- 94 Node tests, 30 Rust tests, 16 schemas, 51 semantic tools and M2–M8 browser acceptance.
- M8: 100% (8/8); weighted whole-project completion: approximately 54%.

## 0.0.17 — M7 Physics Foundation

- Owned Rust CPU/Wasm 2D/3D translational physics and deterministic fixed steps.
- Broad/narrow phases, gravity, impulses, friction, triggers, layers and raycasts.
- Physics Inspector, generated C# velocity bindings and isolated Play.
- Editable 2D playground and 3D falling-block demos via npm run demo.
- Component removals now persist while unknown extension fields are retained.
- 71 Node tests, 30 Rust tests and M2–M7 browser acceptance.
- M7: 100% (8/8); weighted whole-project completion: approximately 48%.

## 0.0.16 — M6 Transactional AI Workspaces complete

- Immutable snapshots, isolated COW proposals and bounded causal action logs.
- Human diff review, preview, continue, acceptance and complete overlay rejection.
- Proposal-scoped assets/scripts, revision conflicts and failed-publication rollback.
- Idle proposal restart recovery; acceptance is one undoable draft, Save persists.
- Eight new workspace tests; 68 Node/25 Rust tests and all ten CI jobs pass.
- Actual Chromium/MCP/C# acceptance, rejection and saved restart verified.
- M6: 100% (8/8); weighted whole-project completion: approximately 41%.

## 0.0.15 — M5 AI Control Layer complete

- Generated semantic tools and component schemas, introspection and MCP stdio.
- Bounded project/scene/entity/asset queries, context budgets and event/error deltas.
- Revision-safe component attachment and external-edit synchronization to the editor.
- Real WebGPU PNG capture with bounded same-frame semantic context and lease checks.
- Complete external MCP scene workflow without editor clicks; 60 Node/25 Rust tests.
- M5: 100% (8/8); weighted whole-project completion: approximately 36%.

## 0.0.14 — M4 C# Gameplay Runtime

- Generated C# Transform bindings, lifecycle, Input, movement, spawning and logs.
- Fixed daemon compilation with source diagnostics, cancellation and revision checks.
- Disposable .NET workers, Play recompilation/reset, saved bundles and timeout recovery.
- Runtime spawning during Update preserves the Rust world clock.
- Actual development/AOT execution and complete Chromium editor acceptance.
- 53 Node tests, 25 Rust tests and existing M2/M3 browser regressions pass.
- M4: 100% (8/8); weighted whole-project completion: approximately 30%.

## 0.0.13 — M3 Asset Pipeline complete

- Stable asset source revisions, explicit texture dependencies and versioned derived cache.
- Background imports, bounded jobs, cancellation and revision-safe publication.
- PCM WAV source metadata, resource explanations and editor hot reload.
- 42 Node tests, 24 Rust tests and five CI jobs pass; browser M2/M3 gates pass.
- M3: 100% (7/7); weighted whole-project completion: approximately 24%.

## 0.0.12 — M2 Beta Foundation complete

- PNG/static GLB imports, content-hashed project assets and placement commands.
- Real project rendering with Rust runtime transforms/cameras, textured sprites,
  simple mesh materials, directional light and depth testing.
- Isolated Play/Stop, explicit Close and preserved GPU/Null diagnostics.
- Full Chromium acceptance flow with rendered-pixel and restart comparisons.
- Five CI jobs pass, including all eleven browser acceptance actions and Null parity.
- M2: 100%; weighted whole-project completion: approximately 18%.

## 0.0.11 — M2 editor authoring integration

- Added project controls, entity hierarchy and name/position/scale Inspector.
- Added revision-checked scene commands with 64-entry undo/redo and explicit save.
- Protect dirty drafts from project switching and stale clients.
- Added seven tests; 34 Node and 22 Rust tests pass locally.
- M2 is 2/11 acceptance points (18.2%); whole-project completion is about 12.3%.
- Project entities are not rendered yet; the viewport identifies its kernel demo.

## 0.0.10 — M2 project persistence foundation

- Added versioned project documents with stable IDs and validated transforms.
- Added bootstrap Command Bus create/open/save/list with atomic replacement,
  cross-process locks, persisted revision conflicts and unknown-field retention.
- Added seven tests for restart, corruption, concurrent writes and HTTP security.
- Added Windows bootstrap CI coverage; native project commands and editor controls
  remain pending. M2 end-to-end acceptance remains 0/11.

## M1 closure

- GitHub Actions CI #3 passed bootstrap, Rust and C# Wasm jobs on commit
  0ecbc4bb4c8576d0b716dd68740257f5df256f40.
- Closed all seven M1 criteria with local tests and user browser evidence.
- Activated M2 as not started; whole-project evidenced completion is 11%.

## M1 browser acceptance evidence

- Recorded successful Windows startup after Cargo discovery correction.
- Recorded user WebGPU and Null screenshots with Wasm frame traces and timings.
- All seven functional criteria pass; formal closure awaits current remote CI.

## 0.0.9 follow-up — Cargo discovery

- Fixed Windows startup when Node cannot find Cargo on PATH: use cargo.exe and
  fall back to CARGO_HOME/bin and the user rustup installation.
- Preserve actual compiler failures; report AX_BUILD_0001 only when Cargo cannot
  be located. Twenty Node tests pass, including four discovery regressions.

## 0.0.9 — Rust/Wasm browser integration

- Added a versioned scalar Wasm bridge with explicit world lifetime and trace IDs.
- Moved demo mesh and perspective camera extraction to Rust; WebGPU uploads the
  returned clip vertices instead of generating a triangle inside its shader.
- Added a real Wasm Null path for missing GPU, forced Null mode and device loss.
- Added Wasm compilation to the editor build and installed its toolchain in CI.
- Allowed Wasm compilation in both CSPs while keeping JavaScript eval blocked.
- Passed 16 Node tests (including real Wasm/editor Null integration) and 22 Rust tests.
- Updated handoff, ABI ADR and M1 report; physical GPU validation remains open.

## 0.0.8 — WebGPU + Engine Kernel foundation

- Added DOM-free entity, transform and camera scene primitives.
- Added fixed/variable engine clocks, traced jobs and generational resources.
- Added a dependency-ordered render graph and same-scene Null Renderer processing.
- Added bounded CPU frame traces and optional WebGPU timestamp sampling in the editor.
- Added two browser-profiler tests; the Node suite now passes 12 tests.
- Installed the pinned Rust 1.90 toolchain in the agent workspace and passed all
  20 Rust tests, formatting, Clippy and the Wasm target check.
- Fixed JavaScript module delivery and stopped the frame loop on device loss.
- Corrected the active M1 name and scope against the authoritative master specification.

## 0.0.7 — Milestone 0 closure

- Recorded green GitHub Actions CI #1 for commit `16c065c` in 69 seconds.
- Closed all eight M0 acceptance criteria and advanced the active milestone to M1.
- Raised evidence-based whole-project completion to 5%.
- Added explicit LF/CRLF repository normalization policy.
- Reconciled machine-readable state, closure report, README and AI handoff.

## 0.0.6 — Reproducible native gate

- Committed the generated Cargo v4 lockfile for 94 third-party dependencies.
- Enforced `--locked` in local scripts, documentation and CI compile/test gates.
- Recorded the fully green Rust format, Clippy and nine-test workspace gate.
- Recorded the native Chrome protocol, isolation, command and health smoke test.
- Raised evidenced M0 completion to 88%; remote CI is the only open criterion.

## 0.0.5 — Native Clippy patch and C# Wasm evidence

- Fixed all four Clippy findings from the first compiled native daemon gate.
- Recorded that the Rust workspace compiles through `axiom-daemon` before
  deny-level lint evaluation.
- Recorded the successful .NET 10 C# browser-Wasm Release publish with zero
  warnings and errors.

## 0.0.4 — Native gate formatting patch

- Applied the exact Rust 1.90 `rustfmt` output across all workspace crates.
- Recorded the successful `axiom-core` `wasm32-unknown-unknown` check from the
  Windows evidence machine.
- Recorded Rust 1.90.0 and .NET 10.0.400 availability without claiming the
  still-pending native daemon and C# Wasm gates.

## 0.0.3 — Native daemon adapter

- Replaced the Rust daemon shell with a loopback-only Axum HTTP adapter.
- Ported handshake, static delivery, commands, events, traces and metrics.
- Ported token/origin enforcement, Fetch Metadata fallback, body limits and
  cross-origin isolation headers.
- Added nine shared command parity vectors executed by Node and Rust tests.
- Added a static adapter-surface gate for endpoints, codes and security policy.
- Kept the verified Node adapter as the default until pinned Rust CI is green.

## 0.0.2 — Clean-extraction startup fix

- Made `npm run dev` build the editor automatically.
- Made direct daemon startup rebuild missing editor assets defensively.
- Added a regression test that removes `dist/editor`, starts the daemon and
  verifies the editor HTML is served.
- Updated the handoff and milestone report with the packaging incident.

## 0.0.1 — Milestone 0 bootstrap

- Established the repository, architecture manifest, schemas and ADR process.
- Added the secure browser-to-daemon command/event/trace walking skeleton.
- Added atomic scoped writes, bounded diagnostics, undo and revision conflicts.
- Added the WebGPU triangle/Null Renderer spike and device-loss diagnostics.
- Added Rust engine/daemon boundaries and the C# browser-Wasm risk spike.
- Added CI, architecture enforcement and seven locally passing tests.
- Added a fixed milestone reporting and weighted project-completion method.
- Added context-free AI handoff documentation and machine-readable project state.
- Fixed same-origin browser handshakes that omit `Origin` while retaining token
  and Fetch Metadata checks.
- Fixed Windows tool discovery in `doctor`; Git remains optional by design.
