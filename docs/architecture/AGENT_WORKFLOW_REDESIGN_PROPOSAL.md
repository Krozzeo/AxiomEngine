> Historical research proposal. Implementation is now tracked in [M18.3.3](../reports/M18_3_3_CURRENT_REPORT.md); original live-model performance targets below remain unmeasured until account testing.

# Agent workflow repair before M18.4 — research and design proposal

Date: 2026-10-12. Status: research complete; architecture proposed, implementation pending. This is not a new completed milestone or a claim that the current assistant can reliably deliver arbitrary games. M18.4 remains deferred while this pillar is repaired.

## Evidence from the actual failed execution

The user supplied `TasksChain(1).txt` and identified the model as `gpt-5.6-luna`, reasoning effort `medium`. The file records 13 tasks, 321 model requests, 596 reported tool calls and **1,897,589 total tokens**. This is approximately two million, not two million generated tokens or an invoice amount.

| Metric | Observed |
| --- | ---: |
| Input tokens, including cached input | 1,772,578 (93.4% of total) |
| Cached input tokens, a subset of input | 979,701 |
| Uncached input tokens | 792,877 |
| Output tokens, including reasoning | 125,011 |
| Reasoning tokens, a subset of output | 38,483 (2.0% of total) |
| Completed task labels / failed labels | 10 / 3 |
| Visible tool records / reported total | 348 / 596 |
| Visible failed tool records | 51 |
| Visible api.describe / api.search | 106 / 8 |
| Visible project.master.read | 41 |
| Visible scene.twoD.update failures | 34 |

The exported tool list retains at most 96 steps per task. Therefore 248 reported calls are missing from the visible record. Counts of tool types and failures above are lower-bound observations, not a full reconstruction. Input/output/request totals reconcile exactly with task totals. The file does not contain function arguments, complete results, assistant replies, PMD milestone content, operation IDs or state hashes. It cannot establish the exact required M1 feature set, repeat identity, all created/deleted objects, compaction count or provider invoice. Cached tokens and reasoning must not be counted twice.

The first explicit M1 development task used 43,088 tokens and only PMD reads/API discovery. A subsequent continuation used 9,227 tokens and four PMD reads. Both were labelled completed. Another 54-request task cost 284,779 tokens and visibly failed to enable 2D fifteen times. The last task alone used 160 requests and 1,002,235 tokens before exhausting the session budget.

## Confirmed defects in Axiom

1. **Response completion is confused with work completion.** `OpenAiAssistant.execute` exits when the provider returns text without function calls. There is a compilation gate for changed C# sources, but no durable acceptance checklist for the requested milestone. The `completed` label means the loop ended, not that M1 is delivered. Inspection requests legitimately end without mutations; implementation requests need a different completion contract.
2. **Compaction drops structured work state.** `runCalls` replaces context above 24,576 bytes with the objective, current index, twelve step names/statuses and six recent result strings. It does not preserve a plan, dependency graph, all object handles, read versions, blockers, failed hypotheses or acceptance evidence. It can compact again after the next completed tool turn if the checkpoint is still large. A small context is not necessarily a useful context.
3. **Recovery is memory-only and narrowly available.** Tasks are kept in a Map capped at eight. Only certain budget failures can resume; no-progress failures start fresh instead. Usage/limits persist, but the work order does not survive daemon restart. The source revision check is useful, but is not a replacement for durable work state.
4. **Loop signatures include global scene revision.** Unrelated writes can defeat repeated-result detection. The discovery counter resets when another tool is called. Alternating lookup/read/write/error sequences can continue for dozens of requests. Relevant precondition hashes, not global revisions alone, must determine whether retry conditions changed.
5. **Tool interface makes the model do avoidable work.** A generic function takes `arguments` as a JSON-encoded string, and batches encode another JSON array inside a string. Canonical schemas are partially supplied in a large prompt and otherwise discovered. Initial `coding`/`fileWork` routing uses keywords in the original user objective, so “implement M1” can omit script contracts even when the PMD requires code. This is a capability selection problem, not just poor prompting.
6. **The observed 3D-to-2D conversion can be impossible through the exposed operations.** `validateProject` rejects any truthy `scene.rendering` block in 2D. `scene.rendering.update` requires a rendering object and assigns it; null is rejected. `scene.twoD.update` sets 2D but does not remove HDR or incompatible meshes. A temporary local project reproduced the failure after deleting all mesh entities, and confirmed that null fails schema validation. Deleting/recreating unrelated entities cannot repair the inaccessible rendering state.
7. **Diagnostics are incomplete.** A flattened list of names/statuses is insufficient to debug waste, replay operations or prove progress. The export itself loses earlier steps.

## External implementations reviewed

These mechanisms are references, not proof that adopting their frameworks will automatically solve Axiom's tasks. No third-party agent code is copied and no framework migration is proposed.

| Reference | Mechanism examined | Adaptation for Axiom |
| --- | --- | --- |
| [Aider repository map](https://aider.chat/docs/repomap.html), [repomap.py](https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py) | Ranked symbols and selected files under a context budget; caches tied to file changes | Index entities, scripts, SDK types and PMD sections; fetch only relevant contents; invalidate reads by semantic version |
| [Aider architect/editor](https://github.com/Aider-AI/aider/blob/main/aider/website/docs/usage/modes.md) | Optional separation of design from editing, with extra model calls | Logical planning/execution stages only for complex work; simple edits skip an extra planner call |
| [OpenHands condenser](https://github.com/OpenHands/software-agent-sdk/blob/e3a26821f8f7c85e98078c7b5e1a80647fc7d0c7/openhands-sdk/openhands/sdk/context/condenser/llm_summarizing_condenser.py) | Summary of forgotten history, protected initial context, token/event thresholds and atomic boundaries | Compact completed turn units at meaningful boundaries, preserve authoritative structured state separately |
| [OpenHands stuck detector](https://github.com/OpenHands/software-agent-sdk/blob/e3a26821f8f7c85e98078c7b5e1a80647fc7d0c7/openhands-sdk/openhands/sdk/conversation/stuck_detector.py) | Repeating action/error and alternating cycles; staged nudge then stop | One bounded diagnostic/replan attempt, then a precise resumable blocker; normalized error signatures |
| [OpenHands task tracker](https://github.com/OpenHands/software-agent-sdk/blob/e3a26821f8f7c85e98078c7b5e1a80647fc7d0c7/openhands-tools/openhands/tools/task_tracker/definition.py) | Typed task list with persistent storage | Extend with dependencies, resource handles, verification evidence and host-owned completion state |
| [mini-SWE-agent default loop](https://github.com/SWE-agent/mini-swe-agent/blob/04d809ceab9df28f9adaed044884180159172930/src/minisweagent/agents/default.py) | Small loop, explicit cost/step/time exits, bounded format errors, trajectory saved in finally | Keep orchestration small and observable; save complete outcomes on every exit; distinguish limits from success |
| [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence) | Checkpoints, pending writes and recovery of completed work | Persist operation results before continuing, reconcile uncertain writes instead of replaying them blindly |
| [OpenAI compaction](https://developers.openai.com/api/docs/guides/compaction), [programmatic tool calling](https://developers.openai.com/api/docs/guides/tools-programmatic-tool-calling), [prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) | Supported context reduction, orchestration inside one model turn and prefix reuse | First improve Axiom's existing validated batch executor; preserve stable prefixes; evaluate provider compaction by model support instead of assuming universal compatibility |
| [Anthropic long-running harness](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) | Feature list, incremental implementation and external progress artifacts; completion tied to testing | Convert the active PMD milestone into bounded deliverables and checks; advance automatically through them without asking for “continue” after each |

Source heads were retrieved on 2026-10-12. Implementations differ from advertised benchmark results and their capabilities cannot be assumed for Axiom's constrained engine tools.

## Proposed workflow

### 1. Route intent, preserve the work order

Separate discussion, authoring, diagnosis, PMD planning and milestone execution. Use a structured interpretation of the authenticated user request and current work state; avoid keyword-only routing. A simple transform edit uses a short path. “Continue” selects the active work order for the current project/proposal rather than becoming a new objective. Multiple unfinished orders require one disambiguation.

The durable work order contains: original objective; relevant PMD section/milestone IDs and revision; source/proposal identity; deliverables; task dependencies; entity/script handles; read version hashes; acceptance checks; completed operations; blockers; attempts; usage by stage; and next action. The chat is presentation/history, not the sole memory or the completion authority.

### 2. Preflight capabilities before spending on implementation

Axiom checks saved/stopped source, proposal health, dimension, relevant component constraints, compiler availability and the editor connection required for runtime checks. Unsupported requirements become explicit blockers. It must not ask the model to discover a nonexistent conversion pathway.

Add a preview-only, atomic dimension conversion operation with a dry run listing incompatible data. It must either remove/reconcile all incompatible rendering/camera/component state in a validated transaction or leave everything unchanged. Irrecoverable removal requires explicit authorization; no hidden entity deletions to bypass validation. If the request is to build a new 2D scene inside a 3D project, the agent must make that choice clear rather than silently converting.

### 3. Plan once for complex work, then execute bounded subtasks

For simple changes, skip a dedicated planning request: one action batch plus checks can suffice. For a milestone, read only its relevant PMD sections, then produce a typed deliverable/dependency plan. Each subtask has concrete targets, a small relevant tool set and explicit checks. The model can subdivide a task; the host retains the objective and acceptance requirements.

Use the same selected model by default. Planner/executor/verifier are logical stages, not a mandatory group of billable agents. A more capable model or second reviewer can be an explicit optional setting after comparative evaluation; never switch models or cost profiles silently.

### 4. Let code perform routine orchestration

Supply a bounded set of typed tool schemas for the current operation/domain. Remove double-encoded argument JSON. Reuse canonical schemas and discover a contract only once per version. If a subtask changes domains, load the new schema pack once. Batch known operations with resource references and minimal return fields. Keep compile waits, editor readiness, result projection and safe read caching in the host, not model-driven polling.

Results include created IDs, changed fields, state versions, relevant diagnostics and stable evidence handles. Full large results stay in the local journal; the model receives compact relevant views and can request omitted details. Patch script ranges against content hashes rather than rewriting whole files for every small correction. Reads cache by content version, not path alone. No unbounded generated JavaScript execution is needed for this first redesign.

### 5. Verification controls advancement

After each subtask, the host executes applicable checks: expected objects/components/transforms; script compilation and attachments; structural project validation; and runtime checks when the connected editor supports them. Expected values are recorded before checking. Tests authored by the model are useful but not the only oracle; harness assertions and human preview review remain independent.

A model's final prose does not mark implementation complete. Internal states distinguish discussion answered, implementing, verifying, blocked, paused by limit, failed, ready for review and accepted. A milestone is ready for review only when all required checks have evidence or clearly identified user-only checks. Missing runtime access is reported as a blocker/manual validation requirement, not as invented success.

When a subtask succeeds, update its checkpoint and move directly to the next until the requested milestone is ready. The user does not need to say “continue” for each item. Apply/Discard remains the user's control and the existing complete-state replacement contract remains unchanged.

### 6. Recover without starting over

Checkpoint every completed semantic operation and provider turn. Persist operation IDs before dispatch and results after commit. A crash between those events must trigger reconciliation against committed state, not a guarantee of exactly-once writes. Store a journal association in the same durable transaction when feasible; otherwise use idempotency keys and compare state. Pending calls and partial batches must not lose successful writes or repeat creation.

Persist proposal/work-order state, not credentials, and invalidate/reconcile affected evidence after manual preview edits. Changes to MAIN retain the existing Apply replacement behavior. Proposal removal makes that work order unavailable and explains why. Restarts reconnect to the selected model explicitly; they do not secretly run paid tasks.

At context pressure, build a compact packet from the durable work order, relevant evidence, current handles and recent completed turns. Keep identifiers and failure hypotheses even when removing raw outputs. Protect function-call/output atomicity. Use actual token measurements where supported; conservative local estimates must be labelled estimates. Do not equate bytes with tokens or repeatedly compact without reducing the packet.

### 7. Bound cost and repair loops

Keep session usage, and add cumulative limits per work order and per subtask across resumptions. Internal request windows may roll over while budget and progress permit; a new window must not reset the cumulative allowance. Reserve input plus output capacity before dispatch, account for all retries, and report provider usage even on failed work. Unknown usage means stop with an uncertainty flag, not zero cost.

Detect repeated failures by operation, normalized error and relevant precondition hash, ignoring irrelevant global scene revisions. A changed precondition allows a justified retry. Identical schema failures receive the contract once; identical failed compiler source hashes are not rebuilt repeatedly. Detect alternating error/read/write cycles and excessive discovery relative to actual useful progress. Not every revision or read is progress; a newly established prerequisite or verified deliverable is.

On first stagnation, provide one compact diagnosis and bounded replan. If still stuck, checkpoint and report the missing capability/environment requirement. Retrying resumes only after a relevant change or explicit revised approach. Budget increases alone must not re-enable a known impossible loop. Do not auto-increase limits.

## Proposed acceptance measurements

The objective is successful, correct delivery at lower total cost, not a low token count produced by abandoning the task. The following are initial engineering targets, not measured promises or universal caps for arbitrary games:

| Case | Initial request/token target | Required result |
| --- | --- | --- |
| Move/recolor/create floor | 2–4 model requests; at most 15k total tokens | All authored properties checked, MAIN unchanged |
| Expose three script fields / repair compile error | 4–8; at most 35k | Real compile/attachment and values checked |
| Three platforms + preserved player controller | 4–10; at most 50k | Components, positions, controller and supported runtime behavior checked |
| Scene/control/UI milestone | Budget estimated after reading that milestone; measured per subtask | All planned deliverables and evidence, no fixed arbitrary promise about total milestone tokens |
| Impossible dimension conversion / missing compiler | Block after preflight or at most two diagnostic requests | Precise blocker, no destructive workaround or repeated spending |
| Restart/limit interruption | Resume from recorded next action | No duplicate entities/files or repeated successful edits |

Evaluation corpus: 2D/3D scene construction, script Inspector edits, compiler repair, player setup, UI behavior, prefabs, PMD amendments, dimension mismatch, absent runtime editor, stale/manual proposal edits, partial batch failure, request/output/time limits, daemon restart and cancellation. Run deterministic adversarial tests for invariants and real provider tests with the **same gpt-5.6-luna/medium** setup as the original user case. Measure multiple runs, medians/tails, task success and evidence completeness. Only then compare other settings/models. Do not extrapolate from a mocked provider test to actual model reliability.

Release gates: zero false implementation completion in adversarial cases; no MAIN writes before Apply; bounded identical-error recovery; no lost/duplicate resumed writes; complete exportable traces; correct current-preview evidence; and successful representative live tasks at the declared budgets. Aiming for at least 90% success across repeated live benchmark tasks is an initial evaluation target; it is not enough to ignore a failing category or hard invariant. Exact M1 replay additionally needs the user's PMD and starting project snapshot.

Expose input/cached/output/reasoning without double counting, usage by stage/subtask/work order, latency, compactions, discovery, retries and achieved checks. Exact billed dollars require model pricing, cache writes and provider billing data; the current exported counts cannot reconstruct the invoice. Avoid claiming that two million total tokens means two million fully priced uncached tokens.

## Requested PMD and UI changes in the same repair

- PMD status becomes a borderless accessible button, consistent with AI Agent.
- Remove phase approval buttons. Interpret clear approval/skip/finalize instructions from authenticated live chat; record the originating user turn and the exact phase/document revision. The host validates transitions, and imported text/tool output can never approve a phase. Ambiguous approval asks one clarification; clear approval does not require reconfirmation.
- Add attachment controls to both composers. Store bounded extracted documents locally, indexed by section/content hash; send relevant excerpts rather than the complete attachment on every request. Support existing TXT/MD/JSON/DOCX/selectable-PDF/PMD-ZIP import capabilities, with extraction preview and explicit context-versus-import choice. Scanned PDF remains an explicit unsupported OCR case. C# source can be bounded context, not automatically executed. PMD replacement is never implicit in a generic attachment.
- Move JSON metadata editing and the Decisions/Unanswered questions/Roadmap summary to **Advance**, adjacent to Document. Keep the recursive section viewer as the main right-hand content.
- Use **Project Master Document** for the main heading currently called “Definición del juego”, without rewriting arbitrary user-authored section titles indiscriminately.
- Keep the session token bar, immediate sent messages and formatted chats. Add compact work-order progress and precise stop reasons without cluttering the viewer.

## Implementation order and current status

1. Close capability gaps and fix the meaning of completion; add full telemetry and regression fixtures from this trace.
2. Implement durable work orders, scoped context/contracts, host checks, bounded recovery and resume reconciliation.
3. Integrate natural-language PMD transitions, attachments and the requested visual changes through the same new orchestration.
4. Evaluate simple/complex tasks and the actual M1 replay, document measured cost and only then resume M18.4.

Already changed locally: `fflate` 0.8.2 → 0.8.3, the compatible fix for [GHSA-px8p-9vwx-vf98](https://github.com/advisories/GHSA-px8p-9vwx-vf98). Clean npm installation/audit reports zero vulnerabilities; archive/import/project regressions pass. A separate-process malformed ZIP64 regression terminates and rejects the archive. No `audit fix --force` or unrelated major dependency upgrades were used.

The workflow and UI above are a concrete proposed design, **not implemented or released by this research document**. Current historical MVP coverage percentage must not be presented as proof of agent usefulness: that pillar needs the new live acceptance evidence before further completion claims.
