# M9 — implementation checkpoint; acceptance blocked

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
| PBR/HDR, lights and environment produce correct pixels | Blocked | Browser test authored; CI never assigned a runner |
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

## Concrete CI blocker

Run 37153467939 at initial implementation SHA
65ce4fda49875733fce6bbb586c3325108ef723d failed before any job acquired a runner.
The M9 job 111291919524 has no steps, an empty runner name and runner_id 0.
One isolated re-run was requested; attempt 2, job 111292384937, again failed with
no runner or steps. Job-log requests returned BlobNotFound; no build/shader
failure log exists.

User-provided GitHub Annotations capture confirms an account billing restriction:
the job was not started because recent account payments failed or the spending
limit needs to be increased. The annotation does not distinguish the two causes.
The repository is private. Account owner must inspect Billing & plans, Actions
usage/budgets and payment status; no payment or spending change is authorized.
The Ubuntu 26 migration notice is informational and does not explain this failure.

The GitHub connector cannot change account billing. User-only gate: inspect
https://github.com/settings/billing and resolve the reported account restriction,
or provide the Actions budget/payment status needed to choose a next step.
Do not keep retrying jobs before that restriction changes. No engine manual test
is requested yet.

CI now triggers on PRs, main pushes and manual dispatch. It no longer duplicates
every milestone update through both push and pull_request; concurrency cancels
superseded revisions of the same PR. All test matrices remain intact. This config
and billing checkpoint are committed with [skip ci] while the restriction persists.
After the account/runner blocker is resolved, rerun CI for the latest branch,
fix actual failures, review screenshots, update closure docs and release source.

## Risks and remaining work

WGSL compilation, GPU binding validation and visual output have not been executed.
Do not present the demos or renderer as working GPU acceptance. Browser assertions
may require correction against observed images. Foundation scope/limits are explicit
in ADR-0022; no physical GPU frame-rate claim is made. Existing M2–M8 browser jobs
and C# development/AOT jobs remain required. Do not merge any milestone PR.
