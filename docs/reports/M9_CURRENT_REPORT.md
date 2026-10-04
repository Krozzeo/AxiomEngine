# M9 — Renderer Production Foundation

Version 0.0.19. M9 acceptance is complete: 8/8 required points passed.
PR #9 is ready for review, stacked on unmerged PR #8.

## Outcome

Opt-in HDR PBR rendering now works with metallic/roughness materials, imported
smooth normals, directional/point/spot lights, analytic environment, one primary
directional/spot PCF shadow, exposure and ACES/Reinhard tone mapping. Forward+
light tiles, shared-geometry instancing, CPU/GPU frustum culling, authored imported
mesh LOD, bloom and edge smoothing operate through bounded native WGSL passes.
The canonical Inspector and AI proposal commands share validation, revision checks,
Undo and persistence. Existing scenes retain their legacy image contract.

## Acceptance

| Required point | Status | Evidence |
| --- | --- | --- |
| Canonical components, validation, commands, Undo/persistence and proposal isolation | Passed | 102 Node tests; 55 semantic tools; schema/architecture checks |
| CPU render planning, bounds, batching, LOD, quality tiers and budgets | Passed | Eight renderer tests; three planner p95 budgets |
| PBR/HDR, three light kinds and environment produce rendered geometry | Passed | Real WebGPU gallery; material highlights and colored lights reviewed |
| GPU Forward+, instancing, compute culling and CPU/GPU golden parity | Passed | Identical gallery/lab pixels; actual indirect buffer readback |
| Shadows, postprocessing, pipeline cache and bounded resource lifecycle | Passed | Pixel-effect checks; eight pipelines; snapshot/quality transitions |
| Human Inspector editing and causal production references | Passed | Material Apply/Undo; AX_CAUSAL_0140 and clip exclusion graph |
| Editable demos, constrained quality and Null acceptance | Passed | Gallery/lab generate/save/reopen; low-tier fallback; no Null submissions or invented pixels |
| Full clean cross-platform regression suite and image review | Passed | 17/17 CI jobs passed, including Windows C#; gallery/lab images reviewed |

M9: **8/8 (100%)**. Weighted whole-project progress: approximately **62%**.
The next milestone is M10 2D Production Foundation.

## Automated evidence

Code commit: `5f19c2c0a640164742dc338754d4abf27b537869`.
CI run: https://github.com/Krozzeo/AxiomEngine/actions/runs/37166766454.

102 Node tests pass on Ubuntu and Windows. Rust formatting, Clippy with warnings
denied, 30 Rust tests and core Wasm compilation pass. 16 schema documents,
55 semantic tools, binding consistency, three architecture rules and daemon parity
pass. All 17 CI jobs passed, including M2–M9 browser acceptance, Linux C#
development/AOT and Windows C# development. M9 reports zero page, console and HTTP errors.
Raw browser evidence: `m9-browser-evidence.json`; measured pixel differences:
`m9-renderer-pixels.json`.

The lab has 145 instances, 121 CPU-admitted references and an actual sampled GPU
count of 121; 24 are culled. It uses two batches, 14,976 uploaded vertex bytes,
eight fixed pipelines and one entity using an authored lower LOD.
Admitted/submitted draws do not prove per-entity pixel visibility.

Golden gallery and lab CPU/GPU screenshots have zero changed pixels. Measured
pixel changes: bloom 1,238; tone mapping 518,365; shadows 9,981; point light 31,661.
Gallery and lab captures were visually inspected. Screenshots remain in the
`milestone-browser-evidence-m9` CI artifact.

| Tier | Instances | Planner p95 ms | Budget ms | Opaque batches |
| --- | ---: | ---: | ---: | ---: |
| Low | 128 | 1.075 | 4 | 1 |
| Medium | 512 | 3.176 | 12 | 1 |
| High | 1024 | 6.259 | 24 | 1 |

Raw benchmark: `m9-renderer-benchmark.json`. These budgets measure CPU planning,
not full-frame time or physical GPU performance. Software Vulkan proves functional
GPU behavior; hardware frame-rate certification remains outside this milestone.

## Demos

`npm.cmd run demo` creates six editable projects with fresh IDs and preserves
existing projects. M9 adds PBR Lighting Gallery and Instancing and LOD Lab to the
M7 physics and M8 editor/diagnostic demos. Play is unnecessary for the static M9
scenes. See `demos/M9_GUIDE.md` for controls and expected behavior.

## Manual tests

None required. Demo exploration is optional; equivalent automated interaction,
rendering, persistence, quality fallback and Null checks have passed.

## Limits

See ADR-0022 and M9_RENDERER.md. Environment is analytic ambient, not imported
HDR/convolved IBL. There is one primary directional/spot shadow map, no cascades,
point/transparent shadows, normal/AO/metallic textures, temporal AA or occlusion
culling. Edge smoothing is a five-tap luminance filter. Radiance units are engine
relative. Budgets permit at most 1,024 draw instances, 300,000 selected vertices
and 8/32/64 lights by tier. Native daemon project authoring remains future work.

The repository is now public, with explicit owner authorization; no payment or
spending settings were changed. Public Actions acquired runners after the previous
private included-minute quota was exhausted. WGSL counter conversion and boolean
predicate syntax were corrected against real compiler errors. Optional favicon
requests return 204 and missing static assets return 404, rather than HTTP 500.
All browser error checks remain enabled. The earlier M4 keyboard timeout passed
on subsequent executions; failure reports now retain the actual frame state.

M10 2D Production Foundation follows per M10_PLAN.md. Keep milestone PRs
unmerged and preserve the complete `.axiom/projects` folder across snapshots.

The final closure commit changes documentation and evidence only; the complete
executable source above is the exact code commit tested in CI. Source snapshots
exclude generated dist/target/node_modules and runtime projects.
