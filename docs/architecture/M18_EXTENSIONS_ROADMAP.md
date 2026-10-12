## M18.3.3 agent workflow repair

M18.3.3 / 0.0.41 is complete as an automated correction. CI246 passes all 34 jobs at executable commit `9f8a931cf93f714669f086b315d4868b6e8897e0` (tree `1785939561b2ece7c5a48a959902b8917777e454`): 326 Node tests on Linux and Windows, 39 Rust tests, real C# Linux development/AOT and Windows development, and five new workflow/browser criteria plus ten existing PMD/Player criteria. Historical expanded MVP coverage remains approximately 94% (122/130). Controlled adapters establish host behavior; live-model quality/cost remains an account-only validation. M18.4 has not started. PR #32 stays draft/open/unmerged. Do not merge automatically.

[Current report](../reports/M18_3_3_CURRENT_REPORT.md). This is a repair of the existing agent/PMD scope; no extra MVP weight is added.

## Historical agent workflow research baseline

The real user trace records 1,897,589 tokens without finishing M1. Current assistant acceptance does not establish milestone delivery reliability. M18.4 is deferred while the pillar is repaired. Read [the researched workflow proposal](AGENT_WORKFLOW_REDESIGN_PROPOSAL.md) and [trace metrics](../reports/AGENT_WORKFLOW_TRACE_METRICS.json). These workflow/PMD/UI changes and the compatible fflate 0.8.3 patch are implemented in M18.3.3. The original live-model performance targets remain account-only acceptance. Prior 94% coverage is historical, not a guarantee of usable autonomous development.

## M18.3.2 correction before GitHub integration

Complete, 100%; CI241 passed 33/33 jobs, ten current browser criteria. PMD and AI Assistant share the session-token meter. Repaired PMD repeated-question behavior: use authoritative current document/chat and complete decision context; record firm answers once, keep only unresolved questions, separate settled answers from one human phase approval. Optimistic PMD prompt display, shared safe Markdown and composer styling, live camera/light direction guides and shadow-enabled new lights. No scope weight added. M18.4 remains next, not started.

# M18 extensions — approved MVP roadmap

Scope decision: 2026-10-09. M18 0.0.32 remains complete; its two repair demos are deterministic policies, not a connected model. The following ordered milestones precede M19 MVP Hardening. AI Master remains visible, disabled, labelled `(planned)` and outside MVP implementation.

| Milestone | State | Deliverable | Weight |
| --- | --- | --- | ---: |
| M18.1 OpenAI connection and multistep assistant | Complete; user confirmed live Workshop | Daemon-held credential, tested model selection, bounded sequential tool loop, project-context chat, isolated existing proposals, cancellation and usage/error visibility | 6 |
| M18.2 Integrated chat and editable preview | Complete; M18.2.1 correction verified by CI219 | Chat review card, automatic preview after agent work, preview-only toolbar, branch toggle, manual proposal edits, Apply/Discard and recovery | 6 |
| M18.3 Assisted PMD | Complete; CI229, eight browser criteria | Iterative definition, approved milestone/stage planning, optional critique, indexed linked section documents, manual/assisted edits, import/export and history | 7 |
| M18.3 Added prefabs and Players | Complete; real C# workers and actual editor Play | Physical prefab files, linked locked originals, Desassemble, four adjustable Player controllers | 4 |
| M18.4 GitHub integration | Not started | Account/repository/branch configuration, connection indicator, explicit or configured milestone publication of applied/saved projects | 3 |
| M19 MVP Hardening | Not started | Original end-to-end acceptance, onboarding, recovery, compatibility and measured stability | 5 (existing) |

## M18.2 branch contract

Apply replaces the complete authored project state with the pending proposal state. It does **not** merge or resolve field conflicts. Changes made to MAIN after the proposal was created are discarded on Apply, including changes to unrelated objects/files. MAIN X=5 plus proposal X=2 yields X=2. Editing proposal X=2 to X=5 yields X=5 on Apply. Manual authoring changes inside preview survive Apply; Play runtime changes remain transient.

MAIN and proposal edits remain independent. Preview toggles in/out without accepting or discarding. Save is disabled inside preview; outside it MAIN can be saved. After Apply the proposed state is the current draft and can be saved. Discard removes the proposal. Additional chat requests modify the same pending proposal. Keep a clear branch indicator, divergence warning and recoverable pre-Apply state. Review evidence is tied to the current proposal revision. No three-way merge is required for this MVP.

M18.2 ships this complete-state replacement through a dedicated guarded human Apply route. The legacy workspace.accept API keeps its original stale-source contract for compatibility.

## PMD and GitHub boundaries

PMD uses stable section identities and a structured recursive index; retrieve relevant sections rather than putting every file into every prompt. Approved decisions, assumptions and open questions are distinct. Imports show extracted content for review. Manual reading/editing/import/export remains usable offline; assisted actions need a tested model connection. AI Assistant works within Axiom tools, not engine source modifications.

GitHub credentials never enter project documents or model context. Publish only applied, persistently saved state, excluding secrets, temporary files and rebuildable outputs. Automatic publication requires an explicit persistent user preference. Never force-push or overwrite incompatible remote changes; stop and explain. Local proposal branches are separate from Git branches. Future AI Master implementation needs its own isolated engine-development lifecycle.

## Reporting rebaseline

The prior 104-point roadmap has 99 completed points. Added scope contributes 22 points; total is now 126. At roadmap approval, completed weight was 99/126, approximately 79%, without removing or undoing completed functionality. M18.1–18.4 gain partial credit only from executed acceptance evidence; documentation or scaffolding earns none. Historical 95% reports retain their original scope denominator.

Current evidence credits all M18.1 and M18.2 weight: 99 + 6 + 6 = 111; 111/126 ≈ 88%. M18.1 live Workshop was confirmed by the user; M18.2 executable/browser acceptance is recorded in M18_2_CURRENT_REPORT.md. Live token savings are a separate account-specific comparison, not assumed from the controlled benchmark. Individual follow-on plans: M18_3_PLAN.md and M18_4_PLAN.md.

M18.2.1 (0.0.37) closes the scripting efficiency and preview UX correction with 6/6 new acceptance groups and all 32 CI219 jobs passing. It adds no milestone weight or scope to the remaining roadmap; expanded completion remains 111/126 (approximately 88%). See docs/reports/M18_2_1_CURRENT_REPORT.md.

M18.3 adds user-requested linked prefabs and four Players (estimated four scope points). Updated scope denominator is 130; M18.3 + prefab credit is contingent on real C# and browser acceptance. Potential closed total is 122/130 (~94%). M18.4 and M19 remain.

M18.3 closure: 122/130 acceptance-weight points (~94%), including four added prefab/Player scope points. Two milestones remain: M18.4 GitHub and M19 hardening. See docs/reports/M18_3_CURRENT_REPORT.md; live PMD quality/cost is not inferred from controlled responses.

M18.3.1 (0.0.39) corrects Create dispatch, ordinary Player instances, detached pointer input, prefab original ordering, PMD/Audio/JSON IDE UX and the supplied task-chain failure. No additional roadmap weight; current executable validation is tracked in M18_3_1_CURRENT_REPORT.md.

M18.3.1 closure: CI234 passes 33/33 jobs, nine browser criteria, 303 Node tests on Linux/Windows, 39 Rust tests and real C# development/AOT. Correction complete (100%); scope and expanded completion remain 122/130 (~94%). PR #29 is draft/open/unmerged. M18.4 and M19 remain.
