# M6 — Transactional AI Workspaces

Status: verification in progress. Whole-project completed milestone weight: 36%.
M6 adds 5% on closure; no full milestone credit until CI/browser evidence passes.

| Requirement | Evidence / status |
| --- | --- |
| Immutable snapshots and COW overlays | Passed seven local workspace tests |
| Explicit agent scope; source unchanged | Unit evidence passed; MCP browser gate pending |
| Reviewable change sets and causal log | Implemented; schema checks passed; UI gate pending |
| Isolated run and continue | Unit evidence passed; renderer browser gate pending |
| Human acceptance and source conflicts | Unit evidence passed; UI/C# resource gate pending |
| Reject without private leftovers | Unit evidence passed; UI gate pending |
| Recovery and failed publication rollback | Passed restart and injected-failure tests |
| Integrated documentation and regression gates | In progress |

## Automated evidence

Seven proposal tests and ten existing agent/scene tests pass locally. Fourteen
schema documents, 48 semantic contracts, generated script bindings and three
architecture rules pass. Remote CI is validating full Node/Rust and browser
regressions, with actual C# compilation and proposal acceptance.

## Manual tests

No user-only gate identified. Browser and runtime acceptance are automated in CI.

## Boundaries

See M6_WORKSPACES.md and ADR-0019. Acceptance changes the source draft; Save
persists. Idle proposals recover; runtime and undo history do not. No automatic
merge, arbitrary Git operation or physical GPU benchmark is claimed.
