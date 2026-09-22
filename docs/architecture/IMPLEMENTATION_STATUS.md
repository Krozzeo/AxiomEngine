# Implementation status

Last updated: 2026-09-21.

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

## Toolchain-gated in this environment

Rust and .NET are not installed in the current execution environment. Their
sources, pinned versions and CI jobs are present, but local `cargo` and
`dotnet` results must not be claimed until those jobs run successfully.

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

The native Rust daemon now contains the HTTP adapter and Rust tests, but it has
not compiled in this environment because the Rust toolchain is unavailable.
The verified Node adapter remains the default until pinned Rust CI passes.
Its source covers the same endpoints, security policy and command semantics as
the bootstrap, with shared parity vectors consumed by Node and Rust tests.

The C# spike validates publish-to-browser-Wasm only. Runtime embedding, engine
interop, lifecycle and hot reload remain Milestone 4 work and require measured
spike results before API lock-in.

## Next gates

1. Run the existing workflow remotely and archive green CI evidence.
2. Record C# browser-Wasm output size and startup measurements in M1.
3. Add schema code generation from one parsed model.
4. Introduce content-addressed project snapshots and change-set reports.

## Release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.
