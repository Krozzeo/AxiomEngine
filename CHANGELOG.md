# Changelog

## M1 browser acceptance evidence

- Recorded successful Windows startup after Cargo discovery correction.
- Recorded user WebGPU and Null screenshots with Wasm frame traces and timings.
- All seven functional criteria pass; formal closure awaits current remote CI.

## 0.0.9 follow-up — Cargo discovery

- Fixed Windows startup when Node cannot find Cargo on PATH: use cargo.exe and
  fall back to CARGO_HOME/bin and the user rustup installation.
- Preserve actual compiler failures; report AX_BUILD_0001 only when Cargo cannot
  be located. Twenty Node tests pass, including four discovery regressions.

## 0.0.9 — Rust/Wasm browser integration

- Added a versioned scalar Wasm bridge with explicit world lifetime and trace IDs.
- Moved demo mesh and perspective camera extraction to Rust; WebGPU uploads the
  returned clip vertices instead of generating a triangle inside its shader.
- Added a real Wasm Null path for missing GPU, forced Null mode and device loss.
- Added Wasm compilation to the editor build and installed its toolchain in CI.
- Allowed Wasm compilation in both CSPs while keeping JavaScript eval blocked.
- Passed 16 Node tests (including real Wasm/editor Null integration) and 22 Rust tests.
- Updated handoff, ABI ADR and M1 report; physical GPU validation remains open.

## 0.0.8 — WebGPU + Engine Kernel foundation

- Added DOM-free entity, transform and camera scene primitives.
- Added fixed/variable engine clocks, traced jobs and generational resources.
- Added a dependency-ordered render graph and same-scene Null Renderer processing.
- Added bounded CPU frame traces and optional WebGPU timestamp sampling in the editor.
- Added two browser-profiler tests; the Node suite now passes 12 tests.
- Installed the pinned Rust 1.90 toolchain in the agent workspace and passed all
  20 Rust tests, formatting, Clippy and the Wasm target check.
- Fixed JavaScript module delivery and stopped the frame loop on device loss.
- Corrected the active M1 name and scope against the authoritative master specification.

## 0.0.7 — Milestone 0 closure

- Recorded green GitHub Actions CI #1 for commit `16c065c` in 69 seconds.
- Closed all eight M0 acceptance criteria and advanced the active milestone to M1.
- Raised evidence-based whole-project completion to 5%.
- Added explicit LF/CRLF repository normalization policy.
- Reconciled machine-readable state, closure report, README and AI handoff.

## 0.0.6 — Reproducible native gate

- Committed the generated Cargo v4 lockfile for 94 third-party dependencies.
- Enforced `--locked` in local scripts, documentation and CI compile/test gates.
- Recorded the fully green Rust format, Clippy and nine-test workspace gate.
- Recorded the native Chrome protocol, isolation, command and health smoke test.
- Raised evidenced M0 completion to 88%; remote CI is the only open criterion.

## 0.0.5 — Native Clippy patch and C# Wasm evidence

- Fixed all four Clippy findings from the first compiled native daemon gate.
- Recorded that the Rust workspace compiles through `axiom-daemon` before
  deny-level lint evaluation.
- Recorded the successful .NET 10 C# browser-Wasm Release publish with zero
  warnings and errors.

## 0.0.4 — Native gate formatting patch

- Applied the exact Rust 1.90 `rustfmt` output across all workspace crates.
- Recorded the successful `axiom-core` `wasm32-unknown-unknown` check from the
  Windows evidence machine.
- Recorded Rust 1.90.0 and .NET 10.0.400 availability without claiming the
  still-pending native daemon and C# Wasm gates.

## 0.0.3 — Native daemon adapter

- Replaced the Rust daemon shell with a loopback-only Axum HTTP adapter.
- Ported handshake, static delivery, commands, events, traces and metrics.
- Ported token/origin enforcement, Fetch Metadata fallback, body limits and
  cross-origin isolation headers.
- Added nine shared command parity vectors executed by Node and Rust tests.
- Added a static adapter-surface gate for endpoints, codes and security policy.
- Kept the verified Node adapter as the default until pinned Rust CI is green.

## 0.0.2 — Clean-extraction startup fix

- Made `npm run dev` build the editor automatically.
- Made direct daemon startup rebuild missing editor assets defensively.
- Added a regression test that removes `dist/editor`, starts the daemon and
  verifies the editor HTML is served.
- Updated the handoff and milestone report with the packaging incident.

## 0.0.1 — Milestone 0 bootstrap

- Established the repository, architecture manifest, schemas and ADR process.
- Added the secure browser-to-daemon command/event/trace walking skeleton.
- Added atomic scoped writes, bounded diagnostics, undo and revision conflicts.
- Added the WebGPU triangle/Null Renderer spike and device-loss diagnostics.
- Added Rust engine/daemon boundaries and the C# browser-Wasm risk spike.
- Added CI, architecture enforcement and seven locally passing tests.
- Added a fixed milestone reporting and weighted project-completion method.
- Added context-free AI handoff documentation and machine-readable project state.
- Fixed same-origin browser handshakes that omit `Origin` while retaining token
  and Fetch Metadata checks.
- Fixed Windows tool discovery in `doctor`; Git remains optional by design.
