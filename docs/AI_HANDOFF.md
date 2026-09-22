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

Version: `0.0.6`. Active milestone: M0, Architecture Lock & Bootstrap.

Implemented and locally verified:

- editor build and static shell;
- secure Node bootstrap daemon bound to loopback;
- capability handshake and protocol v1 envelopes;
- command, event, error, revision, undo and trace behavior;
- scoped atomic writes and traversal rejection;
- WebGPU triangle code, capability detection and device-loss hook;
- Null Renderer Rust boundary;
- schemas, error/tool catalogs and architecture checks;
- ten passing Node tests, including same-origin browser handshake behavior,
  recovery when generated editor output is absent and the shared native parity
  corpus;
- native Rust HTTP adapter source for static assets, health, handshake,
  commands, event deltas, traces and metrics;
- shared security/error/command surface enforcement across both adapters.

Not yet verified or complete:

- Rust 1.90 and .NET 10 are unavailable in the current execution environment;
- native Rust adapter has not compiled because Rust is unavailable locally;
- native adapter browser smoke testing waits for a green Rust compile gate;
- CI workflow exists but has not produced a remote green run;
- schema-to-Rust/TypeScript/C# generation is not implemented;
- content-addressed transactional COW overlays are later work.

External Windows evidence uses `rustc/cargo 1.90.0` and .NET SDK `10.0.400`.
The `axiom-core` crate passed `cargo check` for `wasm32-unknown-unknown`.
`check:native` passes formatting, Clippy with warnings denied and all nine Rust
tests on Windows 10 with Rust 1.90.0. The native daemon also passes the Chrome
protocol, security-isolation, health, Ping, Increment and Undo smoke flow. The
.NET `wasm-tools` workload restored successfully and the Release C#
browser-Wasm publish passed with zero warnings and errors in 48.9 seconds.
`Cargo.lock` is committed and Rust build/test gates use `--locked`.

Current evidence-based completion: M0 **75%**; whole project **4%**. See
`docs/reports/M0_CURRENT_REPORT.md` for the acceptance matrix and manual test.

## Repository map

- `apps/editor/`: browser UI and WebGPU bootstrap.
- `daemon/bootstrap/`: currently verified HTTP adapter and command bus.
- `daemon/axiom-daemon/`: native Rust daemon shell and security policy.
- `engine/core/`: IDs and time primitives.
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

`npm run dev` performs the editor build automatically. The daemon also rebuilds
missing editor assets when started directly, so a source-only snapshot must not
depend on a pre-existing `dist/` directory.

With pinned Rust 1.90 available, use:

```bash
npm run check:native
npm run dev:native
```

Do not switch the default `dev` command to Rust until formatting, clippy, tests
and a real browser run against the native adapter all pass.

Optional native gates are documented in the root README. Do not claim them as
passing without executed output.

## Protocol and format versions

Command, event, diagnostics, scene, asset and MCP protocol numbers are currently
`1`; MCP has no implementation yet. The architecture manifest is version `1`.
Version numbers indicate migration capability, not long-term API stability.

## Safe next task

Run the checked-in GitHub Actions workflow against the current commit. All
equivalent local and Windows gates are green; do not repeat them. Archive the
workflow URL/status as evidence, mark the CI acceptance criterion passed, close
M0 and begin the remaining M1 work.
After that, execute the .NET browser-Wasm spike and obtain the first remote
green CI run. Only then close M0 and begin the rest of M1.

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
