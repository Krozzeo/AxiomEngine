# ADR 018 — Bounded autonomy and transient runtime authoring

Date: 2026-10-08. Accepted following full M18 CI and browser validation.

## Context

M18 must prove a failure/repair loop with actual execution evidence and human
publication authority. The editor also needs writable component values and C#
source buffers during Play without accidentally overwriting the authored world.

## Decision

Keep the existing semantic CommandBus, isolated proposals, exact editor bridge,
GameTestSession and compiler capability. A structured plan owns measurable criteria
and explicitly allowed actions; text is an objective description, not executable
instructions. The daemon runs one budgeted loop. It retains failed compilation or
assertion receipts, applies either a position-error delta or a unique exact source
patch, retests and measures two fresh-world verification runs. Completion offers
only a proposal revision/review hash. Publication remains the existing human
Review/Accept operation and explicit Save. External AI clients may create plans;
no model is connected or billed implicitly by the included demo policies.

Runtime edits clone and validate the current running scene separately from authored
history. Writable C# fields hydrate compiled instances; readonly/hidden/range/type
rules still apply. Source saving changes authored files, not the current worker.
Compilation is blocked during Play; Auto compiles saved sources after Stop and
the next Play starts the new build. Failed compilation retains the last good build.
Live Transform and typed fields refresh without replacing edit controls. Stop discards live scene/component values. A shared
compiler controller owns explicit, Auto, project-open and Play compilation; source
hash/mode/SDK identity and one active flight prevent ambiguous button states.

## Alternatives

Reject direct model-text-to-shell execution and automatic proposal acceptance: both
would bypass existing authority boundaries. Reject editing the authored scene as a
side effect of Play tuning. Reject implied state-preserving hot reload: replacing
arbitrary managed object state safely needs a separate contract.

## Consequences

Representative repair demos are useful without credentials. General free-form
planning requires an external AI and structured semantic criteria. Repair policies
are deliberately narrow; unrelated failures remain failed with evidence. Sessions
are memory-resident and cannot resume after daemon restart; proposals and exported
receipts survive. Measurements cover bridge/fixed-step/presentation wall time and
do not establish physical GPU performance. Existing field grammar, scene budgets,
renderer fallbacks and component-structure limitations continue to apply.
