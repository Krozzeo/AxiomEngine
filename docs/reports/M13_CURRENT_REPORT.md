# M13 — Profiler closure

M13 (0.0.25) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 76% (79/104 roadmap weight points).
The Profiler tab and readonly semantic tools share bounded frame history,
main/worker/wait scopes, sampled GPU passes and median/MAD spike explanations.
Observed contributor increases are separated from overlapping waits and unavailable
GPU evidence. Pause/Clear never pause the game or mutate authored scenes.
Snapshot loading and late GPU replies cannot contaminate a new session.
Two editable demos include a real C# 140ms pulse and independent 2D pass timing.
All 22 jobs in CI run 37259458544 pass at executable commit
0ef4db00bf6b6bc4ec4d016b5d5ddd3f31b02190 (tree 4b247daa5f2a5786ca2ad002cd3f8cb4fdc4118d).
152 Node and 39 Rust tests, eight new browser criteria and earlier regressions pass.
Final profiler screenshots were reviewed. No user-only test remains.
Read docs/reports/M13_CURRENT_REPORT.md, docs/architecture/M13_PROFILER.md,
ADR-0026 and demos/M13_GUIDE.md. Next: M14 automated game testing.
PR #15 is ready for review, stacked on unmerged #14; do not merge automatically.

## Acceptance

| Group | Status | Evidence |
| --- | --- | --- |
| Structured CPU profiling | Passed | real main scopes, .NET worker dispatch, overlapping roundtrip and explicit timing semantics |
| GPU timestamp instrumentation | Passed | bounded asynchronous legacy, HDR compute/render/post and 2D passes; exact retained-frame replies |
| Bounded history and sessions | Passed | 120 records, paginated byte bounds, copies, eviction, reset and snapshot preparation guard |
| Comparison and contributors | Passed | compatible prior median/MAD, known CPU/GPU regressions, positive deltas and unavailable/inconclusive results |
| Human and semantic API | Passed | identical measured results, frame selection, direct contributor list, readonly MCP tools and stale lease rejection |
| Lifecycle and gameplay | Passed | Pause/Clear leave gameplay running; Stop and edits reset; Null, scripts, audio and proposals remain isolated |
| Editable demonstrations | Passed | real C# pulse, five sprites, actual timestamp routes and canonical save/reopen/preservation |
| Regressions and closure | Passed | 22/22 jobs, reviewed screenshots, scoped benchmark and synchronized documents |

## Automated evidence

https://github.com/Krozzeo/AxiomEngine/actions/runs/37259458544

152 Node tests on Windows/Linux and 39 Rust tests pass. Rust formatting, Clippy
with warnings denied, core Wasm checks and release build pass. Sixteen schemas,
78 semantic tools, generated C# bindings, three architecture rules and daemon
parity pass. Eight M13 browser criteria exercise stopped preview, actual pulse,
human/agent equivalence, collection pause, sampled timestamps, Clear/Stop,
HDR multi-pass profiling, 2D separation and Null. Earlier M2–M12/correction and
Windows/Linux development/Linux AOT C# regressions pass. Page errors and unexpected
console/HTTP failures are empty. Audio acceptance checks precise stale-PCM lease
rejections separately; they are required invalidation, not playback failures.

The controlled worker pulse adds 141.33ms over its observed baseline.
Its overlapping script roundtrip is explicitly not summed. Main work remains a
separate metric. Unit regressions independently verify a known GPU contributor,
insufficient baselines, missing timestamps, outliers and generation/readback races.
Legacy, HDR, 2D and Null screenshots were reviewed after actual interaction.
Two earlier timing-sensitive browser jobs (M2 placement and M11 periodic capture)
were rerun on the same executable; the final run passes all 22 jobs.
Exact executable provenance is preserved in adjacent evidence JSON. Closure changes
documentation/evidence and the 2D reference-sprite display name only after
executable acceptance. The display correction does not change runtime behavior.

At history capacities 120/240, profiler append p95 is 0.0151 / 0.0153ms for eight scopes.
The benchmark measures bookkeeping/history/comparison, excluding rendering, GPU,
C#, operating-system scheduling and full-frame FPS. Fixed admission bounds are
20ms append / 100ms query+explain; both pass. Histories are limited to 20 records
and 15,000 bytes per page, explanations to eight contributors / 16KiB.

## Manual tests

None required. Equivalent automation proves the real pulse, measured timestamps,
UI/API identity, lifecycle, persistence and regressions. Hardware GPU performance
and OS thread CPU are not acceptance claims or user release gates.

## Demos, limits and next task

Run npm.cmd ci, npm.cmd run demo, npm.cmd run dev. Open an M13 demo from
Archivo → Proyectos and select the Profiler tab. Frame Spike Lab: Play, wait for
baseline, focus viewport, press 1 once and pause collection shortly after to retain
the pulse; arrows move its cube. 2D Pass Timing previews five editable sprites and
its independent GPU pass. See demos/M13_GUIDE.md. Preserve the complete
.axiom/projects folder, including assets/scripts. Repeated generation preserves
existing projects and creates copies.

Elapsed includes waits; synchronous intervals include preemption and do not claim
OS thread CPU. GPU totals cover sampled instrumented passes, excluding queue waits
and skin compute. Missing timestamps are null with reasons, never fabricated zero.
Baselines require eight earlier measured comparable frames. History is transient.
No allocation/call-stack sampling or physical-device performance certification.
Native daemon remains M0; full authoring and profiling use the Node bootstrap.

M13: 100% (8/8). Approximate normalized project completion: 76% (79/104 weight points).
The reporting table previously claimed a 100-point total but actually sums to 104;
this closure corrects arithmetic without changing scope or relative weights.
Earlier reports retain their historical nominal estimates.
Next: M14 automated game testing, planned 0%. PR #15 ready, stacked on #14, unmerged.
