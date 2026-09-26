# M2 — Axiom Beta Foundation: closure report

Version 0.0.12. Completed 2026-09-26. All 11 required acceptance points pass.

## Outcome

The editor creates projects, imports PNG images and static GLB models, places
sprites/meshes, edits transforms, switches perspective/orthographic cameras and
saves the composed scene. Closing and restarting the daemon preserves IDs,
assets, transforms and exact rendered pixels. Play creates an isolated Rust/Wasm
runtime; edits are disabled until Stop and authoring state remains unchanged.

Project, Hierarchy, Inspector, Scene, Game and Console act on real state. Edits
use revision-checked commands, causal events and bounded undo/redo. Sources use
content hashes; project saves are atomic and scoped to project IDs. Simple
materials, a directional light and depth testing support the 3D/2D beta scene.

## Acceptance matrix

| # | Required user action | Result | Executed evidence |
| --- | --- | --- | --- |
| 1 | Open Axiom | Passed | Chromium opens editor, connects and initializes WebGPU |
| 2 | Create project | Passed | UI creates named project through Command Bus |
| 3 | Import image and GLB | Passed | PNG and cube GLB uploaded through actual file input |
| 4 | Place sprite | Passed | Sprite entity and colored image pixels verified |
| 5 | Place mesh | Passed | Mesh entity, draw count and colored geometry verified |
| 6 | Move them | Passed | Both positions edited; camera switched; pixels change |
| 7 | Save | Passed | Saved state contains both imported entities |
| 8 | Close | Passed | Project closes and hierarchy empties |
| 9 | Open | Passed | Daemon restarts; stored project reopens with identical data |
| 10 | See same scene | Passed | Reopened viewport RGBA equals saved viewport byte-for-byte |
| 11 | Enter Play | Passed | At least 15 runtime frames, two draws, disabled edit fields, Stop preserves authoring |

## Automated evidence

Implementation/test commit: `96386db8ab406eb29d90f91c41f109377915b40d`.
[GitHub Actions run](https://github.com/Krozzeo/AxiomEngine/actions/runs/36249049412) passed all five jobs:
Linux and Windows bootstrap, Rust, C# Wasm publish and browser-m2.

- `npm run check`: 38 Node tests, zero failures; 11 schema documents,
  three architecture rules and shared M0 daemon parity checks.
- Rust: 24 tests, formatting, Clippy with warnings denied and core Wasm check.
- Browser: 11/11 acceptance actions, exact pixel comparison after daemon restart,
  Play isolation, effective field disabling and real Rust Null item parity.
- Saved viewport contains 25,815 red-classified and 14,850 green-classified pixels.
  These are visibility assertions for deterministic fixtures, not image-quality scores.
- No uncaught page errors. CI captures scene.png, reopened.png, play-editor.png
  and report.json in the m2-browser-evidence artifact. Play screenshot reviewed.

The runner uses Chromium 141 with Xvfb and SwiftShader software Vulkan. Installing
Mesa/Vulkan dependencies resolved the earlier runner device loss. Two test
assertions were corrected (fieldset detection and invoking textContent); no
rendering or persistence criterion was relaxed. This is not a physical GPU benchmark.

## Manual tests requested

None. The required user flow has equivalent automated browser coverage. No
additional Windows hardware claim is inferred from software-rendered CI evidence.

## Known limitations

The verified M2 path is the Node bootstrap daemon. Native authoring parity and
general schema code generation remain unimplemented. Imports support PNG and a
bounded static GLB subset; see ../architecture/M2_BETA.md. C# gameplay is M4;
Play currently executes the static scene and engine clocks. Lighting is basic,
not production PBR. One shared workspace per daemon has no automatic cross-tab
subscription; drafts/history are memory-only until Save (64 history entries).
Unused imported source files remain for the future asset pipeline's cleanup.

## Completion and next milestone

M0: 100%. M1: 100%. **M2: 11/11 = 100%.**
Whole-project estimate: **5 + 6 + 7 = 18%** of the weighted roadmap.
This measures accepted milestone scope, not elapsed time or feature count.
Method: ../architecture/MILESTONE_REPORTING.md.

Next is M3 Asset Pipeline; see ../architecture/M3_PLAN.md. PR #2 is ready for
review and remains stacked on unmerged PR #1. This closure does not merge main.
