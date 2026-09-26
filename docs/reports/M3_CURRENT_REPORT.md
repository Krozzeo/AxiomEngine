# M3 — Asset Pipeline acceptance candidate

Version 0.0.13. Implementation complete; full CI/browser validation pending.

The acceptance matrix expands master specification section 122 without changing
its goal: source texture changes rebuild only dependents and refresh the scene
without restarting the editor.

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Versioned Asset DB, stable IDs and source hashing | Local tests passed; CI pending |
| 2 | Dependency graph, selective build and persistent derived cache | Local tests passed; CI pending |
| 3 | Background importer jobs, cancellation and revision-safe commit | Local tests passed; CI pending |
| 4 | Image, static GLB and audio source importer API | Local tests passed; CI pending |
| 5 | Texture replacement hot reloads dependent scene resources without restart | Browser pending |
| 6 | whyAssetNotLoaded, whyWasRebuilt and whatUses diagnostics | Local tests passed; browser pending |
| 7 | Failed updates preserve state; undo, save and restart preserve identity | Local tests passed; browser pending |

Four new Node tests cover the pipeline; all fourteen targeted pipeline, asset and
scene tests pass locally. Schema/architecture/M0 parity checks pass. The current
local sandbox cannot launch the Rust compiler successfully; full pinned Rust and
clean-build checks run in GitHub CI. Do not claim this local build passed.

M3 remains in progress; no completed-milestone delivery yet. M0–M2 remain complete
and accepted whole-project weight remains 18% until the M3 acceptance gate closes.
See ../architecture/M3_ASSET_PIPELINE.md for the contract and limitations.
