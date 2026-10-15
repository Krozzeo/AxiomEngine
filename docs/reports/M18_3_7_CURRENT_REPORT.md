# M18.3.7 / 0.0.45 — automated acceptance complete

Automated acceptance is complete: [CI 278](https://github.com/Krozzeo/AxiomEngine/actions/runs/38818870923) passes all 38 jobs at executable commit `f3324b9f7396df873c8e161270f88b4728e76089` (tree `238fc50a493b5259a62265e8b8ae21c45b735370`). This includes 378 Node tests on Linux and Windows, 39 Rust tests and native checks, real Linux development/AOT and Windows development C#, and all 29 browser groups. No paid model calls were performed. Live-model quality, the supplied conversational scenarios and actual token usage remain a separate user acceptance gate. Historical MVP coverage remains approximately 94% (122/130 original weights). M18.4 GitHub integration and M19 hardening remain next; PR #36 stays draft/open/unmerged.

## Concrete fixes

The supplied PMD trace reached all four required pages, but completion searched only the parent roadmap body for exact approved criteria. Coverage now includes descendants, normalizes whitespace, exposes the precise missing milestone criteria and directs the next action to the affected roadmap section. Child-section changes count as progress. Approved milestone data is materialized once as child reference sections, so narrative summaries cannot accidentally erase the structured acceptance criteria. Existing prose is preserved. The loop guard remains containment, not an excuse to report success.

Every terminal task now retains a final explanatory response including stop code, completed operations, failed tools, remaining deliverables and proposal isolation, including host budget/no-progress interruptions. Private work contracts can be described directly. Repeated authoritative missing-SDK queries stop before a discovery spiral.

Conversation continuations include real tool calls and outputs from the previous channel-local journal, including after restart. Assistant and PMD histories stay separate. Current project context and saved PMD chat remain authoritative; historical facts are not fresh verification. A bounded context checkpoint compacts automatically near the byte budget, and full evidence remains retrievable through work journals. This is bounded retention, not unlimited context or a guarantee of lower billed tokens.

Require confirmation is per project and panel, default ON. Reads are ungated. The model presents work.propose steps before mutations, then pauses for one human chat approval. OFF still presents the plan and executes. Pending proposals continue automatically. PMD phase transitions must also pass the task gate. Legacy deterministic execution fixtures explicitly preauthorize their scoped scenarios; separate default-gate tests exercise the actual approval mechanism.

The PMD document area is a compact ordered tree plus Markdown editor, independent of chat. Contextual creation, deletion, reparent/reorder, explicit save and Ctrl+S preserve stable IDs. A shared section hierarchy produces titles-only indexes for PMD exports and scripting docs.

## Scripting scope

The first compatibility batch adds live object/component wrappers, writable runtime transform properties, common math/keyboard/time APIs, public virtual lifecycle methods, 2D/3D collision and trigger callbacks, sphere/oriented-box ray queries, runtime activate/instantiate/destroy, and existing audio/Animator adapters. See docs/scripting-api/README.md for exact limitations. The official Unity 6.3 TOC inventory covers 5,429 navigation nodes; it is not a member-complete Unity compatibility claim.

57 reference pages, a titles-only index, a dockable Help/Panel reference browser, canonical JSON and generated Markdown share a source. The full remaining type catalog is explicitly pending/partial. No Unity prose or visual assets are copied.

## Validation boundary

Local Node tests and cached-Wasm packaging are available. Native Cargo, .NET and Chromium must run in CI in this environment. Controlled model responses do not establish live-model completion rate, real token savings or account pricing. No paid model calls are authorized or performed by these tests.

Historical MVP coverage remains approximately 94% (122/130 original acceptance weights); expanded correction/API scope is not a new percentage denominator. M18.4 GitHub integration and M19 hardening remain deferred. Keep PR draft/open/unmerged.

## Acceptance evidence

| Area | Automated evidence |
| --- | --- |
| Hub/menu visibility | No project or open Hub hides editor menus; File Hub remains last. |
| Approval | Default ON pauses before mutation; a natural approval resumes one task; OFF presents the plan and executes. Panel/project preferences remain independent. |
| Conversation continuity | Actual tool outputs are retained per channel/project; interrupted orphan provider calls are removed; archived evidence remains retrievable. |
| Capability limits | Missing types and missing members on known types return explicit unavailable results; repeated authoritative misses stop with a terminal explanation. |
| PMD construction | Approved milestone child references satisfy exact criteria; descendants count as progress; existing prose is retained. Earlier phase/recovery browser scenarios also pass. |
| PMD editing | Real Ctrl+S and context creation persist a section; background synchronization waits rather than silently dropping saves, and stale document revisions retain drafts. |
| Scripting runtime | Real C# compilation and controlled frames execute component/transform/camera/raycast/activate/clone/destroy/trigger code; integer vector magnitude avoids overflow; collider bounds match solver extents. Authoring is restored after Stop. |
| Documentation | Generated 57-page reference and titles-only index match the canonical catalog; editor reference panel opens and displays type documentation. |

The executable tree above is the exact tested code. Any later closure commit changes only these reports, roadmap and guides; it does not change engine/editor/test behavior. Earlier unsuccessful CI runs remain historical and are superseded by the linked successful run. Two prior M2/M3 browser jobs hit their job timeout without an exception; that intermittent stall was not reproduced in the successful run. The fixtures now log progress, reject unexpected dialogs and bound their restart shutdown wait. This is improved test observability and a successful rerun, not a demonstrated production root-cause fix for that stall.

## User-only acceptance

1. In PMD Planning Workshop, with your configured model, finish the four-milestone definition/planning flow, skip or complete critique, then request construction. Confirm the actual phase reaches ready and sections contain the approved deliverables. Approve one presented task plan when confirmation is ON.
2. In Agent Workflow Lab, execute the cube/floor task and then the four-wall follow-up. Verify proposal isolation and that a follow-up reuses relevant retained SDK context. Request an unsupported capability and verify a clear terminal limitation rather than repeated discovery.
3. Observe a real configured-limit interruption: the chat must retain progress and explain its exact stop reason. These account/model-dependent checks cannot be established by controlled adapters; no numeric cost-reduction or general reliability guarantee is claimed.

Run `npm.cmd run demo` to create the current PMD, workflow and Scripting API projects. The Scripting API Lab and document editor interactions were already exercised automatically; repeating them manually is optional. Player demos are preserved and not recreated.
