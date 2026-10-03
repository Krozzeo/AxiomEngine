# Milestone completion reports

Every milestone closes with one report containing the following sections.

The same change set must also update `docs/AI_HANDOFF.md`,
`axiom.project-state.json`, `docs/architecture/IMPLEMENTATION_STATUS.md`, the
relevant API/architecture documentation and the changelog. Documentation is a
Definition of Done requirement, not a follow-up task.

## 1. Outcome

A concise description of the user-visible and architectural capabilities that
now work. Distinguish implemented behavior from scaffolding and future gates.

## 2. Acceptance criteria

List every milestone criterion as Passed, Failed, Blocked or Deferred. A
milestone is complete only when all required criteria are Passed; Deferred
items require an explicit scope decision or ADR.

## Demo requirement

Each milestone includes editable demo projects when its implemented capabilities
support a useful demonstration. Use normal project/import/component APIs; demos
must not depend on a separate sample-only implementation. Document controls,
expected behavior and the specific new functions being demonstrated. Preserve
existing user projects. Cover demo generation and meaningful interactions through
automated acceptance. If a milestone has no applicable demo, state why in its
closure report. This is a persistent user requirement.

## 3. Automated evidence

Report builds, tests, schema validation, architecture checks, benchmarks,
diagnostics and relevant visual regressions. Include exact pass/fail counts and
never represent an unexecuted check as passing.

## 4. Manual tests requested from the user

List only checks that cannot be performed in the current environment and have
not already been proven by equivalent automation. Never ask the user to repeat
builds, unit tests, schema checks or other work the agent can execute. For each
genuinely manual gate provide prerequisites, exact steps, expected result and
what evidence or error information to return. Write `None` when no manual test
is needed.

## 5. Known limitations and risks

Describe remaining limitations, measured regressions and decisions that may
affect later milestones.

## 6. Completion percentages

Report both values:

- **Current milestone:** passed required acceptance points divided by all
  required acceptance points. Blocked and unexecuted points do not count as
  passed.
- **Whole project:** completed roadmap weight divided by total roadmap weight.
  The baseline weights live in the table below and change only through a
  documented scope decision.

| Milestone | Weight |
| --- | ---: |
| M0 Architecture Lock & Bootstrap | 5% |
| M1 WebGPU + Engine Kernel | 6% |
| M2 Beta Foundation | 7% |
| M3 Asset Pipeline | 6% |
| M4 C# Gameplay Runtime | 6% |
| M5 AI Control Layer | 6% |
| M6 Transactional AI Workspaces | 5% |
| M7 Physics Foundation | 7% |
| M8 Causal Diagnostics v1 | 6% |
| M9 Renderer Production Foundation | 8% |
| M10 2D Production Foundation | 6% |
| M11 Animation | 4% |
| M12 Audio | 3% |
| M13 Profiler + explainFrameSpike | 4% |
| M14 Automated Game Testing | 4% |
| M15 Replay & Diagnostic Replay | 4% |
| M16 Performance & Low-End Pass | 4% |
| M17 Advanced Assets / CAD | 3% |
| M18 Agent Autonomy Loop | 5% |
| M19 MVP Hardening | 5% |
| **Total** | **100%** |

Partial milestone credit is allowed only for acceptance points with executable
evidence. Documentation-only scaffolding does not count as functional credit.

## Context-free AI handoff requirement

An agent with no conversation history must be able to continue using repository
documentation alone. Before closing a milestone, verify that the handoff states:

- product intent and non-negotiable invariants;
- repository and subsystem map;
- exact implemented behavior versus scaffolding;
- supported and unavailable toolchains;
- build, run, test and diagnostic commands;
- current protocol/schema versions;
- accepted and provisional ADRs;
- known failures, risks and manual gates;
- milestone acceptance matrix and percentages;
- ordered next tasks and the safest first task;
- files that must be read before editing each subsystem.

The handoff must never refer to undocumented chat decisions such as “as agreed
earlier.” Any such decision belongs in an ADR or project documentation.

## User-facing closing response

At every milestone closure, include a concise achieved-capabilities summary, the
milestone completion percentage, approximate whole-project completion, and only
manual tests that cannot be performed or equivalently automated by the agent.
For intermediate releases clearly state that the milestone remains in progress;
report partial credit from the acceptance matrix rather than feature counts.
This reporting format is a persistent user requirement.

## Delivery cadence

Continue through the entire active milestone before handing off a downloadable
release. An interim handoff requires a concrete blocker, necessary user-only test
or another stated reason. Progress updates and CI commits are not partial user
deliveries. This is a persistent user requirement.
