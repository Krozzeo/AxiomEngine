# M18.3.10 / 0.0.48 — scenes, services and typed references

## Outcome

Physical .scene authoring, active/additive editor scenes, explicit saved-pref Inspector bindings, typed component/custom-script/file references, independent lockable Inspectors and SDK 7 presentation, grid navigation, HTTP and platform services are implemented. Runtime creation no longer has a cumulative 64-object quota. Hub Save waits for pending scene work; audio controls preserve authored values.

## Acceptance criteria

All required release criteria passed:

1. Hub opens and dismisses; obsolete create/open and diagnostic menu entries are absent.
2. Locked and duplicated Inspectors retain independent targets; compatible Transform, custom MonoBehaviour and physical file references persist through drag/drop without changing selection.
3. Actual C# resolves assigned references during Play.
4. Duplicate and common Close Tab actions work.
5. Physical scenes open additively, activate cameras/views, collapse to headers and retain their file after Close Scene; focused Node tests cover undo and invalid-open atomicity.
6. Explicit PlayerPref bindings display saved values after Stop without preserving arbitrary runtime state.
7. A real C# coroutine sends HTTP through the browser bridge to a separate controlled server and completes without cookies/authorization.
8. Presentation facades update rendering and live Inspector without a runtime fault.
9. Actual grid navigation follows an obstacle-detour route and publishes movement.
10. 2D stress reaches 16 dynamic bodies plus floor without fault.
11. 3D stress reaches 96 dynamic bodies plus floor across frames, exceeding the former lifetime-64 quota without fault.

## Automated evidence

[CI 312](https://github.com/Krozzeo/AxiomEngine/actions/runs/39167566684) passes all **41 jobs** at executable commit `5eb5ecbf9408975b202651cae62eab3e5e80ac8c` (tree `0a3bcae34aca9731c1fd80e15ff5bbfa037456e3`): **411 Node tests on Linux and Windows**, **44 Rust tests** with fmt/clippy and Wasm checks, real **C# Linux development/AOT and Windows development**, and **32 browser groups**. SDK 7 passes **51 assertions** in each C# configuration. The new browser acceptance passes **11 criteria**. No paid model calls.

Focused local suites pass 32 tests covering audio, authored scenes, typed references and HTTP/platform services. Local real C#/Wasm SDK 7 checks pass 51 assertions; input/scenes regression passes four groups; M16 and M16.1 editor regressions pass. Local Windows browser rendering can use Null; rendered acceptance is provided by the CI software-WebGPU browser runs, not a physical-GPU performance claim.

During closure, fixed authored audio contamination and a Save command that could silently skip while a background scene update was busy. Regression tests reproduce both cases. Old browser tests were updated for Hub/menu navigation, explicit Inspector selection, initialized gameplay and the independently published physics status.

## Manual tests requested

None for this release's automated acceptance. Real-account model quality/actual token usage and physical-device FPS are separate measurements; no paid provider calls or universal FPS claims were made. Previously validated Player examples need no repeat validation.

## Known limitations and risks

All nine API families remain partial. Read [the explicit compatibility matrix](../scripting-api/STATUS_0_0_48.md) and [member reference](../scripting-api/INDEX.md). Grid A* is not triangle NavMesh baking; HTTP is not multiplayer; resident LoadAsync is not streaming; JsonUtility is restricted to supported public-field shapes. Live limits remain 1024 entities, 256 active physical bodies, 32 script attachments and 128 operations per SDK dispatch. PlayerPrefs is project/origin browser storage. Locks are session state.

An earlier M18.2 Apply browser run timed out; the final executable revision passes the same flow locally and in CI without a runtime change to Apply. Preserve this intermittent timing observation for M19 hardening rather than claiming that one passing run proves its cause eliminated.

## Completion and next work

This correction is complete (100% of its scoped acceptance). All nine scripting API areas remain partial against their full Unity categories; no whole-Unity compatibility percentage is claimed. Historical weighted MVP remains approximately **94% (122/130)**; expanded SDK/Hub scope is unweighted. M18.4 GitHub integration and M19 hardening have not started. PR #39 remains draft/open/unmerged, stacked on #38; do not merge automatically. Live-account model quality/actual usage remains a separate acceptance gate.

Before the next API batch, agree exact members/overloads and classify tested, feasible pending, subsystem-dependent and excluded scope. M18.4 and M19 remain roadmap milestones after the applicable acceptance gates. AI Master is planned.

## Demos and delivery

Eight editable projects: References/Inspectors, Scenes/Resources, Input/Persistence, Physics 2D stress, Physics 3D stress, Navigation, Presentation, Platform/Network. Use `npm.cmd ci`, `npm.cmd run demo`, `npm.cmd run dev`. [Controls and limits](../../demos/M18_3_10_GUIDE.md). User projects are preserved.

Executable source: [pinned ZIP](https://github.com/Krozzeo/AxiomEngine/archive/5eb5ecbf9408975b202651cae62eab3e5e80ac8c.zip). Documentation closure follows the exact tested executable revision without changing runtime source.
