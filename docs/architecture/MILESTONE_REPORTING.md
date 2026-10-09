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

| Milestone | Weight (points) |
| --- | ---: |
| M0 Architecture Lock & Bootstrap | 5 points |
| M1 WebGPU + Engine Kernel | 6 points |
| M2 Beta Foundation | 7 points |
| M3 Asset Pipeline | 6 points |
| M4 C# Gameplay Runtime | 6 points |
| M5 AI Control Layer | 6 points |
| M6 Transactional AI Workspaces | 5 points |
| M7 Physics Foundation | 7 points |
| M8 Causal Diagnostics v1 | 6 points |
| M9 Renderer Production Foundation | 8 points |
| M10 2D Production Foundation | 6 points |
| M11 Animation | 4 points |
| M12 Audio | 3 points |
| M13 Profiler + explainFrameSpike | 4 points |
| M14 Automated Game Testing | 4 points |
| M15 Replay & Diagnostic Replay | 4 points |
| M16 Performance & Low-End Pass | 4 points |
| M17 Advanced Assets / CAD | 3 points |
| M18 Agent Autonomy Loop | 5 points |
| M18.1 OpenAI connection and multistep assistant | 6 points |
| M18.2 Integrated chat and editable preview | 6 points |
| M18.3 Assisted PMD | 7 points |
| M18.4 GitHub integration | 3 points |
| M19 MVP Hardening | 5 points |
| **Total** | **126 points** |

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

## M13 reporting arithmetic correction

The existing milestone weights sum to 104 points, not the previously printed 100.
Normalize completion as completed weight / 104; M0–M13 total 79 points, giving
75.96%, reported approximately 76%. Scope and relative weights are unchanged.
Earlier closure reports preserve their historical nominal estimates.

## 2026-10-09 approved scope extension

M18_EXTENSIONS_ROADMAP.md adds 22 points for M18.1–18.4 before M19. Completed baseline remains 99 points: 99/126 ≈ 79%. The prior 104-point table and 95% M18 estimate are historical; do not reuse them for expanded scope.
