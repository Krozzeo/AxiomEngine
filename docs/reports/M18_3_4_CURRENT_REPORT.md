# M18.3.4 / 0.0.42 — PMD recovery and live-trace repairs

Status: implemented; final full CI/browser acceptance pending. This correction precedes M18.4. Historical MVP coverage remains approximately 94% (122/130); live-model cost/quality remains a separate acceptance dimension.

## Evidence and causes

The supplied Workflow Lab history records one failed task, 13,581 tokens. Its model used authoring mode, omitted the milestone ID, and used SDK-style paths such as Transform.position.x. The host rejected the mode/ID with a generic error three times, even after the model supplied M1. The supplied PMD history records 18 task segments, 362,964 reported tokens and one failed segment. Numeric roadmap stages were rejected as “invalid milestone”; the provider had not been given detailed nested schemas. Phase approval relied on narrow phrase patterns that rejected explicit instructions. Refining the same roadmap during construction invalidated planning approval and returned the document to planning. Failure cleanup exited PMD preview; failed turns were not persisted in the PMD conversation, and the conversational Continue path inherited the authoring no-progress blockade.

## Repair

- The host pins an implementation plan to the milestone selected by the human, rather than asking a model to discover a magic mode. Ordinal M1 references also resolve to the first milestone when the document uses descriptive/stage IDs; explicit M-style IDs are never silently reinterpreted. Incorrect explicit targets and missing milestones remain errors.
- Known SDK-style transform/component check aliases normalize to authored JSON paths. Component-presence checks evaluate actual state. Unverified mistaken checks can be corrected; verified deliverables cannot be silently removed.
- PMD edit schemas describe every required section/decision/milestone field. Integer stages normalize to text; scalar unions are actually validated. Invalid documents report the specific field.
- Clear human phase navigation is interpreted by the host before model work. Imported text, negated/conditional instructions and quoted/reference text cannot approve a phase. The same authenticated turn is idempotent. Ambiguous instructions may still need one clarification.
- Refinement of existing milestones during critique/construction preserves planning approval. New/removed milestone identities and edits to a ready roadmap still require renewed planning approval. This rule preserves workflow state; it does not establish semantic equivalence of every text edit. Preview review remains necessary.
- Human PMD messages are persisted before the provider request. Failure warnings are recorded visibly in chat, and PMD retains its preview/document progress. Continue starts a fresh PMD conversation turn with the existing document instead of replaying the failed operation. Scene-authoring no-progress protections are retained.
- Both attachment buttons sit inside their action row immediately after Discard.
- More Info renders agent responses and chat origin. Shared format-2 copy/export records PMD vs AI Assistant, task/project/workspace IDs, engine version, model/reasoning, timestamps, limits, before/after context, request status/usage/context, actual terminal arguments/results/error codes, provider replies and final response. Unknown metadata from old records is explicitly unknown; missing historical information cannot be recreated.

PMD's document chat remains bounded for provider context; full recorded task history is journalled separately. This release does not migrate discarded proposals back into existence, reset consumed tokens or make paid model calls. Earlier retained proposals remain available through the existing review/preview controls.

## Validation

73 focused tests pass, including the supplied failure shapes, numeric stages, actual phrase variants, retained warning/branch/Continue behavior and typed unions. Earlier broad local run: 325/332 pass; the seven unavailable tests rebuild the Rust kernel and require missing local Cargo. Cached-kernel editor build, catalog (88), bindings, 18 schemas, architecture, daemon parity and audit pass. Final executable tests run in CI, including a dedicated M18.3.4 browser acceptance case and existing PMD/Player/editor suites.

[Demo guide](../../demos/M18_3_4_GUIDE.md). Source is on codex/m18-3-4-pmd-recovery, stacked on the immutable M18.3.3 release; do not merge automatically. M18.4 remains next, after this repair is delivered and live-account behavior is checked.
