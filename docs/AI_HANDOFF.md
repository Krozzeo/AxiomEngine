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

Version: `0.0.9`. Milestone 0, Architecture Lock & Bootstrap, is complete.
Active milestone: M1, WebGPU + Engine Kernel, in progress.

Implemented and locally verified:

- editor build and static shell;
- secure Node bootstrap daemon bound to loopback;
- capability handshake and protocol v1 envelopes;
- command, event, error, revision, undo and trace behavior;
- scoped atomic writes and traversal rejection;
- WebGPU triangle code, capability detection and device-loss hook;
- Null Renderer Rust boundary;
- schemas, error/tool catalogs and architecture checks;
- sixteen passing Node tests, including same-origin browser handshake behavior,
  recovery when generated editor output is absent and the shared native parity
  corpus;
- native Rust HTTP adapter source for static assets, health, handshake,
  commands, event deltas, traces and metrics;
- shared security/error/command surface enforcement across both adapters.

Not yet implemented:

- schema-to-Rust/TypeScript/C# generation from one declarative model;
- content-addressed transactional COW overlays;
- later-milestone engine, editor and scripting systems.

External Windows evidence uses `rustc/cargo 1.90.0` and .NET SDK `10.0.400`.
The `axiom-core` crate passed `cargo check` for `wasm32-unknown-unknown`.
`check:native` passes formatting, Clippy with warnings denied and all nine Rust
tests on Windows 10 with Rust 1.90.0. The native daemon also passes the Chrome
protocol, security-isolation, health, Ping, Increment and Undo smoke flow. The
.NET `wasm-tools` workload restored successfully and the Release C#
browser-Wasm publish passed with zero warnings and errors in 48.9 seconds.
`Cargo.lock` is committed and Rust build/test gates use `--locked`.
GitHub Actions CI #1 passed the `bootstrap`, `rust` and `csharp-wasm-spike` jobs
for commit `16c065c` in 69 seconds.

M1 now loads a real Rust/Wasm kernel in the editor. The demo mesh and camera
projection feed WebGPU's vertex buffer; forced Null mode and absent GPU execute
the same kernel and the Rust Null Renderer. Trace IDs and fixed clocks cross the
scalar ABI. Sixteen Node tests and twenty-two Rust tests pass. Two editor tests
use real Wasm with a simulated DOM; they are not physical GPU evidence. The user has now verified the new shader/vertex-buffer path and timing panel
in WebGPU and Null modes; see the report for exact screenshot values.
Rust 1.90.0, formatting, Clippy and Wasm release build are verified locally.

Current evidence-based completion: M0 **100%**; active M1 functional criteria **100%**; whole project
**11%**. See `docs/reports/M1_CURRENT_REPORT.md` for the live acceptance matrix.

## Repository map

- `apps/editor/`: browser UI and WebGPU bootstrap.
- `daemon/bootstrap/`: currently verified HTTP adapter and command bus.
- `daemon/axiom-daemon/`: native Rust daemon shell and security policy.
- `engine/core/`: IDs, clocks, resource/jobs primitives and the demo scene.
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
| Renderer/WebGPU | ADR-0002, renderer crate, editor WebGPU bootstrap |
| C# scripting | ADR-0005 and `spikes/csharp-wasm/README.md` |
| Milestone closure | `MILESTONE_REPORTING.md` and current report |

## Commands

```bash
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

The Node adapter remains the compatibility bootstrap while M1 plans the default
runtime transition. Both adapters have passed formatting/compile, parity,
security and real-browser M0 gates.

Optional native commands are documented in the root README. M0 already has
executed local, Windows and CI evidence; rerun them only when relevant code changes.

## Protocol and format versions

Command, event, diagnostics, scene, asset and MCP protocol numbers are currently
`1`; MCP has no implementation yet. The architecture manifest is version `1`.
Version numbers indicate migration capability, not long-term API stability.

## Safe next task

Run remote CI on the current M1 snapshot. All seven functional criteria now
pass, including user WebGPU and Null screenshots. Formal M1 closure awaits CI.
Do not repeat the browser smoke for unchanged code. Once CI passes, record the
result and start M2 from the master specification. GPU sample 0 ms is not a
benchmark claim. Read M1_KERNEL.md and ADR-0016 for the supported scope.

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

## Windows startup follow-up

A Windows run exposed `spawnSync cargo ENOENT`. The build script now tries
`cargo.exe`, then CARGO_HOME/bin and USERPROFILE/.cargo/bin, without a shell.
Four discovery regressions pass, bringing the Node suite to 20 tests. The actual
CARGO_HOME fallback also built Wasm on Linux with Cargo absent from PATH.
Windows startup and both browser modes are confirmed by user screenshots. For an existing m1.1 extraction, replace only
`scripts/build-editor.mjs` with the corrected file and run `npm.cmd run dev`.
