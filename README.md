# Axiom Engine

Axiom Engine is an open-source, browser-native, agent-native game engine. Its
core is designed for Rust/WebAssembly and WebGPU; a capability-scoped local
daemon provides filesystem, build, asset and automation services.

Milestones 0 and 1 are complete: the verified Rust/Wasm kernel drives a shared
demo through WebGPU and Null rendering, with bounded frame diagnostics. M2,
Axiom Beta Foundation, now has PNG/GLB import, project-scene rendering, editing,
undo/redo, save/reopen and isolated Play. All eleven M2 acceptance criteria pass in Chromium CI. M3 also completes the incremental asset pipeline; M4 adds C# gameplay, compilation and reload; M5 adds structured AI/MCP control and real captures; weighted roadmap progress is approximately 36%. See docs/architecture/M2_PLAN.md. This is still a technical preview.

## Run the verified bootstrap

Run `npm ci` before the first launch to install the pinned dependencies.

Requirements: Node.js 24+, Rust 1.90.0 and the `wasm32-unknown-unknown` target.
The pinned `rust-toolchain.toml` installs the target through rustup when needed.

```bash
npm run dev
```

`npm run dev` compiles the Rust/Wasm kernel and builds the editor before starting the daemon, so it
works immediately after extracting a source snapshot. Run `npm run check` when
you also want the complete automated validation suite.

The Node adapter is the M2 editor path. The native daemon implements the M0
protocol/security surface and has passed Rust CI and a Chrome smoke test; it does
not yet provide M2 project authoring. To run that native protocol demo:

```bash
npm run dev:native
```

Both adapters execute the shared M0 command parity vectors in
`protocol/fixtures/command-parity.json`. The editor disables unsupported capabilities.

Project transforms and camera matrices come from Rust/Wasm. Use `?renderer=null`
before the launch URL's `#token=...` fragment to run the scene without a GPU.
See `docs/architecture/M2_BETA.md` for the workflow and supported asset formats.

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

## M2 beta (0.0.12)

Create a project, import a PNG and a static GLB, then place each asset. Select
entities in Hierarchy and edit name, position or scale in Inspector. Choose the
camera projection, save, close and reopen the project. Play compiles an isolated
runtime copy; Stop returns to the authoring scene.

See [M2_BETA.md](docs/architecture/M2_BETA.md) for supported formats and limits,
[the persistence contract](docs/architecture/PROJECT_PERSISTENCE.md), and
[the acceptance report](docs/reports/M2_CURRENT_REPORT.md). Keep the complete
`.axiom/projects` directory, including asset folders, when changing snapshots.

## M3 asset pipeline (0.0.13)

Import PNG, static GLB or PCM WAV sources. Select a mesh and a texture to bind its
base-color dependency. To update a source, choose the replacement file, select
the existing asset and click **Replace selected source**. Background jobs rebuild
only affected assets and refresh the scene; IDs stay stable. Cancel interrupts
pending work, and Explain shows dependency/rebuild evidence. Save persists the
updated sources; Undo/Redo restores previous source revisions.

See [M3_ASSET_PIPELINE.md](docs/architecture/M3_ASSET_PIPELINE.md) and
[the M3 closure report](docs/reports/M3_CURRENT_REPORT.md). WAV import provides
metadata, not audio playback. Keep the complete project asset folder on upgrades.

## M4 C# gameplay (0.0.14)

Install .NET 10 SDK and run `dotnet workload install wasm-tools`. In the editor,
select an entity, edit Game.cs and choose **Compile & attach**, then Play. The
included example spawns a copy, logs lifecycle events and moves with arrow keys.
Recompile during Play to reload without restarting the editor. Failed compilation
keeps the last good program; Stop discards runtime movement and spawned entities.
Development is the default; Release AOT is an opt-in measured foundation.

See [M4_SCRIPT_RUNTIME.md](docs/architecture/M4_SCRIPT_RUNTIME.md) for the SDK,
limits and reset semantics, and [M4_CURRENT_REPORT.md](docs/reports/M4_CURRENT_REPORT.md)
for automated M4 evidence (100% complete).

## M5 AI control (0.0.15)

The Node daemon offers generated semantic tools and a local MCP stdio adapter.
Agents can query scenes, edit entities/components, import assets, control Play,
inspect bounded error/event deltas and capture actual WebGPU frames.
Keep the editor open for rendering and capture. Configuration, budgets and
limits are in [M5_AGENT_CONTROL.md](docs/architecture/M5_AGENT_CONTROL.md).
MCP uses the shared authoring draft; transactional isolation arrives in M6.

M5: **100%**; weighted whole project: **approximately 36%**. See
[M5_CURRENT_REPORT.md](docs/reports/M5_CURRENT_REPORT.md) for acceptance evidence.
