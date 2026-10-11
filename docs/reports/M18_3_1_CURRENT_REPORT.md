# M18.3.1 — Create, Players and task-chain repair

Release 0.0.39. Validation in progress; this report is closed only after the executable CI checks pass. This correction adds no roadmap weight: expanded MVP remains approximately 94% (122/130). Next milestones remain M18.4 GitHub integration and M19 hardening.

The public command bus omitted scene.example.create even though the workspace implemented it. The route is now registered and regression tests call the real public bus for all four Players and nine implemented component presets. Audio Source creates a valid silent replaceable WAV when no audio asset exists; adding a listener disables the prior active listener. Planned Video and 3D Particles remain disabled.

Create Players produces ordinary editable instances, not prefab links. An empty physical/script/audio root owns Graphics and, for 3D, Camera children. Freeze rotation is editable. First-person camera position follows the rotated body offset, including a 180-degree turn. Third-person TurnSpeed controls gradual facing. Mouse capture/movement are handled by the detached Game canvas's document; Escape and Stop release capture. Prefabs are created explicitly by dragging a Hierarchy subtree into Project. Original children remain a locked prefix; additional children can only follow that prefix. JSON files open in the multi-tab IDE; selecting prefab files no longer shows raw JSON below Project.

Audio Source runtime controls stay inside its card; redundant runtime volume and JSON polling are removed. Scene draws forward arrows for cameras and directional lights. PMD operations are grouped under a compact Document control, leaving space for chat and document; its composer grows from one to ten lines before scrolling.

## Supplied TasksChain analysis

The first two tasks completed (39,670 and 121,240 tokens). The third failed after 120 requests/187 tools and 658,585 tokens. It repeatedly used invalid SDK/document-read arguments, guessed APIs, attempted RigidBody before Collider, and ran game tests while the live editor had not reached the proposal revision. Interleaved successful queries let invalid discovery attempts continue.

The host supplies exact private schemas, actual movement/physics SDK contracts and entity component/parent summaries. Qualified SDK members resolve correctly. Invalid SDK/file reads return the correct schema; three invalid calls to the same contract stop the task even with intervening queries. Runtime verification waits for the connected editor to reach the exact proposal revision before dispatch. If the editor is unavailable, it stops and retains the authored proposal instead of spending provider turns on repeated checks. Failed checks are not reported as verified results. These controlled regressions establish bounded failure behavior, not a promised live token cost.

## Validation

Pending current CI closure. Local cached-Wasm build, schemas, tool catalog, bindings, architecture and daemon parity pass. Browser acceptance exercises real .NET Player workers, actual Create menu, Freeze rotation, prefab capture/order/JSON IDE, PMD layout, keyboard and detached pointer capture. No billable model requests are made by these automated checks.
