# M6 — Transactional AI Workspaces

Status: complete. M6: 8/8 (100%). Weighted whole-project completion: 41%.

| Requirement | Evidence / status |
| --- | --- |
| Immutable snapshots and COW overlays | Passed: base sharing, private scene/resources |
| Explicit agent scope; source unchanged | Passed: MCP direct source edits denied |
| Reviewable change sets and causal log | Passed: bounded pages, human review in Chromium |
| Isolated run and continue | Passed: scoped preview, renderer capture and return |
| Human acceptance and source conflicts | Passed: current review, one undoable draft, stale/concurrent edits denied |
| Reject without private leftovers | Passed: overlay empty and original source bytes unchanged |
| Recovery and failed publication rollback | Passed: restart and injected publication failure |
| Integrated documentation and regression gates | Passed: contracts, ADR, handoff and full CI |

## Implemented behavior

Agents edit private proposals. Humans inspect differences, run proposals,
continue editing, reject them or accept a reviewed revision. New assets and
compiled scripts stay isolated until acceptance. Acceptance creates one undoable
source draft change; Save persists explicitly. Idle proposals survive restart.

## Automated evidence

Release code commit 960bc7b966ff84a24854b5c398d9bcbfb417a952 passed all ten jobs:
https://github.com/Krozzeo/AxiomEngine/actions/runs/36475358942

68 Node tests pass on Linux and Windows; 25 Rust tests, formatting and Clippy
pass. Fourteen schemas, 48 generated semantic contracts, script bindings, three
architecture rules and native protocol parity pass. C# development/AOT execution
passes, including Windows development. M2–M6 Chromium regressions pass.

Eight workspace tests cover COW isolation, accept/undo/save, stale review/source
conflicts, idle recovery, preview, unsafe IDs/links, failed-publication rollback
and a source mutation during asynchronous validation. The browser workflow uses
an external MCP process and actual human editor controls. It compiles a private
C# script, accepts it with an asset, saves, restarts and executes that script.
All seven browser criteria pass with zero page errors. Review and accepted-project
screenshots were inspected. Raw report: m6-browser-evidence.json.

## Manual tests

None. The acceptance workflow is automated with real Chromium/WebGPU and C#.
Software Vulkan provides functional coverage, not physical GPU benchmarks.

## Boundaries

See M6_WORKSPACES.md and ADR-0019. Acceptance changes the source draft; Save
persists. Idle proposals recover; runtime and undo history do not. No automatic
merge, arbitrary Git operation or crash-atomic multi-file transaction is claimed.
PR #6 is stacked on #5 and remains unmerged. M7 Physics Foundation is next.
