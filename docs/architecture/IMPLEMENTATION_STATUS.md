# Confirmed implementation status

Current branch candidate: **0.0.53 / SDK 8 / Platform P4**. P1 is integrated/accepted; P2/P3/P4 are stacked review candidates. Protected recovery/pre-restructure-0.0.52 remains e264ca835de14daf4fe964be6a78be5e4646ad14. Main has not been advanced by this delivery.

| Area | Confirmed behavior | Remaining limits |
| --- | --- | --- |
| Editor/Hub |2D/3D scenes/resources/multiple Inspectors/docking; P4 unified project/session Hub/Settings/lifecycle | Older browser CI regressions remain independently tracked |
| Renderer | WebGPU/Null and first-scene initialization fix from M18.3.12 | Null does not prove physical GPU quality/performance |
| Scripting | C# runtime, SDK 8, own documented bindings | Not full Unity parity; M19 full member audit/denominator pending |
| Physics | CPU/Wasm2D/3D and stress demos | Dense whole-editor performance unresolved; GPU physics not implemented |
| AI | Semantic tools, isolated proposals, human review/Apply/PMD; P3 generic infrastructure shared | Real-model quality/cost and contract-specific limitations |
| GitHub | Session account, project destinations/preferences/autosave/review/publication/history | Native real-account acceptance deferred; TestRepo testing-only |
| P4 distribution | Relocatable prepared Windows launcher, dependency checks/local runtimes/browser/error console, local installation activation/rollback | Fresh-machine download/manual picker acceptance separate; no signed online product registry |
| Build/export | Direct independent editor startup | No standalone game build/export pipeline; P4 exported-game gate open |
| Shaders/compute/GPU physics expansion | Approved dependencies/batches |0% new acceptance; future M25/M26/M28/M30/M39/M40 |

## Evidence

P3 local check445/445 and Platform 21 with controlled HTTP/Null. Earlier0.0.52 had438 Node/44 Rust/18 browser groups locally; CI 320 (42/45) with M18/M18.2/M7 failures. Later consolidation fixed stale bridge adoption with deterministic regression tests and 441 Node; historical CI 329 (46/46) did not prevent later M17/#51 failure. P3 final CI 336 (43/46) failed M17/M18.3.11/aggregate; #47/#51/#55 remain separate.

P4 local final evidence is recorded in [its report](../reports/PLATFORM_P4_REPORT.md). Never substitute old successful runs for current checks or fixtures for manual/hardware evidence. Dense1024-body historical Null editor measured about5.1FPS; isolated CPU benchmarks are not editor FPS or GPU results.

## Planning

45 main milestones,23 historically closed,22 pendingM19–M40. M18.4 closed in the explicitly agreed scope with native account validation deferred (ADR0034). M19 audit remains next product expansion, independent of Platform P5 when interfaces allow. The historical94%(122/130) refers only to original MVP weighting; expanded global/complete Unity coverage remains unquantified. [Roadmap](ROADMAP_M19_M40.md), [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md), [handoff](../AI_HANDOFF.md).
