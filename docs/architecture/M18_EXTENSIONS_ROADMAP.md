# M18 extensions — approved MVP roadmap

Scope decision: 2026-10-09. M18 0.0.32 remains complete; its two repair demos are deterministic policies, not a connected model. The following ordered milestones precede M19 MVP Hardening. AI Master remains visible, disabled, labelled `(planned)` and outside MVP implementation.

| Milestone | State | Deliverable | Weight |
| --- | --- | --- | ---: |
| M18.1 OpenAI connection and multistep assistant | Complete; user confirmed live Workshop | Daemon-held credential, tested model selection, bounded sequential tool loop, project-context chat, isolated existing proposals, cancellation and usage/error visibility | 6 |
| M18.2 Integrated chat and editable preview | Complete; M18.2.1 correction verified by CI219 | Chat review card, automatic preview after agent work, preview-only toolbar, branch toggle, manual proposal edits, Apply/Discard and recovery | 6 |
| M18.3 Assisted PMD | Not started | Iterative definition, approved milestone/stage planning, optional critique, indexed linked section documents, manual/assisted edits, import/export and history | 7 |
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
