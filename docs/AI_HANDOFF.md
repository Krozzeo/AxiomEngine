# Axiom Engine — context-free AI handoff

This is the canonical starting point for an AI agent with no prior conversation
context. Read this file, then the master specification and architecture manifest
before modifying the project.

## Product intent

Axiom Engine is an open-source, browser-native game engine designed for humans
and AI agents as equal first-class operators. Its differentiators are structured
agent control, transactional changes, semantic observability and causal
diagnostics. The full product definition is in
`docs/architecture/AXIOM_MASTER_SPEC.md`.

Non-negotiable foundations:

- Rust/WebAssembly engine core with no DOM dependency;
- WebGPU renderer plus a real Null Renderer;
- TypeScript browser editor;
- capability-scoped local daemon;
- C# gameplay behind a replaceable `ScriptRuntime` boundary;
- one versioned declarative schema source;
- separate Command Bus and Event Bus;
- stable resource identity, generational runtime handles and causal trace IDs;
- measured performance and bounded diagnostics;
- agent changes never mutate MAIN accidentally.

## Current state

M12 (0.0.24) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 75%.
Optional AudioSource/AudioListener, spatial pan and attenuation, mixer buses,
lowpass filters and master dynamics work through Web Audio. Long PCM WAVs stream
through bounded AudioWorklet queues. Human/C#/AI runtime controls are transient;
canonical editing preserves revisions, Undo/Save and isolated proposals.
Stopped previews are silent. Scene and simulation pause preserve transport;
Stop resets it. Null and browser activation expose truthful unavailable reasons.
All 21 jobs in CI run 37245601863 pass at executable commit
aef19432107a017de935319f94d443390972aed1 (tree 178e257f6ffc86e5d1909b274d9a0462c031c6de).
144 Node and 39 Rust tests, ten new browser criteria and earlier regressions pass.
Actual graph signal, stereo pan, pause, streaming and lowpass were measured.
Final screenshots were reviewed. No user-only test remains.
Read docs/reports/M12_CURRENT_REPORT.md, docs/architecture/M12_AUDIO.md,
ADR-0025 and demos/M12_GUIDE.md. Next: M13 profiler/explainFrameSpike.
PR #14 is ready for review, stacked on unmerged #13; do not merge automatically.

M9.2 (0.0.21) editor refinements are complete (12/12, 100%). Read
M9_2_REFINEMENTS.md, M9_2_CURRENT_REPORT.md and demos/M9_2_GUIDE.md first.
All 18 jobs in CI run 37218376172 pass at executable commit
b2f71b8928395e7469726a257c5ad0caf1631545 (tree
8f459c1e9745884c661c39acdba1720de5d29e2a); local code is identical.
119 Node/33 Rust tests, 15 correction browser criteria, all M2–M9 regressions,
Windows/Linux development C# and Linux AOT pass. Final screenshots reviewed.
Closure commits only update documentation/evidence. Weighted progress remains 62%.
Ctrl toggles selection; Hierarchy Shift selects visible ranges. Group transforms
and hierarchy ordering are atomic/undoable. Inspector is modular with separate
Collider/RigidBody, searchable Add Component last, and fundamental Transform first.
Project tree/icons, lateral menus and resizable project-saved panels are implemented.
Exact legacy M9.1 sphere/capsule sources are repaired only in derived import v3.
No required user-only test remains. M9.2 PR #11 is stacked on unmerged #10.

Version `0.0.20`: M0–M9 and M9.1 acceptance are complete. M9.1 passes
12/12 correction groups (100%); weighted whole-project progress remains 62%.
Read M9_1_CORRECTIONS.md, M9_1_CURRENT_REPORT.md and demos/M9_1_GUIDE.md first.
The twelve corrections include focus orbit, Rotate direction, modular components,
menus/tree/explorer, Alt multiselect, parenting, primitives and live/rotated lights.
Rust/Wasm now provides oriented contacts, inertia and angular integration.
All 18 jobs in CI run 37209258078 pass at executable code commit
ba58fa326cbd481a144a3a075bd6d8ebd0f2df49; local tree matches the verified tree.
Closure documentation/evidence is a later commit; no executable code changes.
M9 production-renderer contracts remain in M9_RENDERER.md and ADR-0022.
The repository is public with explicit owner authorization. The earlier private
included Actions quota was exhausted; no spending/payment setting was changed.
CI tests PRs once, main pushes and manual dispatch; browser runners are isolated.

Read M8_DIAGNOSTICS_AND_EDITOR.md, M8_CURRENT_REPORT.md, ADR-0021 and demos/README.md.
Read M7_PHYSICS.md for the historical translational foundation; M9.1 adds angular response.
Read M5_AGENT_CONTROL.md, M5_CURRENT_REPORT.md and ADR-0018 for contracts,
evidence and limitations. M6 now scopes agent mutations to isolated proposals;
read M6_WORKSPACES.md, M6_CURRENT_REPORT.md and ADR-0019.

Implemented: authenticated loopback daemon; schema-backed atomic project
persistence; shared authoring workspace; bounded undo/redo; PNG and static GLB
imports with content-hashed sources; sprite/mesh placement; position/scale/name
editing; Rust/Wasm model and camera matrices; WebGPU textured rendering with
legacy lighting/depth plus bounded opt-in PBR/HDR/Forward+; orthographic/perspective
cameras; isolated Play/Stop;
matching real Rust Null processing; causal events and bounded diagnostics.

119 Node tests, 33 Rust tests, 16 schema documents, 60 semantic tools, generated
bindings and three architecture rules pass. M2–M9 Chromium workflows, Linux
development/AOT C# and Windows development pass. Read M9_CURRENT_REPORT.md.
The MCP acceptance launches a separate stdio client process, creates/edits a scene
without editor clicks, synchronizes Play/Stop and obtains a real WebGPU PNG plus
same-frame semantic context. Screenshot evidence was reviewed.
This workspace cannot launch its installed rustc or .NET; clean builds are proven
in CI. Browser rendering uses software Vulkan under Xvfb, not physical GPU
benchmarks. Earlier Windows WebGPU/Null screenshots establish M1 hardware only.

The Node bootstrap is the M2 authoring path. Native Rust daemon capabilities
cover the M0 HTTP/protocol/security surface and shared parity corpus; native
project authoring is not implemented. The editor gates controls by capabilities.
C# executes in a disposable worker with generated Transform bindings,
Input, movement, runtime spawning and lifecycle logs. Editor source compilation,
error locations, cancel/stale protection, safe reset/reload and saved bundles
are implemented. Native Rust contains an internal named compiler capability;
it is not exposed as a native project/editor HTTP API.
The M3 Asset DB, stable source revisions, dependency cache, worker jobs,
PNG/GLB/PCM WAV imports, hot reload and resource diagnostics are implemented.
M5 generates semantic tools from canonical metadata and component schemas.
The stdio MCP adapter uses authenticated loopback HTTP and the public Command Bus.
Bounded queries, context budgets, deltas, error introspection and actual renderer
capture are implemented. Broader schema generation, later engine systems remain future work. M6 isolated proposals, human review/accept/reject, private resources, conflicts,
rollback and idle restart recovery pass their integrated browser and unit gates.
M7 adds an owned CPU/Wasm translational solver, Physics Inspector, generated
RigidBody velocity bindings and editable demos. Tests cover fixed steps, contacts,
triggers, layer masks, raycasts and repeatable golden scenes. M9.1 adds angular dynamics and rotated contacts; CCD and GPU physics remain
outside scope. See ADR-0020 for historical M7 limits and M9_1_CORRECTIONS.md for
the current contract. Use demo:m7, demo:m8, demo:m9 and demo:corrections for historical samples; demo creates the M12 pair.
M8 adds independent stopped Game preview, an editor-only Scene camera, triangle
picking, two-way selection, move/rotate/scale gizmos with one-command Undo and
Escape cancellation, orbit/pan/zoom/fly/framing and an absolute XYZ widget.
Diagnostics is a tab beside Structured Console. Four diagnostics.explain queries
return bounded evidence graphs with frame/command lineage; unavailable or
unproven causes remain explicit. Deep trace is opt-in, sampled every 15 frames,
bounded to 32 frames and expires after 30 seconds. M8 Scene Workshop and
Diagnostic Lab exercise these functions. No pixel-perfect outline, alpha picking,
snapping is claimed. M9.1 adds Alt multi-selection and hierarchical parenting.

Limits and contracts are in M2_BETA.md. A daemon has one shared draft workspace;
unsaved edits/history are memory-only. Assets support PNG and a bounded static
GLB subset. Preserve the complete `.axiom/projects` directory, including asset and script
folders, when moving snapshots. IDs are stable; paths are never client authority.

## Repository map

- `apps/editor/`: browser UI and WebGPU bootstrap.
- `daemon/bootstrap/`: currently verified HTTP adapter and command bus.
- `daemon/axiom-daemon/`: native Rust daemon shell and security policy.
- `engine/core/`: IDs, clocks, resource/jobs primitives and authoring runtime matrices.
- `engine/assets/`: bounded PNG/GLB/PCM WAV importers and fixed worker entry.
- `engine/audio/`: pure listener/attenuation planning and bounded PCM rendering.
- `apps/editor/src/audio-*.mjs`: Web Audio adapter, worklet and human controls.
- `engine/scripting/`: generated C# SDK, worker lifecycle and validated operations.
- `daemon/bootstrap/scripting/`: fixed compiler capability and bundle validation.
- `engine/wasm/`: ABI v1 exports and host wrapper (ADR-0016).
- `engine/diagnostics/`: bounded trace primitives.
- `engine/renderer/`: renderer boundary and Null Renderer.
- `daemon/mcp/`: MCP stdio transport over the authenticated daemon.
- `daemon/bootstrap/agent/`: bounded queries, validation and renderer lease.
- `protocol/schema/`: canonical schema inputs.
- `protocol/src/`: bootstrap protocol helpers.
- `spikes/csharp-wasm/`: early .NET browser-Wasm risk gate.
- `tests/`: executable Node unit and integration evidence.
- `docs/adr/`: architectural decisions; provisional decisions say so explicitly.
- `docs/architecture/`: protocol, boundaries, security and status.

## Required reading by change type

| Change | Read first |
| --- | --- |
| Any architecture change | Master spec, `axiom.architecture.json`, relevant ADRs |
| Protocol/agent API | `PROTOCOL_V1.md`, all protocol schemas, ADR-0007 |
| Daemon/filesystem | `SECURITY.md`, ADR-0003, ADR-0011 |
| Native HTTP adapter | `NATIVE_DAEMON.md`, `PROTOCOL_V1.md`, shared parity vectors |
| Renderer/WebGPU | ADR-0002, M2_BETA.md, renderer crate, scene-renderer.mjs |
| Assets/projects | M2_BETA.md, PROJECT_PERSISTENCE.md, M3_PLAN.md, schema ADR-0010 |
| C# scripting | ADR-0005, M4_SCRIPT_RUNTIME.md, canonical component metadata and generated bindings |
| Milestone closure | `MILESTONE_REPORTING.md` and current report |

## Commands

```bash
npm ci
npm run doctor
npm run check
npm run dev
```

Node 24+ and Rust 1.90 with the Wasm target are now required.
`npm run dev` compiles the Wasm module and builds the editor automatically. The daemon also rebuilds
missing editor assets when started directly, so a source-only snapshot must not
depend on a pre-existing `dist/` directory.

With pinned Rust 1.90 available, use:

```bash
npm run check:native
npm run dev:native
```

Use `npm run dev` for M2 authoring; `dev:native` runs the M0 native protocol
demo. `npm run test:browser` requires Playwright Chromium and the Linux graphics
dependencies documented in M2_BETA.md and .github/workflows/ci.yml.

Optional native commands are documented in the root README. M0 already has
executed local, Windows and CI evidence; rerun them only when relevant code changes.

## Protocol and format versions

Command, event, diagnostics, scene, asset and MCP protocol numbers are currently
`1`. Axiom MCP semantic API v1 uses external MCP protocol `2025-11-25` over
stdio. The architecture manifest is version `1`.
Version numbers indicate migration capability, not long-term API stability.

## Safe next task

Implement M13 per M13_PLAN.md and master section 132. M12 is complete;
PR #14 is ready, stacked on unmerged #13. Preserve audio transport and activation,
animation/C# gameplay, proposal isolation, stopped Game preview and 2D/legacy/HDR.
Read M12_AUDIO.md, ADR-0025, M12_CURRENT_REPORT.md, M8 causal diagnostics and
FrameProfiler first. Add bounded CPU/GPU histories, anomaly comparison, top
contributors and explainFrameSpike with artificial regression acceptance.
Include an editable profiling demo and synchronized closure. No user-only M12 test remains.
M8 PR #8 is stacked on #7; all milestone PRs remain unmerged.

M5 PR #5 (`codex/m5-ai-control`) is stacked on M4 PR #4, then M3 #3, M2 #2 and
M1 #1. All remain unmerged; review/integrate in order. CI success does not mean
main was updated.

## Handoff discipline

Never infer completed functionality from directories or design documents.
`IMPLEMENTATION_STATUS.md` and the current milestone report distinguish evidence
from scaffolding. Add an ADR before contradicting an accepted decision. Update
this handoff and `axiom.project-state.json` in the same commit as every milestone
closure or architectural change.

The user stores milestone snapshots as sibling directories under:

`C:\Users\Jack\Desktop\Proyecto Axiom Engine\AxiomEngine-milestone`

Preserve that versioned layout in all Windows instructions; do not require the
repository files to live directly in the parent directory. Request manual tests
only for behavior that cannot be executed or equivalently automated in the
agent environment.

## Windows startup

Use a sibling milestone directory under the user's existing project parent.
Run `npm.cmd ci`, then `npm.cmd run dev`. Build discovers Cargo through PATH,
CARGO_HOME/bin and USERPROFILE/.cargo/bin. The pinned rustup toolchain and Wasm
target must be available. Do not copy node_modules, target or dist from another
snapshot; preserve `.axiom/projects` with all asset and script folders for existing projects.
For C# install .NET 10 SDK and run `dotnet workload install wasm-tools` once.
The default Development mode is the rapid iteration path; AOT is opt-in.

## Required progress communication

At milestone closure summarize achieved behavior, milestone and whole-project
percentages, and only manual tests that cannot be equivalently automated.
Continue until the full active milestone is complete. A partial delivery needs
a concrete blocker or necessary user-only test. See MILESTONE_REPORTING.md.
