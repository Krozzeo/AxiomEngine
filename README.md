# Axiom Engine

Axiom Engine is an open-source, browser-native, agent-native game engine. Its
core is designed for Rust/WebAssembly and WebGPU; a capability-scoped local
daemon provides filesystem, build, asset and automation services.

This repository currently implements the Milestone 0 walking skeleton and the
first technical risk spikes. It is intentionally a small executable kernel,
not a feature-complete engine.

## Run the verified bootstrap

Requirements: Node.js 24+.

```bash
npm run dev
```

`npm run dev` builds the editor automatically before starting the daemon, so it
works immediately after extracting a source snapshot. Run `npm run check` when
you also want the complete automated validation suite.

The verified Node adapter remains the default until the native daemon passes
the pinned Rust CI gate. With Rust 1.90 installed, run the native adapter with:

```bash
npm run dev:native
```

Both adapters expose the same protocol surface and execute the shared command
parity vectors in `protocol/fixtures/command-parity.json`.

The daemon prints a one-time editor URL containing a session token. It binds
only to `127.0.0.1`, validates request origins, applies cross-origin isolation
headers, and never exposes arbitrary command execution.

## Optional native checks

With the pinned Rust toolchain installed:

```bash
cargo fmt --check
cargo clippy --locked --workspace --all-targets -- -D warnings
cargo test --locked --workspace
cargo check --locked -p axiom-core --target wasm32-unknown-unknown
```

The C# → Wasm spike lives in `spikes/csharp-wasm` and is exercised in CI with
the pinned .NET SDK.

## Current vertical slice

The editor negotiates protocol/schema/capabilities with the daemon, submits a
structured command, receives a structured event, displays its trace, and can
undo the demo mutation. Stable error codes are used throughout.

See `docs/architecture/IMPLEMENTATION_STATUS.md` for exact completion status,
known limitations, and next gates.

Every milestone closes using the evidence and percentage method defined in
`docs/architecture/MILESTONE_REPORTING.md`, including any manual tests that the
user must perform on hardware unavailable to the implementation environment.
