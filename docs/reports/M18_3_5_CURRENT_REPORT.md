# M18.3.5 / 0.0.43 — workflow contracts, progressive PMD and persistent Hub

State: implementation and automated acceptance complete. No live paid model execution or measured cost reduction is claimed. M18.4 remains deferred until live-account validation. Do not merge automatically.

Tested executable commit: `6f5a756044e769264d0f47b9f5c2a79293f9e92d`; tree `29ba8605c69c43ec4adcacd3338f9cf1cc392434`. [CI260](https://github.com/Krozzeo/AxiomEngine/actions/runs/38631042654) completed successfully with 36/36 jobs. PR #34 remains draft/open/unmerged, stacked on #33. This closure changes only README, handoff, roadmap and this Markdown report; executable files match the tested tree.

## Changes

- Explicit file-exists/file-contains/file-hash and physical script assignment predicates, legacy compatibility, plan validation and predicate-specific evidence. Invalid directory paths/hash types stop before expensive work; SDK script alias maps to authored scriptComponents.
- Milestone instructions such as “Genial, continua con M2” pin the actual milestone, even without an implementation verb. Bare Continue retains a completed proposal's work contract; verified deliverables are rechecked rather than rebuilt.
- Central progress observation covers dispatched operations and private checks. Eight unchanged operations expose a repair instruction; sixteen checkpoint and stop. Global revision/job IDs do not count as progress. New bounded factual observations, relevant authored changes and evidence can count. No universal success-rate guarantee; candidate source changes are still heuristics and require live evaluation.
- Unchanged physical script compilation can reuse current evidence only after schema validation, for matching engine version/source hash/build mode and already matching requested assignments. New source, different mode or attachment needs a real compile. Existing partial mutation receipts and reconciliation remain in force.
- Editor compilation requests wait for the current saved-source digest before deciding to build, so opening an unchanged valid build does not race an unfinished hash and unnecessarily compile. Project/branch scope and Play guards remain in force.
- PMD host section queue: overview, requirements, technical and authoritative roadmap. Live proposal visibility, completed-section count and preserved expansion state. The approved roadmap is rendered from actual structured data. Completion validates required content, links and roadmap coverage; no second lexical finish approval. Changing an approved construction roadmap returns to planning.
- Immutable operation history preserves the plan/result as returned at that moment. A semantic stop records completed mutation outcomes and durable receipts, rather than misreporting an already committed edit as an unexecuted failure.
- Proposal publication resolves source overlay paths independently from persistent destination paths. New assets and compiled bundles can be promoted into named Hub folders through both legacy acceptance and human Apply, retaining rollback, Save and reopen behavior.
- Hub on startup with no selected project. Game Engine enabled; CAD, structural simulation and animation are planned entries. Project creation/opening/deletion with confirmation, configurable root, version/path visibility and older/unknown-version warning.
- Concurrent runtime/asset readers share an atomic project-index refresh. The original implementation reproduced 23 false duplicate-ID errors in 24 simultaneous reads; the regression now requires all readers to retain complete mappings while genuine duplicates still fail. Changing the configured bank also rebinds AI work/context storage; a real HTTP/restart test checks journal recovery from the chosen bank.
- Production default storage resolves Windows Documents via the OS and uses Documents/Axiom/<project-name>. Hub preferences and production AI session usage live outside the checkout. Explicit projectRoot fixtures remain supported. Created and last-saved engine versions are distinct; opening does not rewrite projects. Non-destructive legacy import copies project IDs and resources and leaves originals intact.
- Demo generation now uses configured persistent storage by default; explicit test roots stay isolated. Fresh PMD Planning Workshop, Agent Workflow Lab and four Player labs carry M18.3.5 labels.
- Opt-in live account evaluator for scene authoring, M2 and PMD construction. Requires --allow-paid and a local daemon token; temporarily bounds requests/tokens/time, exports checks/history and only discards the evaluation's own proposal. No automatic paid CI execution.

## Executed acceptance

CI260 passed 354 Node tests on Linux and Windows, 39 Rust tests, script boundaries on Linux/Windows/macOS, real C# development on Linux/Windows and Linux AOT, and all 27 browser groups. Tool catalog, binding generation, schemas, architecture rules and daemon parity also passed. The new browser report has four acceptance groups, zero page errors and 8,412 observed bright geometry pixels. Controlled provider replies test orchestration; they do not prove live-model success or cost.

1. Hub starts without a project, creates durable named folders and exposes versions; cancelled deletion preserves data and confirmed deletion removes only the target.
2. PMD sections become visible while the next controlled provider response is pending. Construction closes automatically in three controlled requests; MAIN remains unchanged.
3. The supplied M2 directory predicate is rejected and repaired. Physical C# sources compile and attach; unchanged compilation reuses evidence; two actual runtime positions are checked independently; MAIN remains unchanged.
4. Human Apply promotes the compiled bundle into its persistent project folder. Save and reopen preserve it; Play loads the published C# worker; Stop restores authored state and GPU geometry remains visible.

Local regressions cover immutable historical tool outcomes, completed receipts at a semantic stop, concurrent persistent-index reads, real duplicate IDs, root reconfiguration/restart with AI journals, non-destructive legacy import and folder publication with rollback. A separate named-bank import exercise preserved IDs/resources/accented names and originals, was idempotent and did not create a missing source path. Local Cargo/.NET/Chromium are unavailable; those checks were performed in CI, not counted as local passes.

The validation process caught and corrected Hub lifecycle routing, a PMD terminal-rendering race, the evaluator configuration URL, source/destination overlay path differences, compilation decisions made before hashing completed, and false duplicate-ID failures during parallel runtime downloads. Older browser fixtures now follow actual Hub selection. No unresolved automatic acceptance failures remain.

## Human-only validation after automated acceptance

Use the fresh M18.3.5 demos and your configured model with bounded limits. Agent Workflow Lab: M1, then M2, verify preview and More Info; export full histories if failed. PMD Planning Workshop: define a small game, approve in chat, optionally skip critique, then check section progression and automatic ready state. Actual API cost and success require your account, not a controlled provider.

On Windows confirm the actual Documents location, import projects from the old application folder without losing originals, then open the same project from a second release directory. These OS-specific checks complement automated settings/store tests; no repeated physics/controller tests are required.

## Coverage and limitations

Historical expanded MVP coverage remains about 94% (122/130); Hub is added scope and is not included in that historical denominator. This number is not autonomous-agent reliability. Semantic content quality, arbitrary large milestones and real-model cost are not proven. Current PMD content remains within the existing 32 KiB section budget and 64-section limit. Hub hosts Game Engine only. Root switching does not automatically relocate existing projects. AI Master/fine-tuning remain future work.
