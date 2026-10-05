# Implementation status

Last updated: 2026-10-05. Version 0.0.26.

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

Historical M13 baseline:
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

## Implemented and verified

- Secure loopback Node daemon with Origin/token checks and scoped file operations.
- Versioned command envelopes, capability handshake, causal events/traces,
  revisions, bounded history and stable resource identity.
- Rust/Wasm core clocks, runtime instances, model/camera matrices and Null Renderer.
- Project create/open/save/close; schema-backed documents and atomic persistence.
- PNG/static GLB import, immutable content-hashed sources and sprite/mesh placement.
- Project/Hierarchy/Inspector/Scene/Game/Console with real state, transform editing,
  undo/redo, explicit dirty handling, perspective and orthographic cameras.
- WebGPU project rendering: textured sprites, simple mesh materials, basic light,
  depth testing, optional GPU timings, bounded diagnostics and device-loss fallback.
- Play/Stop compiles an isolated runtime; edits are blocked and authoring is preserved.
- Native Rust M0 HTTP/security adapter and shared protocol parity tests.
- Stable asset source revisions, embedded Asset DB, dependency-derived cache,
  background workers, cancellation, hot reload and resource explanations.
- M12 PCM WAV playback, listener/spatial pan, mixer buses/filters, bounded streaming and diagnostics.
- Generated C# Transform bindings, fixed compiler jobs, diagnostics and cancellation.
- Dedicated .NET worker lifecycle, Transform/Input/movement/spawning/logging.
- Compile/reload during Play, saved bundles and timeout/failure isolation.
- Measured development and release AOT runtime foundation.

- Generated semantic tool schemas, introspection and MCP stdio adapter.
- Bounded project/scene/entity/asset queries, event/error deltas and context budgets.
- Revision-safe component tools and automatic external-edit editor synchronization.
- Renderer-owned color screenshots paired with bounded same-frame semantic context.

- M6 isolated proposals, human review/accept/reject and restart recovery.
- M7 CPU/Wasm translational physics, C# velocity control and editable physics demos.
- M8 independent Scene/Game views, stopped Game preview and transient editor camera.
- Triangle picking, synchronized selection, projected bounds and undoable move/rotate/scale gizmos.
- Orbit/pan/zoom/fly/framing, global XYZ alignment and editor projection controls.
- Visible Diagnostics, four evidence-backed questions, bounded graphs and opt-in retained traces.
- M8 Scene Workshop and Diagnostic Lab, generated through normal project commands.
- M9 PBR/HDR, three light kinds, primary PCF shadow, tone mapping and analytic environment.
- Forward+ light tiles, shared geometry instancing, actual compute/indirect culling and mesh LOD.
- Bounded pipeline/resource caches, bloom/edge smoothing, quality fallbacks and truthful Null evidence.
- Canonical material/light/LOD/HDR Inspector and AI commands with Undo/proposal isolation.
- Editable M9 Gallery and Instancing/LOD Lab, preserving the four earlier demos.

- M9.1 focus orbit, corrected Rotate, optional components/scripts, menus/tree/explorer.
- Alt multi-selection, native batch parenting, shortcuts and nine imported primitives.
- Rust/Wasm oriented contacts/angular integration and live entity-rotated lights.
- Three new correction demos, preserving the six earlier projects.

- M9.2 outward primitive normals and exact legacy-source derived repair.
- Ctrl/Shift selection, atomic group transforms, ordered root/tree drag/drop.
- Inspector search/order, separate Collider/RigidBody, Move arrows and Ctrl+Y/Delete.
- Project tree/icons, lateral menus, right Clear and automatically persisted panel sizes.
- Resized canvas keeps its aspect ratio and correct hit coordinates.

## Current evidence

Historical M9.2 implementation passes 119 Node tests, 16 schema documents, generated-binding
consistency, 60 semantic tools, three architecture rules and M0 parity. Rust passes
33 tests, formatting, Clippy with warnings denied and core Wasm compilation.
Current CI and M2–M9 browser evidence is recorded in M9_2_CURRENT_REPORT.md.
Linux C# development/AOT and Windows development pass.

Chromium with software Vulkan under Xvfb proves all eleven M2 user actions,
visible imported assets, identical saved/reopened pixels after daemon restart,
Play isolation, effective disabled controls and Null draw-count parity. The Play
screenshot was reviewed. This is functional coverage, not physical GPU performance.
Earlier user Windows screenshots establish the M1 hardware path; see M1_CURRENT_REPORT.md.
M3 additionally verifies two dependent rebuilds, one unchanged asset, 43,553 blue
pixels after an external source update, the same page identity, diagnostics and
exact reopened pixels. No additional manual test is required for M3 closure.

M5 additionally verifies the entire scene workflow through an external MCP child
process without editing clicks, with real captured pixels, stale revision and
budget rejection, unavailable tools/renderers, error queries and external edits
refreshing the open editor. See M5_CURRENT_REPORT.md.

## Known boundaries

Node is the verified M2 beta path. Native daemon project/asset authoring, general
schema code generation beyond the script and semantic-tool contracts,
continuous collision detection, physics joints and later systems are not implemented.
M9 implements the bounded production renderer in ADR-0022; broader rendering features
such as imported HDR IBL and point/cascaded shadows remain outside its contract.
M9.1 extends M7 with OBB/circle/sphere angular response; see M9_1_CORRECTIONS.md
for current limits and ADR-0020 for the historical foundation.
Supported import formats and resource limits are in M2_BETA.md. A shared daemon
workspace has memory-only unsaved drafts and 64 history entries; saves persist
explicitly. Preserve project JSON and its complete asset folder together.

## Next work and reports

M6 verifies COW proposals, human review/preview/accept/reject, private C# and
asset promotion, conflicts, rollback and restart. See M6_CURRENT_REPORT.md.
M7 verifies physics, editable 2D/3D demos, C# velocity control and Play isolation.
M8 verifies four causal queries, ten faults, bounded/expired/stale evidence,
Scene/Game separation, two-way selection, transforms, navigation and editable demos.
Follow M14_PLAN.md and master section 133 for automated game testing.

- M0 evidence: ../reports/M0_CURRENT_REPORT.md.
- M1 evidence: ../reports/M1_CURRENT_REPORT.md.
- M2 acceptance and limits: ../reports/M2_CURRENT_REPORT.md and M2_BETA.md.
- M3 acceptance: ../reports/M3_CURRENT_REPORT.md and M3_ASSET_PIPELINE.md.
- M4 acceptance: ../reports/M4_CURRENT_REPORT.md and M4_SCRIPT_RUNTIME.md.
- M5 acceptance: ../reports/M5_CURRENT_REPORT.md and M5_AGENT_CONTROL.md.
- M8 acceptance: ../reports/M8_CURRENT_REPORT.md and M8_DIAGNOSTICS_AND_EDITOR.md.
- Completion weights and delivery rules: MILESTONE_REPORTING.md.

PR #14 is stacked on #13 and the earlier milestone chain; all remain unmerged. CI success does not imply main was merged.

## Roadmap release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.

- M11 bounded GLB skin/TRS import, Rust states/crossfades and GPU skinning in legacy/HDR.
- Optional Animator, canonical editing/proposals, transient C#/AI controls and observed query evidence.
- Three M11 demos and nearest Scene filtering independent from Game camera snapping.

- M12 optional audio components, canonical Inspector/proposal edits and transient C#/AI control.
- Spatial pan, inverse attenuation, lowpass/master dynamics and bounded PCM streaming.
- Truthful browser activation/Null reasons and two editable audio demos.

- M13 bounded measured frame history, worker/main/wait scopes and sampled GPU passes.
- Shared Profiler/semantic API explanations, exact session leases and robust baseline attribution.
- Two editable profiling demos and complete regression acceptance.
