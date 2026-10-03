# Implementation status

Last updated: 2026-10-02. Version 0.0.17.
M0–M7 acceptance is complete. M7: 8/8 (100%).
Weighted whole-project progress: 48%. M8 Causal Diagnostics v1 is next.

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
- PCM WAV audio source metadata; playback remains future work.
- Generated C# Transform bindings, fixed compiler jobs, diagnostics and cancellation.
- Dedicated .NET worker lifecycle, Transform/Input/movement/spawning/logging.
- Compile/reload during Play, saved bundles and timeout/failure isolation.
- Measured development and release AOT runtime foundation.

- Generated semantic tool schemas, introspection and MCP stdio adapter.
- Bounded project/scene/entity/asset queries, event/error deltas and context budgets.
- Revision-safe component tools and automatic external-edit editor synchronization.
- Renderer-owned color screenshots paired with bounded same-frame semantic context.

## Current evidence

M7 implementation passes 71 Node tests, 15 schema documents, generated-binding
consistency, three architecture rules and M0 parity. Rust passes 30 tests,
formatting, Clippy with warnings denied and core Wasm compilation.
All ten jobs passed at commit 8edd6aa849da7c557a98984637edc2bcb62c18d9:
https://github.com/Krozzeo/AxiomEngine/actions/runs/37076201439
C# development builds and execution also pass in Windows Chromium.

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
angular/continuous physics, production rendering and later systems are not implemented.
M7 provides translational AABB/sphere physics; see ADR-0020 for exact boundaries.
Supported import formats and resource limits are in M2_BETA.md. A shared daemon
workspace has memory-only unsaved drafts and 64 history entries; saves persist
explicitly. Preserve project JSON and its complete asset folder together.

## Next work and reports

M6 verifies COW proposals, human review/preview/accept/reject, private C# and
asset promotion, conflicts, rollback and restart. See M6_CURRENT_REPORT.md.
M7 verifies physics, editable 2D/3D demos, C# velocity control and Play isolation.
Follow M8_PLAN.md and master specification section 127 for causal diagnostics.

- M0 evidence: ../reports/M0_CURRENT_REPORT.md.
- M1 evidence: ../reports/M1_CURRENT_REPORT.md.
- M2 acceptance and limits: ../reports/M2_CURRENT_REPORT.md and M2_BETA.md.
- M3 acceptance: ../reports/M3_CURRENT_REPORT.md and M3_ASSET_PIPELINE.md.
- M4 acceptance: ../reports/M4_CURRENT_REPORT.md and M4_SCRIPT_RUNTIME.md.
- M5 acceptance: ../reports/M5_CURRENT_REPORT.md and M5_AGENT_CONTROL.md.
- Completion weights and delivery rules: MILESTONE_REPORTING.md.

PR #7 is stacked on #6, #5, #4, #3, #2 and #1; all remain unmerged. CI success does not imply main was merged.

## Roadmap release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.
