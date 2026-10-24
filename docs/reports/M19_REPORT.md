# M19 — Complete audit and compatibility contract

Engine0.0.57 / SDK8 / native formats1. Local audit acceptance: **4/4 (100%)**. This is a review candidate; exact-head remote CI, main integration and release publication are separate. M20–M40 implementation remains pending.

## Outcome

M19 supplies a reproducible, attributed baseline and an executable observation harness. Help → Compatibility Observatory searches the actual frozen inventory with bounded, authenticated read-only queries, filters and pagination. The editable demo uses normal project/scene/script/resource APIs, real C#/Wasm execution and Play/Stop restoration. It does not implement pending Unity APIs or a GPU solver.

The approved base was consolidated first, with passing CI and explicit owner authorization:

| Repository | PR | Main merge |
| --- | --- | --- |
| Game Engine | [#59](https://github.com/Krozzeo/AxiomGameEngine/pull/59) |791c54a509f759777ecf2266c86fce80d2275920 |
| Platform | [#9](https://github.com/Krozzeo/AxiomPlatform/pull/9) |7c03b7fc6f25fdceeda645bd1bf33534751e68e9 |
| Math Lab | [#2](https://github.com/Krozzeo/AxiomMathLab/pull/2) |4171441658640a6d8da29dcdcee5b27888a3aa75 |

Engine#54/#56/#57/#58 were closed only after checking their exact heads were ancestors of main. Recovery refs were not changed. Platform's consolidation included a Windows path-canonicalization test correction, not a production change.

## Acceptance criteria

| Required audit criterion | Result | Evidence |
| --- | --- | --- |
| Stable identity, provenance and assignment for every captured record | Passed | Frozen manifests, hashes, PE declaration facts, source-page ledger, generic/nested identity, overload/default/accessor/obsolete metadata and inheritance graph; validators preserve all rows |
| Separate declared surface, behavior, restrictions and packages | Passed |49,471 declared managed profile signatures;40,126 overlapping published reference records;75,743 separate package UIDs/126 recommendations;29 unavailable package inventories stay blocked |
| Positive/negative/lifecycle harness and first measured coverage/relative weighting | Passed | Real editable C#/Wasm corpus, authenticated UI/API tests, Stop restoration; strict source/behavior baseline and per-area signature shares |
| CPU/GPU profiles, fallback/blocked matrix and frozen reproducible thresholds | Passed | [Contract](../compatibility/CONTRACT.md), [profiles](../compatibility/PROFILES_AND_GPU.md), [workloads](../compatibility/workloads.json); no GPU throughput or shader compile-only credit |

Package blockers and unexecuted device/reference profiles are **results of the audit**, retained for M37/M39 acceptance. They do not become implemented features or disappear from coverage. The ABI is an explicit Windows-editor plus Android/iOS-extension profile, not an assertion that every Unity platform assembly was executed. The complete published catalog remains alongside it; M39 cannot close on a convenient profile alone. The separate6.6 artifact is a type-navigation delta, not a member-level upgrade contract.

## Automated evidence

- Final full Engine check:455/455, including build,18 schema documents, bindings, tools, architecture/parity and tests. Inventory/security suite5/5; Rust workspace44/44. Final integration/remote results remain separately attributed.
- Joint Platform regression:52 passed,0 failed,1 opt-in native Recycle Bin check skipped; no live-account claim.
- Parser fixtures:4/4; cover canonical generics/nesting, category/overload/tombstone retention, family assignment and package UIDs. Both.NET metadata/surface tools compile with0 warnings/errors.
- Real M19 browser acceptance passed with no page errors:27 named observations executed,25 pass and2 expected discrepancies. All three inventory scopes are exercised. Stop restores the complete authored scene. [Machine-readable runtime evidence](../compatibility/evidence/development-wasm.json).
- Two genuine conformance failures remain: Transform wrapper equality fails despite matching instance IDs; Destroy invalidates immediately during the current Update rather than deferring destruction. Assigned to M20/M22. A passing harness means these discrepancies are detected correctly; `conformancePassed` remains false.
- [CPU/Wasm diagnostic smoke](../compatibility/evidence/cpu-wasm-smoke.json):16/64/256 separated bodies,1,000 steps each, approximately0.006/0.012/0.032ms per step in this run. This is a small scalar/bridge workload, not dense collision, editor FPS, full-duration GPU contract or hardware performance acceptance.
- No Unity6.3 execution-oracle comparison, M19-specific AOT corpus, physical GPU benchmark, paid model call or live GitHub account operation is claimed. Existing product CI profiles remain separately attributed.

The final delivery validator distinguishes local completion from upstream CI/publication. Earlier failed fixture assertions and a concurrent Engine/Platform rebuild collision were corrected/retested; they are not reported as successful runs. Engine and Platform checks must run sequentially when sharing the same built editor directory.

## Manual tests requested

None required for the M19 audit. The [demo guide](../../demos/M19_GUIDE.md) is available for exploration. Physical GPU/device, exact Unity execution comparison and later API implementation gates remain explicit future acceptance work, not user actions silently required to claim this audit.

## Limits, percentages and next step

The strict verified full native-source and behavior-signature baseline is0%. Existing useful SDK aliases are partial:1,120 declared ABI records have owner/name candidates, without overload/behavior certification.25 successful corpus observations are not25 fully accepted Unity signatures. Do not reuse historical family estimates or94% MVP progress as whole-API coverage.

[Relative signature weights](../compatibility/SCOPE_WEIGHTS.md) now quantify scope per implementation milestone. Counts are not effort hours; cross-cutting GPU/shader/export work has additional gates. Whole-project effort percentage remains unknown rather than mixing incompatible units. Local M19 audit acceptance is100%; API/GPU implementation receives no new credit.

Next: M20 object/component/hierarchy compatibility, starting with the two observed identity/lifetime discrepancies, then coherent20–40-signature batches. Attach exact target IDs/overloads, engine/C# bridge behavior, positive/negative/lifecycle tests, editable demo and documentation before certifying a batch. Keep shared account authority, reviewed AI Apply, native formats, user files and recovery refs intact.
