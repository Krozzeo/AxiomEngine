# M10 — 2D production closure

M10 (0.0.22) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 68%.
Opt-in 2D includes atlas batching, editable tilemaps, Rust/Wasm sprite animation
and seeded particles, pixel-perfect Game preview, radial lighting and screen UI
pause/resume. Inspector and agent tools share revisions, Undo, Save and isolated
proposals. Existing legacy/HDR rendering remains compatible.
All 19 jobs in CI run 37224306330 pass at executable commit
a332e8fcb1017d87fd82f3feafcb3fc1709ae831 (tree a1d0c786e520e7f3d4955303844c76323a23c3f8).
127 Node and 36 Rust tests, eight new browser criteria and earlier regressions pass.
Final software WebGPU/Null screenshots were reviewed. No user-only test remains.
Read docs/reports/M10_CURRENT_REPORT.md, docs/architecture/M10_2D.md and
demos/M10_GUIDE.md. Next: M11 general animation, per M11_PLAN.md/master section 130.
PR #12 is ready for review, stacked on unmerged #11; do not merge automatically.

## Acceptance

| Group | Status | Evidence |
| --- | --- | --- |
| Bounded components and isolation | Passed | schema, authority and private proposal tests |
| Sprite batching, alpha and budgets | Passed | 164 quads in two actual batches; order golden and Null |
| Editable tilemaps | Passed | brush pixels, Undo, Save/reopen tests |
| Sprite animation and pixel camera | Passed | real Rust sampling, stopped preview, Play/Stop |
| Lights, particles and diagnostics | Passed | light pixels, Wasm particles, pause/reset and bounded stats |
| Physics and UI routing | Passed | actual C# controls, Rust physics, UI pause and Scene input exclusion |
| Editable demos | Passed | Pixel Adventure and Sprite Batching Lab via canonical commands |
| Regression, images, budgets and docs | Passed | 19/19 CI, screenshot review and synchronized state |

## Verification

https://github.com/Krozzeo/AxiomEngine/actions/runs/37224306330

127 Node tests on Windows/Linux, 36 Rust tests, fmt, Clippy with zero warnings,
core Wasm check and clean release editor builds pass. Schema/catalog/bindings,
architecture and native/bootstrap parity pass. Eight new browser criteria plus
M2–M9/correction regressions and Windows/Linux development/Linux AOT C# pass.
Browser page, console and HTTP error arrays are empty.
Screenshots reviewed: editor/play/pause/reset, tile brush, light-off, alpha ordering,
batching and Null. Evidence and benchmark JSON are adjacent to this report.
CPU planner p95 for 128/512/4096 quads: 3.75/13.47/62.99 ms. Actual Rust/Wasm
2048-particle sampling: 26.13 ms; one batch. All below the bounded 350 ms
software-host admission threshold. These exclude GPU/full-frame performance.
Closure changes only documentation/evidence; executable source tree matches CI.

## Manual tests

None required: input, editing, persistence, pause, pixels, physics and regressions
were automated. Physical GPU performance has not been benchmarked.

## Limits and demos

2D requires explicit settings and excludes mesh/HDR mixing. Tile colliders are
separately authored. Particles are seeded analytic fountains without collisions.
Radial lights have no shadows or normal maps. UI has colored panels/buttons and
built-in transient pause; no text/layout/widget toolkit or arbitrary callbacks.
Noninteger texel sizing and rotation can distort pixel art. Native daemon still
exposes its earlier M0 surface; authoring uses the Node bootstrap.
See M10_2D.md and ADR-0023 for exact bounds.

Run npm.cmd ci, npm.cmd run demo, npm.cmd run dev. See demos/M10_GUIDE.md.
Controller compilation needs .NET 10/wasm-tools; unavailable compilation explicitly
preserves both saved scenes without attaching the controller. Preserve all
.axiom/projects folders (including assets/scripts) when upgrading.
M10: 100% (8/8). Approximate weighted project completion: 68% (62% + 6%).
Next: M11 general animation. PR #12 ready, stacked on #11, unmerged.
