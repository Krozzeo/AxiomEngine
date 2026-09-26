# Axiom Engine — context-free AI handoff

This is the canonical starting point for an AI agent with no prior conversation
context. Read this file, then the master specification and architecture manifest
before modifying the project.

## Product intent

Axiom Engine is an open-source, browser-native game engine designed for humans
and AI agents as equal first-class operators. Its differentiators are structured
agent control, transactional changes, semantic observability and causal
diagnostics. The full product definition is in
`docs/architecture/AXIOM_MASTER_SPEC.md`.

Non-negotiable foundations:

- Rust/WebAssembly engine core with no DOM dependency;
- WebGPU renderer plus a real Null Renderer;
- TypeScript browser editor;
- capability-scoped local daemon;
- C# gameplay behind a replaceable `ScriptRuntime` boundary;
- one versioned declarative schema source;
- separate Command Bus and Event Bus;
- stable resource identity, generational runtime handles and causal trace IDs;
- measured performance and bounded diagnostics;
- agent changes never mutate MAIN accidentally.

## Current state

Version `0.0.13`: M0–M3 are complete. M3 passed 7/7 acceptance criteria;
weighted whole-project completion is 24%. M4 has not started. Read
M3_ASSET_PIPELINE.md and ../reports/M3_CURRENT_REPORT.md for the current contract. See `docs/reports/M2_CURRENT_REPORT.md`
and `axiom.project-state.json` for exact evidence and completion percentages.

Implemented: authenticated loopback daemon; schema-backed atomic project
persistence; shared authoring workspace; bounded undo/redo; PNG and static GLB
imports with content-hashed sources; sprite/mesh placement; position/scale/name
editing; Rust/Wasm model and camera matrices; WebGPU textured rendering with
simple lighting/depth; orthographic/perspective cameras; isolated Play/Stop;
matching real Rust Null processing; causal events and bounded diagnostics.

42 Node tests and 24 Rust tests pass. All five CI jobs passed on
`869af6d1b9d2525a754b8e65a43e286b83a41156`
([implementation evidence](https://github.com/Krozzeo/AxiomEngine/actions/runs/36268402446)).
M2 regressions and M3 browser hot reload both pass. Local targeted Node tests
also pass; this session's sandbox could not launch rustc, so current clean builds
and pinned Rust/.NET checks are evidenced by CI. The five CI jobs cover Linux and Windows
bootstrap, Rust, C# Wasm publish and actual Chromium rendering. Current browser
validation uses software Vulkan under Xvfb, not a physical GPU benchmark.
Earlier Windows WebGPU/Null screenshots establish M1 hardware evidence only.

The Node bootstrap is the M2 authoring path. Native Rust daemon capabilities
cover the M0 HTTP/protocol/security surface and shared parity corpus; native
project authoring is not implemented. The editor gates controls by capabilities.
C# is a successful publish spike, not gameplay execution (planned for M4).
The M3 Asset DB, stable source revisions, dependency cache, worker jobs,
PNG/GLB/PCM WAV imports, hot reload and resource diagnostics are implemented.
General schema code generation, transactional COW workspaces and later engine
systems remain future work.

Limits and contracts are in M2_BETA.md. A daemon has one shared draft workspace;
unsaved edits/history are memory-only. Assets support PNG and a bounded static
GLB subset. Preserve the complete `.axiom/projects` directory, including asset
folders, when moving snapshots. IDs are stable; paths are never client authority.

## Repository map

- `apps/editor/`: browser UI and WebGPU bootstrap.
- `daemon/bootstrap/`: currently verified HTTP adapter and command bus.
- `daemon/axiom-daemon/`: native Rust daemon shell and security policy.
- `engine/core/`: IDs, clocks, resource/jobs primitives and authoring runtime matrices.
- `engine/assets/`: bounded PNG/GLB/PCM WAV importers and fixed worker entry.
- `engine/wasm/`: ABI v1 exports and host wrapper (ADR-0016).
- `engine/diagnostics/`: bounded trace primitives.
- `engine/renderer/`: renderer boundary and Null Renderer.
- `protocol/schema/`: canonical schema inputs.
- `protocol/src/`: bootstrap protocol helpers.
- `spikes/csharp-wasm/`: early .NET browser-Wasm risk gate.
- `tests/`: executable Node unit and integration evidence.
- `docs/adr/`: architectural decisions; provisional decisions say so explicitly.
- `docs/architecture/`: protocol, boundaries, security and status.

## Required reading by change type

| Change | Read first |
| --- | --- |
| Any architecture change | Master spec, `axiom.architecture.json`, relevant ADRs |
| Protocol/agent API | `PROTOCOL_V1.md`, all protocol schemas, ADR-0007 |
| Daemon/filesystem | `SECURITY.md`, ADR-0003, ADR-0011 |
| Native HTTP adapter | `NATIVE_DAEMON.md`, `PROTOCOL_V1.md`, shared parity vectors |
| Renderer/WebGPU | ADR-0002, M2_BETA.md, renderer crate, scene-renderer.mjs |
| Assets/projects | M2_BETA.md, PROJECT_PERSISTENCE.md, M3_PLAN.md, schema ADR-0010 |
| C# scripting | ADR-0005 and `spikes/csharp-wasm/README.md` |
| Milestone closure | `MILESTONE_REPORTING.md` and current report |

## Commands

```bash
npm ci
npm run doctor
npm run check
npm run dev
```

Node 24+ and Rust 1.90 with the Wasm target are now required.
`npm run dev` compiles the Wasm module and builds the editor automatically. The daemon also rebuilds
missing editor assets when started directly, so a source-only snapshot must not
depend on a pre-existing `dist/` directory.

With pinned Rust 1.90 available, use:

```bash
npm run check:native
npm run dev:native
```

Use `npm run dev` for M2 authoring; `dev:native` runs the M0 native protocol
demo. `npm run test:browser` requires Playwright Chromium and the Linux graphics
dependencies documented in M2_BETA.md and .github/workflows/ci.yml.

Optional native commands are documented in the root README. M0 already has
executed local, Windows and CI evidence; rerun them only when relevant code changes.

## Protocol and format versions

Command, event, diagnostics, scene, asset and MCP protocol numbers are currently
`1`; MCP has no implementation yet. The architecture manifest is version `1`.
Version numbers indicate migration capability, not long-term API stability.

## Safe next task

Begin M4 per M4_PLAN.md and master specification section 123. Establish measured
browser ScriptRuntime integration from the .NET publish spike before selecting
packaging and lifecycle. Follow SECURITY.md before enabling fixed compiler tasks.
Generate bindings from canonical metadata; do not duplicate hand-written schemas.

PR #3 (M3) is stacked on PR #2 (M2), itself on PR #1 (M1). They remain unmerged;
review/integrate in order. Branch CI success does not mean main was updated.

## Handoff discipline

Never infer completed functionality from directories or design documents.
`IMPLEMENTATION_STATUS.md` and the current milestone report distinguish evidence
from scaffolding. Add an ADR before contradicting an accepted decision. Update
this handoff and `axiom.project-state.json` in the same commit as every milestone
closure or architectural change.

The user stores milestone snapshots as sibling directories under:

`C:\Users\Jack\Desktop\Proyecto Axiom Engine\AxiomEngine-milestone`

Preserve that versioned layout in all Windows instructions; do not require the
repository files to live directly in the parent directory. Request manual tests
only for behavior that cannot be executed or equivalently automated in the
agent environment.

## Windows startup

Use a sibling milestone directory under the user's existing project parent.
Run `npm.cmd ci`, then `npm.cmd run dev`. Build discovers Cargo through PATH,
CARGO_HOME/bin and USERPROFILE/.cargo/bin. The pinned rustup toolchain and Wasm
target must be available. Do not copy node_modules, target or dist from another
snapshot; preserve `.axiom/projects` with all asset folders for existing projects.

## Required progress communication

At milestone closure summarize achieved behavior, milestone and whole-project
percentages, and only manual tests that cannot be equivalently automated.
Continue until the full active milestone is complete. A partial delivery needs
a concrete blocker or necessary user-only test. See MILESTONE_REPORTING.md.
