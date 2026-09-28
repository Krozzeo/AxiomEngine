# Implementation status

Last updated: 2026-09-28. Version 0.0.14.
M0–M4 acceptance is complete. M4: 8/8 (100%).
Weighted whole-project progress: 30%. M5 AI Control Layer is next.

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

## Current evidence

M4 implementation passes 53 Node tests, 13 schema documents, generated-binding
consistency, three architecture rules and M0 parity. Rust passes 25 tests,
formatting, Clippy with warnings denied and core Wasm compilation.
All ten jobs passed at commit 00ffa6f8aceff1d44095a753db24b2c69ec3fde7:
https://github.com/Krozzeo/AxiomEngine/actions/runs/36375697380
C# development builds and execution also pass in Windows Chromium.

Chromium with software Vulkan under Xvfb proves all eleven M2 user actions,
visible imported assets, identical saved/reopened pixels after daemon restart,
Play isolation, effective disabled controls and Null draw-count parity. The Play
screenshot was reviewed. This is functional coverage, not physical GPU performance.
Earlier user Windows screenshots establish the M1 hardware path; see M1_CURRENT_REPORT.md.
M3 additionally verifies two dependent rebuilds, one unchanged asset, 43,553 blue
pixels after an external source update, the same page identity, diagnostics and
exact reopened pixels. No additional manual test is required for M3 closure.

## Known boundaries

Node is the verified M2 beta path. Native daemon project/asset authoring, general
schema code generation beyond the M4 script contract,
physics, production rendering and later milestone systems are not implemented.
Supported import formats and resource limits are in M2_BETA.md. A shared daemon
workspace has memory-only unsaved drafts and 64 history entries; saves persist
explicitly. Preserve project JSON and its complete asset folder together.

## Next work and reports

Follow M5_PLAN.md and master specification section 124: schema-driven tools,
initial MCP server, bounded queries/captures and structured agent workflows.

- M0 evidence: ../reports/M0_CURRENT_REPORT.md.
- M1 evidence: ../reports/M1_CURRENT_REPORT.md.
- M2 acceptance and limits: ../reports/M2_CURRENT_REPORT.md and M2_BETA.md.
- M3 acceptance: ../reports/M3_CURRENT_REPORT.md and M3_ASSET_PIPELINE.md.
- M4 acceptance: ../reports/M4_CURRENT_REPORT.md and M4_SCRIPT_RUNTIME.md.
- Completion weights and delivery rules: MILESTONE_REPORTING.md.

PR #4 is stacked on #3, itself on #2, itself on #1; all remain unmerged. CI success does not imply main was merged.

## Roadmap release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.
