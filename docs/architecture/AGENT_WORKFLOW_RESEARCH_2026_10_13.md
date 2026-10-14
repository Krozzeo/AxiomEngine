# Agent and PMD reliability investigation — 2026-10-13

Status: researched proposal, not an implemented release. Baseline: M18.3.4 / 0.0.42. GitHub integration remains deferred. Do not merge automatically.

## Evidence from the two newly supplied histories

The histories identify engine 0.0.42, model gpt-5.6-luna, medium reasoning. Preserve this model identity; these findings do not establish its fine-tuning availability. Both sessions configured unlimited request/tool/work/step/time caps and a 2,000,000-token session cap.

| Channel / request | Requests | Tools | Tokens | Result |
| --- | ---: | ---: | ---: | --- |
| Assistant: PMD readiness | 2 | 3 | 6,513 | Answered |
| Assistant: M1 | 5 | 13 | 34,774 | Ready for review |
| Assistant: M2 | 73 | 109 | 552,500 | No progress |
| Assistant: restart M2 | 9 | 11 | 48,949 | Ready for review |
| Assistant: Continue | 10 | 10 | 62,650 | Blocked by malformed checks |
| PMD: definition | 2 | 1 | 4,939 | Ready for review |
| PMD: approve definition | 3 | 2 | 8,255 | Ready for review |
| PMD: approve plan | 2 | 1 | 5,383 | Ready for review |
| PMD: critique | 1 | 0 | 3,349 | Answered |
| PMD: apply critique and continue | 103 | 104 | 481,572 | No progress |
| PMD: Continue | 59 | 58 | 261,751 | Cancelled/timed out |

Assistant history total: 705,386 tokens, of which 689,198 input (508,558 cached) and 16,188 output. PMD history total: 765,249 tokens, of which 730,591 input (539,404 cached) and 34,658 output. Cached tokens are included in totals and have different pricing; token counts alone do not establish dollars spent. No paid provider requests were made during this investigation.

### M2: invalid acceptance contracts and ineffective recovery

Initial plan selects the directory `Scripts` as a file, checks lowercase `speed`, and checks entity property `script` rather than `scriptComponents`. That plan is accepted. It cannot verify the intended authored file and assignment. The loop performs 24 work.check calls, 22 entity queries, 16 file reads, 13 work.status calls, nine compiles and nine gameTest.control calls. Compilation/revision changes are not proof that unresolved acceptance checks progressed.

The restart corrects the file path, field names and component path and obtains successful checks. The following Continue creates another plan with file `expected: true`. In current code a file expected value means an exact SHA-256 hash; comparing a hash with true fails. The assistant then incorrectly diagnoses the evaluator as comparing contains against hashes. Source inspection confirms contains already compares file text. The evidence response is misleading because actual only reports the hash, not each predicate separately. This is an API/schema/diagnostics design defect plus model misuse, not evidence of a broken substring comparison.

`work.plan` currently accepts generic expected values and lacks kind-specific semantic validation. The instruction says plan ONCE although unverified plans can be repaired. Generic Continue does not reliably preserve a pinned milestone/task contract. These inconsistencies need repair before further autonomous acceptance.

### PMD: finish is coupled to a fresh lexical approval

The human instruction applies critique and continues. The host reaches construction, sections are written, but project.master.transition finish rejects the same human instruction because its finish regex expects verbs such as finalizar/construir. The model also sends stale revisions. The first construction attempt performs 87 reads, 11 edits and six transitions; the continuation performs 49 reads, six edits and three transitions. Progress protection eventually stops execution, but far too late. Construction authorization and successful completion are different events: automatic completion should validate the previously approved scope and built artifact, while human Apply remains a separate guarded action.

Earlier controlled-provider tests prove specific adapter paths, not general live-model task reliability. The new traces must become adversarial regression fixtures.

## Relevant public implementations

Popularity rounded from public GitHub pages on this research date; not consumer reviews or a success guarantee. Inspect source, test harnesses and issue evidence separately. These projects were read, not executed in our environment.

| Project | Approximate stars | Observed mechanism | Axiom adaptation |
| --- | ---: | --- | --- |
| CoplayDev/unity-mcp | 14.9k | Focused Unity tool groups, batched commands, editor readiness/staleness resource, compile-if-dirty and asynchronous test jobs | Domain tool loading, authoritative readiness snapshot, compile cache by source hash, bounded batches and host-managed job waiting |
| ahujasid/mcp-for-blender | 30.6k | Version/capability discovery; filtered scene summaries by root/query/fields; observation of the actual live viewport | Compact versioned capability manifest; field-projected queries; targeted structural/visual verification after changes |
| microsoft/UFO | 10.0k | Explicit application state machine and public live-task evaluation suites | Separate executing, waiting, repairing, blocked and verified outcomes; persistent per-deliverable state; real task evaluation |
| browser-use/browser-use | 117.9k | Structured action/state history, action and page fingerprints, bounded actions/failures, simplified prompts for specialized models | Semantic progress fingerprint, bounded recovery, compact task packet and cost-aware history; count dispatched operations only |

Unity and Blender MCP are application bridges used by an external assistant; they are not proof of an autonomous milestone planner. Unity batching is explicitly nontransactional, so Axiom must preserve its own proposal isolation and mutation receipts. Browser Use loop detection in the inspected views implementation is a soft nudge; Axiom also needs a hard checkpoint stop. Its open issue #5725 reports counting proposed but unexecuted actions: avoid importing that failure mode. UFO lists WAA (154 tasks across 15 applications) and OSWorld Windows (49 tasks), providing an evaluation approach rather than evidence of Axiom-specific reliability.

Primary sources:

- https://github.com/CoplayDev/unity-mcp
- https://github.com/CoplayDev/unity-mcp/blob/beta/unity-mcp-skill/references/tools-reference.md
- https://github.com/CoplayDev/unity-mcp/blob/beta/website/docs/reference/resources/index.md
- https://github.com/CoplayDev/unity-mcp/blob/beta/website/docs/contributing/dev-setup.md
- https://github.com/ahujasid/mcp-for-blender
- https://github.com/ahujasid/mcp-for-blender/blob/main/src/blender_mcp/server.py
- https://github.com/microsoft/UFO
- https://github.com/microsoft/UFO/blob/main/documents/docs/ufo2/app_agent/state.md
- https://github.com/microsoft/UFO/blob/main/ufo/README.md
- https://github.com/browser-use/browser-use
- https://github.com/browser-use/browser-use/blob/main/browser_use/agent/views.py
- https://github.com/browser-use/browser-use/blob/main/browser_use/agent/service.py
- https://github.com/browser-use/browser-use/issues/5725

## Proposed implementation sequence

1. Replace ambiguous acceptance objects with discriminated checks: file-exists, file-contains, file-hash, script-assigned, compiled-current-source and runtime assertions. Validate selectors/types immediately. Pending generated resources use explicit handles; do not require a new file to exist before creation. Report predicate-specific expected/actual/reason and suggested repair. Permit repair of invalid checks without erasing the milestone's semantic requirements or verified deliverables.
2. Persist one work order per milestone/proposal. Continue resumes the same contract and next unmet criterion. Completed work is not rebuilt because a new chat turn arrives. Verify runtime against current source/proposal revision and actual behavior; a completed runtime job alone is insufficient.
3. Keep the model responsible for decisions and code; host owns lifecycle, checks, job waiting, readiness and compile reuse. Compilation on unchanged sources must return existing evidence when valid. Load only the domain schemas needed; retain a compact packet of goal, current step, unmet checks, handles and latest relevant error. Full history stays available on demand.
4. Progress means a new accepted deliverable, a relevant source change or a newly passing criterion. Reading alternating sections, incrementing scene revisions and recompiling unchanged code do not reset stagnation. Proposed default: after three unchanged cycles enter one bounded repair pass; if unresolved after two repair attempts checkpoint and explain. These are initial testable policy values, not measured optimums. Large tasks can continue through many genuinely progressing subtasks.
5. PMD construction becomes a host-coordinated section queue derived from approved decisions/roadmap. Idempotent section upsert, stable IDs, completeness and link validation. Host tracks current revision; model never guesses it. Validate and finish when the authorized document is complete. Ambiguity gets one explicit clarification, not endless reads. A scope change invalidates the appropriate approval; it must not silently weaken requirements.
6. Publish section-start/section-committed events and show the evolving proposal document immediately in PMD. Distinguish pending text from committed sections; preserve valid sections on cancellation/restart. Keep MAIN unchanged and retain human Apply/Discard. Display progress by section count, not fabricated token-based completion.
7. Add adversarial regression tests from both histories, including malformed file predicates, wrong component paths, repeated unchanged compile, stale revisions, natural-language construction authorization, cancellation and Continue. Add an opt-in live-model evaluation harness using budgeted runs and saved artifacts. No live-account testing should run automatically or incur costs without explicit configuration.

Acceptance suite should include simple scene edits, C# creation/assignment, compile error repair, multi-platform setup, complex milestone continuation, PMD with optional critique, section generation, interruptions and source conflicts. Independently check authored results, required behavior and MAIN preservation. Measure completion rate, requests/tools, cached and uncached input, output, latency and actual cost when known. Report distributions across repeated runs/models; do not claim universal success from a scripted-provider demo. Initial research goals: at least 90% completion on the bounded suite and at least 80% median token reduction against these pathological traces, with zero false completed states. These are targets pending measurement, not promises or release evidence.

## Hub and durable project storage — next after workflow proposal

Hub is the launch surface with no selected project. Game Engine is enabled; other Axiom app identifiers exist as planned entries only. Select/create projects, confirm deletion, distinguish missing paths, expose configured storage root. Resolve the actual OS Documents folder (including redirection), default to Documents/Axiom/<project-name>, and store user settings outside the release checkout. Stable project IDs must be independent of folder names. Avoid silent directory-name collisions.

Project manifest records createdWithVersion, lastSavedWithVersion, projectFormatVersion and applicationId; Hub shows version/path. Older engine versions get a warning with Open anyway; format compatibility validation remains separate. Opening must not silently rewrite/migrate a project. Existing checkout-local projects get an explicit non-destructive import/copy path; preserve the originals until verified. No implementation exists yet for this scope.

## Fine-tuning decision

Not the first repair. Training cannot fix invalid check semantics, stale revisions, host lifecycle or excessive tool-result retention. First stabilize the tool API and establish held-out live evaluations; then collect clean successful trajectories, not failed loops as positive examples.

Potential benefits: reliable domain tool selection and shorter prompts; potentially lower inference latency/cost with a smaller model. Costs: curated representative datasets, training and evaluation, hosting/inference costs, retraining when APIs change, overfitting and provider/model dependence. Browser Use's service code explicitly handles specialized fine-tuned browser models with simplified prompts, demonstrating the technique's use in another application; this does not establish that the same gains will transfer to Axiom.

Important current availability: the fetched OpenAI optimization and SFT documentation says the fine-tuning platform is winding down and is no longer accessible to new users; existing fine-tuning users can create jobs for the coming months. Account eligibility must be checked independently. Fine-tuning is not supported by every model. No supported fine-tuning capability for gpt-5.6-luna was established here. Open-weight training or another provider is possible in principle, with its own infrastructure and licensing constraints.

Official sources:

- https://developers.openai.com/api/docs/guides/model-optimization
- https://developers.openai.com/api/docs/guides/supervised-fine-tuning

No engine changes, new ZIP, paid model execution or live reliability validation are claimed by this research document.
