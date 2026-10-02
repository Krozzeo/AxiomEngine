# M7 — Physics Foundation

Status: complete. M7: 8/8 (100%). Weighted whole-project completion: 48%.

| Requirement | Evidence / status |
| --- | --- |
| Owned Rust 2D/3D colliders and bodies | Passed native and actual Wasm tests |
| Broad and narrow phases | Passed sweep pruning and box/sphere golden scenes |
| Gravity, impulses and friction | Passed falling/resting scenes and impulse tests |
| Triggers, raycasts and collision layers | Passed filtering, no-response triggers and closest hits |
| Fixed steps and deterministic test mode | Passed repeated 600-step scenes and bounded catch-up |
| Authoring, C# and isolated Play integration | Passed Inspector, velocity/jump control and source preservation |
| Golden scenes and measured baseline | Passed native/Wasm expectations; 16/64/256-body benchmark recorded |
| Editable demos, documentation and end-to-end verification | Passed 2D/3D demos and WebGPU/Null browser flow |

## Implemented behavior

Physics runs in the owned Rust CPU/Wasm solver at 60 Hz. Scene components are
editable, revision-checked, undoable and persistent. Agents remain proposal
scoped. C# reads and sets runtime velocity. Stop restores the authored scene.
Explicit component removals persist without discarding unknown plugin fields.

`npm run demo` creates two ordinary editable projects: a 2D C# playground with
movement/jump, crates, platforms and a trigger zone; and imported 3D blocks with
gravity, contacts and a static foundation. See demos/README.md for startup.

## Automated evidence

Release code 8edd6aa849da7c557a98984637edc2bcb62c18d9 passed all ten CI jobs:
https://github.com/Krozzeo/AxiomEngine/actions/runs/37076201439

71 Node tests on Linux and Windows, 30 Rust tests, formatting, Clippy with
warnings denied, 15 schemas, 50 generated semantic contracts, script bindings,
three architecture rules and daemon parity pass. C# development/AOT execution
passes, including Windows development. M2–M7 Chromium workflows pass.

The M7 browser test creates both demos, compiles actual C#, exercises movement
and jump, checks physics contacts, preserves authored/saved data and runs the
same solver with the Null Renderer. Seven browser criteria pass with no page
errors. Both screenshots were inspected. Raw report: m7-browser-evidence.json.
The captured demo/benchmark evidence is from successful run 36501062866 on the
same physics/demo implementation, before the subsequent component-save fix.

The sparse 16/64/256-body baseline measured approximately 0.0042/0.0141/0.0227 ms
per step in Linux CI, including scalar bridge/snapshot overhead. Each sample
ran 1,000 steps. This is a separated-body functional baseline, not a dense-contact,
physical-GPU or production performance claim. Raw data: m7-physics-benchmark.json.

## Manual tests

None required. Opening and playing the demos is available for exploration;
it is not a missing acceptance gate delegated to the user.

## Boundaries

Physics is translational: axis-aligned boxes and circles/spheres with explicit
world-space sizes. No angular solver, CCD, constraints or production character
controller is claimed. Fast bodies may tunnel through thin geometry. Determinism
means stable order and repeatability for identical inputs on a given backend,
not cross-platform bit identity. See ADR-0020 and M7_PHYSICS.md.

PR #7 is stacked on #6, unmerged. M8 Causal Diagnostics v1 is next.
