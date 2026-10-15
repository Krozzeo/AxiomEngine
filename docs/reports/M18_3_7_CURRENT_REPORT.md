# M18.3.7 / 0.0.45 — implementation and verification in progress

This revision implements the approved Hub, conversation-memory, task-approval, PMD document tree and scripting-reference plan. It is not released until native, C# and browser CI acceptance completes.

## Concrete fixes

The supplied PMD trace reached all four required pages, but completion searched only the parent roadmap body for exact approved criteria. Coverage now includes descendants, normalizes whitespace, exposes the precise missing milestone criteria and directs the next action to the affected roadmap section. Child-section changes count as progress. The loop guard remains containment, not an excuse to report success.

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
