# Axiom Engine

M16 (0.0.29) is in acceptance; M15 remains the completed baseline (84%, 87/104).
Project file authoring, scoped context menus/clipboard, component boxes/autocommit,
consistent menus, Game FPS and explicit render scale are implemented. Two editable
M16 demos use canonical project APIs. Hierarchy rows are indexed/virtualized, Wasm
modules are cached with fresh worlds, GPU staging storage is reused and submitted
GPU work is bounded. Earlier game tests/replay and quality tiers remain required gates.
Read demos/M16_GUIDE.md and docs/architecture/M16_AUTHORING_AND_PERFORMANCE.md.
PR #19 is draft/open, stacked on unmerged #18; keep milestone PRs unmerged.
Current validation is not a completed milestone or a hardware FPS claim.

Historical completed baseline:

Axiom Engine is an open-source, browser-native, agent-native game engine. Its
core is designed for Rust/WebAssembly and WebGPU; a capability-scoped local
daemon provides filesystem, build, asset and automation services.

M13.1 (0.0.26) is complete: six correction groups, 100%. Project progress remains approximately 76% (79/104 roadmap weight points); these corrections do not advance M14.
Profiler captures survive Stop, retain their original session and can be saved,
exported/imported and reopened after reload. Analysis visibly identifies its frame.
Eight tabs drag independently into five fixed dock sections, preserving the old
initial arrangement. Separate windows share selection and canonical editing through
one renderer lease; closing returns their controls. Project layout saves without
publishing unsaved scene edits. Same-tab credentials survive reload; pagehide
releases the old lease. Dev opens the default browser, with a printed-link fallback.
All 23 CI jobs pass at 03607cdf87bef62732b4bb39c432be97f3e79611 (tree ae36db768f7c484a02966442b01c401cdf94b08c).
158 Node tests, 39 Rust tests and nine new browser criteria pass, including all
prior gameplay and C# development/AOT regressions. Final screenshots reviewed.
See docs/reports/M13_1_CURRENT_REPORT.md and demos/M13_1_GUIDE.md.
PR #16 is ready for review, stacked on unmerged #15; do not merge automatically.
Historical next step at M13 closure: M14 automated game testing.

`npm.cmd run demo` creates three editable M14 projects. Preserve `.axiom/projects`.
See [demo guide](demos/M14_GUIDE.md); `demo:m13-1` preserves the earlier workspace demos.

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
From M6 onward, MCP mutations require isolated proposal scope; see below.

M5: **100%**; weighted whole project: **approximately 36%**. See
[M5_CURRENT_REPORT.md](docs/reports/M5_CURRENT_REPORT.md) for acceptance evidence.

## M6 isolated proposals

Version 0.0.16 completes transactional AI proposals (M6: 100%; whole project: 41%). See [workspace contracts](docs/architecture/M6_WORKSPACES.md) and
[current report](docs/reports/M6_CURRENT_REPORT.md). Agents begin a workspace
and pass its ID to edits. Review and run it in the editor, then reject or accept
the reviewed changes. Acceptance changes the draft; Save persists explicitly.

## M7 physics and demos

Version 0.0.17 adds owned CPU/Wasm 2D/3D physics: colliders, rigid bodies,
gravity, impulses/friction, triggers, collision layers, raycasts and fixed steps.
The Physics Inspector and generated C# velocity bindings work in isolated Play.
See [contracts and limits](docs/architecture/M7_PHYSICS.md).

Create the physics pair with demo:m7 and the editor pair with demo:m8. .NET 10 SDK with wasm-tools is needed for the 2D C# keyboard controller:

```powershell
npm.cmd ci
npm.cmd run demo:m7
npm.cmd run demo:m8
npm.cmd run dev
```

Select **Demo · 2D Physics Playground** or **Demo · 3D Falling Blocks** in Saved
projects, then Open and Play. Click the viewport for keyboard input. The 2D
player moves with arrows/A-D and jumps with Space. Stop restores authored state.
The two physics demos run with Play. M8 Scene Workshop demonstrates selection,
move/rotate/scale, Undo/cancel, Scene navigation and stopped Game preview. M8
Diagnostic Lab supplies named cases for all four causal questions. Diagnostics
is a tab beside Structured Console. Each invocation creates fresh project IDs and
preserves existing projects; `npm.cmd run demo:m7` creates only the physics pair.
See [demo instructions](demos/README.md) for requirements and sample limitations.

## M8 Scene tools and Diagnostics

Scene and Game are views independent of Play/Stop. In Scene, select geometry or a
Hierarchy entity, then use W/E/R and the XYZ gizmos. One drag is one Undo action;
Escape cancels. F frames selection; Alt + left drag orbits, middle drag pans,
wheel zooms, and right mouse + WASD/QE flies in 3D. The bottom-left XYZ widget
aligns the editor camera; Ortho/Persp changes its projection.

Diagnostics exposes decision paths, graphs, frame contacts/triggers and command
traces. The read-only `diagnostics.explain` API/MCP tool supports whyNotRendered,
whyNotColliding, whyAssetNotLoaded and whyScriptNotRunning. Deep trace is opt-in,
bounded to 32 sampled frames and 30 seconds. See
[contracts and limitations](docs/architecture/M8_DIAGNOSTICS_AND_EDITOR.md).
