# Implementation status

Last updated: 2026-09-26. Version 0.0.12.
M0, M1 and M2 are complete. M2: 11/11 acceptance criteria (100%).
Weighted whole-project progress: 18%. M3 Asset Pipeline is next, not started.

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
- C# browser-Wasm publish spike; it does not execute gameplay in the editor.

## Current evidence

`npm run check` passes 38 Node tests, 11 schema documents, three architecture
rules and M0 daemon parity checks. Rust passes 24 tests, formatting, Clippy with
warnings denied and core Wasm compilation. Linux/Windows bootstrap, Rust,
C# publish and actual Chromium acceptance all pass in CI:
https://github.com/Krozzeo/AxiomEngine/actions/runs/36249049412
Implementation/test commit: `96386db8ab406eb29d90f91c41f109377915b40d`.

Chromium with software Vulkan under Xvfb proves all eleven M2 user actions,
visible imported assets, identical saved/reopened pixels after daemon restart,
Play isolation, effective disabled controls and Null draw-count parity. The Play
screenshot was reviewed. This is functional coverage, not physical GPU performance.
Earlier user Windows screenshots establish the M1 hardware path; see M1_CURRENT_REPORT.md.
No additional manual test is required for M2 closure.

## Known boundaries

Node is the verified M2 beta path. Native daemon project/asset authoring, general
schema code generation, asset dependency/rebuild pipeline, C# gameplay embedding,
physics, production rendering and later milestone systems are not implemented.
Supported import formats and resource limits are in M2_BETA.md. A shared daemon
workspace has memory-only unsaved drafts and 64 history entries; saves persist
explicitly. Preserve project JSON and its complete asset folder together.

## Next work and reports

Follow M3_PLAN.md and master specification section 122: stable logical asset IDs,
dependency graph, deterministic derived cache, background import jobs and hot reload.
Changing a texture must rebuild only dependent resources without restarting the editor.

- M0 evidence: ../reports/M0_CURRENT_REPORT.md.
- M1 evidence: ../reports/M1_CURRENT_REPORT.md.
- M2 acceptance and limits: ../reports/M2_CURRENT_REPORT.md and M2_BETA.md.
- Completion weights and delivery rules: MILESTONE_REPORTING.md.

PR #2 remains stacked on unmerged PR #1. CI success does not imply main was merged.

## Roadmap release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.
