# M9 — implementation checkpoint; acceptance in progress

This is not a milestone release. M0–M8 remain complete. M9 implementation is
saved on `codex/m9-renderer-production`, stacked PR #9, unmerged.

Implemented but not GPU-verified: opt-in HDR PBR, directional/point/spot lighting,
analytic environment, one directional/spot PCF shadow, Forward+ light tiles,
instanced indirect draws, compute culling, imported mesh LOD, tone mapping, bloom,
edge smoothing, bounded pipeline/resources and production causal references.
Materials, lights, LOD and HDR settings have canonical schemas, revision/Undo
commands, Inspector forms and proposal isolation. Two new editable demo projects
are persisted alongside the four earlier demos. See demos/M9_GUIDE.md and ADR-0022.

## Acceptance matrix

| Required point | Status | Executable evidence |
| --- | --- | --- |
| Canonical components, validation, public commands, Undo/persistence and proposal isolation | Passed | Node command/workspace tests; 55 generated tools; schema/architecture checks |
| CPU render planning: bounds, batching, LOD, tier decisions and bounded budgets | Passed | Eight renderer tests; three planner p95 budgets |
| PBR/HDR, lights and environment produce correct pixels | Blocked | Browser test authored; first public GPU run executing |
| Real GPU Forward+, instancing, compute culling and CPU/GPU golden parity | Blocked | Compute/indirect implementation and acceptance test; not executed |
| Shadows, postprocessing, pipeline cache and resource lifecycle | Blocked | GPU implementation and pixel-effect tests; not executed |
| Human Inspector editing and real causal renderer evidence | Blocked | Forms/graph integration implemented; browser proof pending |
| Editable demo interaction, constrained quality and Null browser acceptance | Blocked | Generation/save/reopen passes locally; interactive GPU proof pending |
| Full clean cross-platform build, regression suite, image review and closure | Blocked | Existing checks plus M9 await functioning CI |

M9: **2/8 = 25%** acceptance. Weighted project progress: **56%**, including two
points of partial M9 credit; the completed-through-M8 baseline remains 54%.
Implementation volume is not counted as verified completion.

## Local evidence

96 Node tests pass, zero failures, using the previously verified M8 Wasm binary.
The six clean-build/HTTP startup tests require Cargo and remain unexecuted locally.
This environment has no usable pinned Rust/.NET/Chromium toolchain; CI is required
for their complete current-source proof. 16 schema documents, 55 semantic tools,
three architecture rules, binding consistency and daemon parity pass.

Planner benchmark (CPU plan only, not full-frame/GPU performance):

| Tier | Instances | p95 ms | Budget ms | Opaque batches |
| --- | ---: | ---: | ---: | ---: |
| Low | 128 | 0.843 | 4 | 1 |
| Medium | 512 | 2.361 | 12 | 1 |
| High | 1024 | 4.254 | 24 | 1 |

## CI recovery

Previous private-repository runs failed before runner allocation. The user's
billing capture showed 2,000/2,000 included Actions minutes consumed. The owner
explicitly authorized making Krozzeo/AxiomEngine public; GitHub settings confirmed
public visibility on 2026-10-04. No spending or payment setting was changed.

Isolated M9 retry, run 37154131553, attempt 3, job 111327955414, acquired a
GitHub-hosted runner and began executing its setup steps. The account quota
blocker is resolved for this public run; GPU acceptance is still pending.

CI triggers on PRs, main pushes and manual dispatch. Milestone updates no longer
duplicate push and pull_request runs; concurrency cancels superseded revisions.
All test matrices remain intact. Complete the isolated GPU gate, fix actual
failures, run the full latest-source suite, review images and publish closure.

## Risks and remaining work

WGSL compilation, GPU binding validation and visual output have not been executed.
Do not present the demos or renderer as working GPU acceptance. Browser assertions
may require correction against observed images. Foundation scope/limits are explicit
in ADR-0022; no physical GPU frame-rate claim is made. Existing M2–M8 browser jobs
and C# development/AOT jobs remain required. Do not merge any milestone PR.
