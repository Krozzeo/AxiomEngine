# M18.2 — integrated chat and editable preview

Status: not started. Depends on M18.1. Supersedes the existing stale-source rejection only after replacement publication is verified. No three-way merge or conflict-resolution UI is required for this MVP.

- Absorb AI proposal into AI Assistant chat: task summary and Review changes / Preview / Apply / Discard card. Preserve detailed diff and version-bound evidence.
- Automatically show proposal preview after the agent finishes a modifying task. User can leave chat, edit through the engine and run Play to verify. Preview button toggles between original/proposal without accepting or discarding.
- Show the same controls in the top bar only while preview is active, with unmistakable proposal/branch identity.
- Authoring edits in preview belong to its isolated branch, survive toggles and survive Apply. Runtime edits during Play remain transient. Additional chat tasks improve that same pending proposal.
- Save is blocked in preview across every path. Outside preview original can be saved. Apply promotes the complete proposal-authored state to current original/draft, clears preview and enables persistent Save; it does not implicitly Save.
- Apply discards **all** original changes since the proposal was created, even unrelated ones. Test original X=5 / proposal X=2 → X=2 and proposal manually edited X=5 → X=5. Warn when original diverges and retain a recoverable pre-Apply snapshot; atomic promotion, source/job guards and rollback still apply.
- Discard removes only the proposal; original remains intact. Tests cover scene, scripts, imported resources, history, reload/restart, incomplete jobs, detached views and branch-isolated edits.

Demo: editable branch comparison workshop covering both exact X examples, unrelated original changes, manual proposal changes, follow-up agent edits, Play verification, Save blocking, Apply recovery and Discard. These behaviors must use normal project APIs, not sample-only shortcuts.
