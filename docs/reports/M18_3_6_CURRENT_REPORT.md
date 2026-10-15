# M18.3.6 / 0.0.44 — PMD scope repair and project Hub

This revision addresses the supplied 0.0.43 histories. It is a correction before M18.4, not completion of GitHub integration. Historical MVP coverage remains approximately 94% (122/130); Hub additions and live-model reliability are not represented by that percentage.

## Diagnosed failures

- **Four walls:** the trace authored four primitives, named/positioned them, and assigned colliders. Acceptance selectors used `name:Workshop Wall North` etc., whereas both checking and progress tracking compared literal names. Authored changes were invisible to the progress monitor. Subsequent attempts to remove the property predicate were rightly rejected. Normalize the supported `name:` prefix in both acceptance and progress, including retained pre-upgrade plans. Regression authors all four walls in four controlled provider requests and verifies actual colliders without modifying MAIN.
- **PMD construction:** the final failed turn consumed **1,658,952 reported tokens**, with 278 tools (198 transitions, 50 reads, 30 edits). The initial approve/skip transitions succeeded. The next document edit also changed the approved roadmap, which returned the phase to planning. A per-turn idempotence cache then returned `alreadyRecorded` for approvals that were no longer valid. Rewrites changed text often enough to defeat generic no-progress detection. The instructions also incorrectly asserted that such refinements did not reopen planning.

## Corrections

Construction preserves approved decisions/roadmap: model edits must fill linked sections, not silently redesign approved scope. Approval idempotence checks actual approval state. Explicit human backtracking can reopen definition or planning without deleting sections/chat. Final PMD replies include the host-recorded phase/revision, so narrative cannot stand in for actual workflow state. Construction still completes only against the host queue. A PMD turn has an independent 16-request safety boundary and at most three rewrites per section, even with configurable spending caps disabled. This is containment, not proof of model quality or a guaranteed dollar ceiling; a single provider response can consume substantial tokens.

## Hub and editor

Hub is a closable overlay, reopened from the Axiom brand or File → Hub. Opening it preserves the current project. Active project is highlighted; its Delete action becomes Close. Other projects can be deleted with confirmation while the current project remains open. Card actions use icons with delayed tooltips; Open Folder launches the OS folder for a validated project ID. Switching dirty projects offers discard, save-and-close (default), or cancel. New projects store creation/modification timestamps, legacy missing dates display `-`, and only an explicit save supplies a previously missing modification date. The supplied logo is used unchanged.

AI indicators/compile controls disappear without a project. Budget limits and counters are persisted per project; Reset project counter affects only that project and does not change OpenAI billing. Global connection credentials remain memory-only. Legacy unassignable global consumption stays archived rather than being charged to every project. Shared reply notifications have a visible in-app fallback; desktop notifications require browser/OS permission, requested from the Send gesture. PMD phase circles show host state and support natural-language backtracking.

## Verification

Local regression and architecture checks completed; full release CI and browser results are recorded below when available. Controlled responses exercise real host/tool behavior without paid API calls. They cannot establish real-model completion rate, semantic document quality, or token savings. The user validated the prior player demos; the default demo command now generates only PMD Planning Workshop and Agent Workflow Lab. The evaluator adds an explicitly paid, opt-in `walls` case for account-side measurement.

## Remaining acceptance

With your configured model: complete the fresh PMD, verify the phase reaches ready, inspect all four linked sections, and export More info. In Agent Workflow Lab, run M1/M2 if needed, then request four walls around the existing floor; inspect the preview and checks. Windows Explorer and actual desktop notification delivery need user-machine confirmation. No player retest is requested.
