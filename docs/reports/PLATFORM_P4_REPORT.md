# Platform P4 — Game Engine consumer report

2026-10-21. Review candidate over P3, branch feat/p4-platform-product. Engine 0.0.53/SDK 8, Platform 0.1.3/IPC1/native format1. Public provider149403753092f24a684d0241fe2aa7762abf7bc0 pinned through HTTPS/integrity. Main/recovery refs unchanged; P2/P3 unmerged status and prior CI failures remain separate.

Hosted creation now explicitly requests dimension3 so existing Engine preset supplies Cube/Directional Light/configured Camera and scene settings. New physical3D scenes already use the preset; low-level empty fixtures/legacy user scenes stay intact. Added atomic project.rename for active and closed projects, preserving identity/content/extensions and revision/save metadata, refusing dirty/busy/stale changes. Shared stable options primitive is consumed by the editor and included through the public installed provider build. Remaining default PMD prompt uses English.

Local focused adapter3/3 verifies incompatible/no-write, lease/lifecycle/buffer handling, starter graph and active/closed rename preserving scene/identity. Full final npm run check and joint browser tests are recorded with the final candidate revisions. Platform check29/29 and browserP1/P2/P3/P4 cover actual product sessions, rename/removal/re-add/reviewed deletion, compatible version update/defer/new-version reopen/rollback, Settings/accounts/themes/keyboard and controlled chooser errors with no pageErrors. Dark/light screenshots visually reviewed.

Open gates: standalone exported game cannot be tested because current Engine has no game build/export pipeline. Direct editor startup is proven but distinct. Actual Windows chooser interaction and fresh-machine missing-runtime download require separate acceptance. Controlled GitHub/AI/Null do not prove native PAT, real model quality/cost or GPU. Earlier Engine CI 336 (43/46) failures M17/M18.3.11/aggregate, #47/#51/#55 and dense physics performance remain pending. P4 remains a candidate, not fully closed. Unity/shaders/GPU M19–M40 receive no functional credit.

## Final local regression

Game Engine npm run check:446/446 Node, no failures/skips; build, tool catalog, bindings, schema, architecture and daemon parity passed. Scripting reference drift check passed. Platform check:29/29 with real Engine, no failures/skips; browsers P1/P2/P3/P4 passed with pageErrors:[], controlled HTTP/picker and Null. Documentation links passed in both repositories. These results do not claim old full browser CI failures are fixed or the remaining P4 manual/export gates passed.
