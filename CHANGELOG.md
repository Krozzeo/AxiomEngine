# Changelog

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
