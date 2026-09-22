# Implementation status

Last updated: 2026-09-22.

## Implemented and locally verified

- dependency-free TypeScript-compatible editor shell;
- secure loopback bootstrap daemon over HTTP/JSON;
- protocol/schema/capability negotiation;
- separate commands, events and structured errors;
- correlation, trace, causation and message identity;
- bounded event and trace retention;
- demo mutation, revision check and undo;
- atomic project-file primitive with traversal protection;
- WebGPU capability probe, device-loss hook and triangle spike;
- explicit Null Renderer behavior in engine interfaces;
- Rust workspace source for core, diagnostics, renderer and daemon shell;
- declarative schemas, architecture manifest and dependency checks;
- architecture, security, protocol and ADR documentation;
- automated Node integration/unit tests.

## Milestone 0 verification evidence

M0 gates were executed on the documented Windows evidence machine and in GitHub
Actions. During M1, Rust 1.90.0 was also installed in the agent workspace;
the current 22 Rust tests, formatting, Clippy and Wasm target check pass locally.
.NET validation remains the recorded M0 Windows/CI evidence.

On the Windows evidence machine, Rust 1.90.0 is installed and `axiom-core`
passes `cargo check --target wasm32-unknown-unknown`. The first full native gate
stopped at `cargo fmt --check`; its complete deterministic diff was applied in
0.0.4. After the four Clippy fixes in 0.0.5, formatting, Clippy with denied
warnings and all nine Rust tests passed. The native daemon then passed the
Chrome protocol, isolation, command and health smoke flow. .NET SDK 10.0.400
restored `wasm-tools` and published the C# browser-Wasm spike in Release with
zero warnings/errors. `Cargo.lock` now fixes the 94 third-party packages and
all compile/test gates enforce `--locked`.

The managed browser used for visual QA cannot access this workspace's loopback
server. A Windows 10 developer-machine run verified Chrome, WebGPU,
cross-origin isolation, protocol negotiation, commands, Undo and the patched
clean-extraction startup.

The native Rust daemon contains the HTTP adapter and Rust tests. Its source and
CI build cover the same endpoints, security policy and command semantics as the
bootstrap, with shared parity vectors consumed by Node and Rust tests. GitHub
Actions CI #1 passed `bootstrap`, `rust` and `csharp-wasm-spike` for commit
`16c065c` in 69 seconds.

The C# spike validates publish-to-browser-Wasm only. Runtime embedding, engine
interop, lifecycle and hot reload remain Milestone 4 work and require measured
spike results before API lock-in.

## Next gates

1. Implement M2 authoring scene contract and project create/open/save/load.
2. Route scene edits through Command Bus, events and undo/redo.
3. Add image/GLB imports and 2D/3D runtime compilation, then Play Mode.
4. Execute M2's eleven user-flow acceptance points; see M2_PLAN.md.

## Release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.

## M1 browser integration (0.0.9)

The editor build compiles axiom-wasm in release mode. Sixteen Node tests execute
real Wasm and the editor Null loop; twenty-two Rust tests pass. WebGPU now consumes
Rust-projected mesh vertices. The changed GPU path now has user screenshot evidence (see the M1 report). See M1_KERNEL.md.


## M1 closure

User screenshots verified WebGPU and Null on Windows after the Cargo fix.
CI #3 passed all jobs for 0ecbc4bb4c8576d0b716dd68740257f5df256f40.
M1 is complete; M2 is not started. No new manual M1 checks are required.

## M2 first slice — 0.0.10

Bootstrap project persistence is implemented and locally verified by seven new
tests, including a real daemon restart over HTTP (27 Node tests total). Project
IDs, entity transforms and extension fields round-trip. Native daemon support,
editor integration, importers and general runtime extraction remain pending.
See PROJECT_PERSISTENCE.md. No M2 end-to-end acceptance step is closed yet.
