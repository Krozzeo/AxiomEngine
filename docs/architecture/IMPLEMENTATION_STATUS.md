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

1. Verify the new Wasm-fed WebGPU viewport and timing sample on a real browser.
2. Audit remaining M1 features against the master specification; the real-Wasm
   Null path and editor diagnostics have automated integration evidence.
3. Publish the increment and run the existing GitHub Actions workflow.
4. Add schema code generation from one parsed declarative model.
5. Record C# browser-Wasm output size and startup measurements.

## Release slices

- Technical Preview: M0–M2.
- Agent-native Alpha: M3–M6.
- Engine Beta: M7–M14.
- Complete MVP/0.1: M15–M19.

## M1 browser integration (0.0.9)

The editor build compiles axiom-wasm in release mode. Sixteen Node tests execute
real Wasm and the editor Null loop; twenty-two Rust tests pass. WebGPU now consumes
Rust-projected mesh vertices. The GPU path needs fresh visual evidence; historical
M0 triangle evidence does not validate this changed pipeline. See M1_KERNEL.md.

## User evidence update

Windows startup, WebGPU triangle and Null rendering were confirmed by the user
for 0.0.9 with the Cargo discovery fix. Screenshots show frames 840 and 225,
one mesh in each backend, finite CPU timings and a first GPU sample of 0 ms.
Earlier references to pending visual evidence above are superseded by this
record. The remaining closure gate is current remote CI. Do not repeat the
browser smoke for unchanged code. Zero GPU sample is not a zero-cost claim.
