# Axiom Game Engine

A local browser game editor with Rust/WebAssembly kernel, WebGPU renderer and C# gameplay. Includes2D/3D scenes, resources, CPU/Wasm physics, editing tools and isolated AI proposals with human review.

**Current candidate:0.0.53 / scripting SDK 8 / Platform P4.** P1 is integrated and accepted; P2/P3/P4 are stacked review candidates. [Confirmed status/limits](docs/architecture/IMPLEMENTATION_STATUS.md), [current context](docs/AI_HANDOFF.md), [documentation map](docs/index.md).

## Axiom family

This is the first product of [Axiom Platform](https://github.com/Krozzeo/AxiomPlatform). Platform owns Hub/shared infrastructure/SDK; Engine owns specialized editor, scenes/assets/C#/rendering/physics/audio/animation/export and its adapter. [Transition](docs/architecture/PLATFORM_TRANSITION.md). Engine M19–M40 still targets functional Unity API compatibility plus shaders/compute/GPU physics. Platform work does not increase their coverage.

The prepared combined P4 ZIP has a root **Start Axiom.cmd** launcher: extract both sibling folders and double-click. It checks dependencies, installs missing local runtimes/dependencies, opens the browser and retains startup errors. [P4 guide](docs/architecture/PLATFORM_P4.md).

## Direct source startup

Requirements: Node 24+, Rust 1.90 with wasm32-unknown-unknown and .NET 10 SDK/wasm-tools for C#.

```powershell
npm ci
rustup target add wasm32-unknown-unknown
dotnet workload install wasm-tools
npm run demo
npm run dev
```

Open the daemon's authenticated local URL. Direct startup remains available; it does not require the Platform Hub. Keep complete projects/resources and never open the same folder concurrently with older pre-lease binaries. Engine consumes a public pinned HTTPS Platform archive with lockfile integrity, not a neighboring checkout link.

New3D projects/scenes include Cube, Directional Light and configured Camera. Platform owns hosted lifecycle; use the project row's Open/Edit/Save/Close icons. Pending code buffers must be saved in the editor. Removing a list entry preserves files; permanent deletion is a separate reviewed confirmation.

## Roadmap and evidence

[RoadmapM19–M40](docs/architecture/ROADMAP_M19_M40.md) keeps45 main milestones/23 historically closed and 22 planned. M19 audits the frozen Unity 6.3 target before percentages can be measured. M40 inherits former M19 hardening. No current audited whole-API percentage or GPU-physics completion is claimed. Standalone game build/export is planned and not currently exposed; direct editor startup is a different capability.

```powershell
npm run check
npm run check:native
```

Browser suites use test:browser:* and retain separate GPU/Null evidence. Previous P3 check445/445 passed locally, but Engine CI336 passed43/46 with M17/M18.3.11/aggregate failures. #47/#51/#55 and real-account/native-dialog/model evaluation/dense physics remain independent. New PR checks decide integration; historical green runs do not certify later commits.

## Demos and accounts

npm run demo creates References & Inspector and related labs; [demo map](demos/README.md). npm run demo:m18-4 creates two independent GitHub demos; [guide](demos/M18_4_GUIDE.md). TestRepo is testing-only and is never auto-linked to demos. Session credentials stay in memory; repository/preferences/history remain per project. Never paste tokens/API keys into chat.

Code/UI/maintained docs use English. Original-language historical snapshots are retained as reference text, not current instructions. [Contributing](CONTRIBUTING.md). [MIT](LICENSE); [third-party notices](THIRD_PARTY_NOTICES.md) remain applicable.
