# Milestone 0 closure report

Date: 2026-09-22. Status: complete.

## Outcome

The repository, architecture records, schemas, secure bootstrap daemon,
TypeScript-compatible editor shell, command/event/trace walking skeleton,
WebGPU probe, Null Renderer boundary and automated Node checks exist. The full
Node, Rust, Rust/Wasm and C# browser-Wasm matrix passes across the agent,
documented Windows evidence machine and GitHub Actions environments.

## Acceptance criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| Repository compiles across required M0 toolchains | Passed | Node, Rust/Wasm, native Rust workspace and C# browser-Wasm gates pass |
| Editor shell starts in a supported browser | Passed | Chrome 153 on Windows 10 rendered the WebGPU triangle |
| Daemon starts | Passed | Node and native Rust `/health` verified |
| Browser client connects to daemon | Passed | Chrome connects to both adapters with protocol v1 and isolation enabled |
| CI is green | Passed | GitHub Actions CI #1, commit `16c065c`, green in 1 min 9 s |
| Architecture tests work | Passed | Three dependency rules pass |
| Demo command returns a correlated event | Passed | End-to-end HTTP integration test and trace pass |
| Documentation explains local execution | Passed | README, protocol, security and status documents |

Current milestone completion: **8 / 8 = 100%**.

Weighted whole-project completion: **5%**. M0 has 5% roadmap weight and is fully
evidenced.

## Automated evidence

- 10 of 10 Node tests pass, including browser missing-Origin, clean-extraction
  startup and shared native parity regressions.
- 10 schema documents and the architecture manifest validate.
- 3 architecture dependency rules pass.
- 6 HTTP endpoints, 8 stable codes and 9 shared command vectors pass the
  cross-adapter surface gate.
- Static editor delivery includes COOP, COEP, CORP and CSP headers.
- `axiom-core` passes `cargo check` for `wasm32-unknown-unknown` under Rust
  1.90.0 on Windows 10 x64.
- Rust formatting passes; the workspace compiles through `axiom-daemon` before
  four Clippy idiom lints, all fixed in 0.0.5.
- The C# browser-Wasm Release publish passes under .NET 10.0.400 with zero
  warnings/errors in 48.9 seconds.
- Rust formatting, Clippy with warnings denied and all 9 workspace tests pass.
- The native daemon passes Chrome protocol v1, `crossOriginIsolated`, health,
  Ping, Increment and Undo checks.
- `Cargo.lock` fixes 98 packages total: 4 workspace crates and 94 third-party
  packages; Rust compile/test gates enforce `--locked`.
- Git baseline commit is clean.
- GitHub Actions CI #1 passed all `bootstrap`, `rust` and `csharp-wasm-spike`
  jobs for commit `16c065c` in 69 seconds.

## Manual tests requested from the user

### Current manual requirement

None. All M0 local, developer-machine, browser and remote-CI gates are green.
Do not ask the user to repeat Node, Rust, .NET, browser or WebGPU checks for M0.

## User-provided hardware evidence

- Windows 10 Pro x64; AMD Ryzen 5 3600; 24 GB RAM.
- NVIDIA GeForce GTX 1650; Chrome 153.0.8010.53 x64.
- Node 24.21.0 and npm 11.19.0.
- Rust/cargo 1.90.0; `axiom-core` Wasm target check passed.
- Rust formatting, Clippy, 9 tests and native browser smoke passed.
- .NET SDK 10.0.400; `wasm-tools` restored and Release publish passed.
- `crossOriginIsolated === true`; `navigator.gpu === true`.
- WebGPU `bgra8unorm` triangle rendered; timestamp queries unavailable as allowed.
- Increment, Undo and `/health` passed.
- Manual run exposed `AX_SECURITY_0001` on handshake GET; root cause fixed.
- The `m0.1` source snapshot omitted generated `dist/editor` files and `dev` did
  not build them; `m0.2` now builds automatically and has a clean-output test.

## Known limitations

- Rust/.NET remain unavailable in the agent environment, but their pinned gates
  passed on the documented Windows evidence machine and in remote CI.
- WebGPU is verified on the supported browser; forced device-loss recovery is
  later renderer work rather than an M0 closure criterion.
- Full copy-on-write workspaces are later work; M0 implements atomic scoped writes.
