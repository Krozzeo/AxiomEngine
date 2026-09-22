# Axiom Engine

Axiom Engine is an open-source, browser-native, agent-native game engine. Its
core is designed for Rust/WebAssembly and WebGPU; a capability-scoped local
daemon provides filesystem, build, asset and automation services.

Milestones 0 and 1 are complete: the verified Rust/Wasm kernel drives a shared
demo through WebGPU and Null rendering, with bounded frame diagnostics. M2,
Axiom Beta Foundation, now has project controls and generic entity editing with
undo/redo and explicit save. Asset imports and project-scene rendering are pending. See docs/architecture/M2_PLAN.md. This is still a technical preview.

## Run the verified bootstrap

Requirements: Node.js 24+, Rust 1.90.0 and the `wasm32-unknown-unknown` target.
The pinned `rust-toolchain.toml` installs the target through rustup when needed.

```bash
npm run dev
```

`npm run dev` compiles the Rust/Wasm kernel and builds the editor before starting the daemon, so it
works immediately after extracting a source snapshot. Run `npm run check` when
you also want the complete automated validation suite.

The Node adapter remains the compatibility default while M1 plans the runtime
transition. The native daemon has passed pinned Rust CI, shared parity tests and
a real Chrome smoke test. With Rust 1.90 installed, run it with:

```bash
npm run dev:native
```

Both adapters expose the same protocol surface and execute the shared command
parity vectors in `protocol/fixtures/command-parity.json`.

The demo camera and mesh now come from Rust/Wasm. Use `?renderer=null` before
the launch URL's `#token=...` fragment to run the same kernel without a GPU.
See `docs/architecture/M1_KERNEL.md` for the Wasm ABI and current limits.

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

## M2 persistence foundation (0.0.10)

The bootstrap daemon supports project create/open/save/list through authenticated
commands. See [the persistence contract](docs/architecture/PROJECT_PERSISTENCE.md).
The editor still renders the M1 demo; project controls and native daemon support
are the next slice. Stored projects live under `.axiom/projects` within this
checkout; keep that folder when moving to another snapshot.

## M2 editor integration (0.0.11)

Create/open a project in the left panel, add an entity, edit its name/position/scale
in Inspector and Apply changes. Save persists the scene; Undo/Redo affect scene
edits. The viewport remains the labelled kernel demo. See
[the scene editor contract](docs/architecture/SCENE_EDITOR.md) and
[the M2 progress report](docs/reports/M2_CURRENT_REPORT.md).
