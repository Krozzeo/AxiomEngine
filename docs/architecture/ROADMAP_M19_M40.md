# Expanded roadmap — M19 to M40

Owner scope decision2026-10-19, maintained English edition2026-10-21. These are **Game Engine** milestones; Platform P0–P5 is independent and does not replace/credit Unity/shaders/GPU work. M18.4 closed under ADR0034 with native real-account validation deferred. M19 audit is implemented in the0.0.57 review candidate; [report](../reports/M19_REPORT.md).

## Scope and progress

21 new compatibility milestonesM19–M39; formerM19 MVP Hardening moved in full to finalM40. Preserve M18.4. Total 45 main milestones (M0–M40 plusM18.1–M18.4),23 historical closures plus locally accepted M19;21 implementation milestones M20–M40 remain. M18.3.x corrections are not additional main milestones. Order: M18.4→M19→M20–M39→M40, respecting the dependency graph; independent work may proceed without claiming closure.

Implement all or almost all of the frozen public Unity 6.3LTS(6000.3) Scripting API through Axiom's own functional implementation. Unversioned docs were observed at6.6 on2026-10-18; track that delta separately. M19 freezes snapshot/hash/full signature denominator, overload/inheritance/obsolete handling, ownership and priorities. Include runtime **and editor**, not only gameplay families; packages have separate fixed versions/inventories.

FutureM39 target: >=95% verified core public target signatures and 100% P0. Retain complete denominator with partial/blocked/excluded/platform-restricted members visible; never remove unsupported APIs to reach the target. Publish total/profile/package metrics separately. If dependencies prevent the target, keep the gate blocked or obtain an explicit scope decision.

Historical94%(122/130) is original MVP only. M19 publishes [strict coverage and relative signature scope](../compatibility/README.md). Whole-project effort remains unestimated: signature counts cannot be added to historical MVP effort points. Prior conversational per-area percentages were planning estimates, not measured baselines. Platform documentation/refactoring adds no API acceptance.

| Milestone | Main delivery | Minimum dependencies |
| --- | --- | --- |
| [M18.4](M18_4_PLAN.md) | GitHub integration for game projects | M18.3.10 |
| [M19](M19_PLAN.md) | Complete audit and compatibility contract | M18.3.10 |
| [M20](M20_PLAN.md) | Compatible objects, components and hierarchies | M19 |
| [M21](M21_PLAN.md) | Mathematics, geometry and utilities | M19, M20 |
| [M22](M22_PLAN.md) | Lifecycle, time, events and asynchrony | M20, M21 |
| [M23](M23_PLAN.md) | Serialization, ScriptableObject and prefabs | M20, M22 |
| [M24](M24_PLAN.md) | Scenes, resources, asynchronous loading and memory | M22, M23 |
| [M25](M25_PLAN.md) | 3D physics geometry, queries and compute infrastructure | M20, M21, M22, M24 |
| [M26](M26_PLAN.md) | 3D CPU/GPU advanced solver and controllers | M25 |
| [M27](M27_PLAN.md) | 2D physics geometry and queries | M20, M21, M22 |
| [M28](M28_PLAN.md) | 2D CPU/GPU joints and advanced simulation | M27, M25 |
| [M29](M29_PLAN.md) | Input and devices | M20, M22 |
| [M30](M30_PLAN.md) | Graphics, shaders and GPU resources | M21, M23, M24, M25 |
| [M31](M31_PLAN.md) | Animation, rigging and Playables | M22, M23, M30 |
| [M32](M32_PLAN.md) | Audio, mixing and processing | M22, M24 |
| [M33](M33_PLAN.md) | UI, text, layout and events | M22, M23, M29, M30 |
| [M34](M34_PLAN.md) | 2D/3D worlds, particles, terrain and video | M24, M25, M27, M30, M31, M32 |
| [M35](M35_PLAN.md) | NavMesh and complete navigation | M21, M24, M25 |
| [M36](M36_PLAN.md) | Networking, HTTP and multiplayer | M22, M23, M24 |
| [M37](M37_PLAN.md) | Platforms, native APIs and specialized devices | M19, M22, M24, M29, M30, M32 |
| [M38](M38_PLAN.md) | Editor APIs, assets, extensions and builds | M20, M23, M24, M30, M33, M37 |
| [M39](M39_PLAN.md) | Remaining modules, packages and full conformance | M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38 |
| [M40](M40_PLAN.md) | Final stabilization, product and end-to-end acceptance | M18.4, M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38, M39 |

## GPU and shader extension

Required batches: M25.0 compute WGSL/bridge/resources; M26.4–26.6 GPU3D prototype/contact generation/solver; M28.4–28.6 GPU2D kernels/solver/API; M30.4 shared shader system; M39.4 cross-backend conformance. M19.3/M27/M40.2 expand contracts/reference/hardening. Nine new batches, no added main milestones. M25 depends onM24; M28/M30 reuseM25. M25.0 precedes solvers without waiting for allM30, avoiding a cycle. [Detailed plan](GPU_PHYSICS_AND_SHADERS_PLAN.md).

CPU/Wasm stays available. Auto requires capabilities, compatible scene features and measured benefit. GPU physics needs production WGSL compute, coherent queries/callbacks/scripting and physical hardware evidence; WebGPU rendering or Null does not prove it. Current dense-physics/editor/bridge issues remain pending independently.

## Execution and closure

AllM19–M40 start planned/not_started/0% new acceptance; SDK 8 retains existing partial coverage. Attach exact assigned signatures/dependencies/contracts/tests before implementation. Work in vertical batches, roughly20–40 signatures when coherent, each including engine/C# bridge, tests, editable demo and docs. Verify real behavior/errors/resources/lifecycle/Play-Stop/persistence across supported profiles. Rendering/audio/devices need actual output; compile-only wrappers/fake properties do not count.

Preserve isolated proposals/human reviewed Apply, user documents, external credentials and explicit publication. Close only with all required evidence and updated README/handoff/state/changelog/matrix/GitHub; no automatic PR merges. Hardware/SDK/service blockers remain visible; browser restrictions need actual backend adapters inM37. Axiom Inspectors do not implement UnityEditor(M38). AI Master remains outside this expansion.

[Manifest](roadmap-v2.json), [project state](../../axiom.project-state.json), [reporting rules](MILESTONE_REPORTING.md), [SDK 8 historical status](../scripting-api/STATUS_0_0_49.md), [tracking issue40](https://github.com/Krozzeo/AxiomGameEngine/issues/40). Prior release reports are historical; current implementation/CI is [tracked separately](IMPLEMENTATION_STATUS.md). Unity references: [frozen scripting API](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/), [UnityEditor](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UnityEditor.html), [type inventory](../scripting-api/unity-6.3-inventory.json) (not the full member audit).

## Platform MVP boundary — standalone game export

Platform MVP closure transfers the earlier P4 standalone exported-game gate to Game Engine. Keep it as a required build/export acceptance item: produce a playable standalone game without a Platform host; verify assets, runtime, scripting and launch behavior. This capability is still missing. Direct editor startup and Math document export do not satisfy it. Schedule its implementation in the existing Engine build/export work; do not add Unity/shader/GPU coverage for this transfer.
