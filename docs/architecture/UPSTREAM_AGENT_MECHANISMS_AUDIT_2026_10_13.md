# Source-level audit of specialized application agents

Date: 2026-10-13. Research only; Axiom executable behavior is unchanged. This supplements [the live-trace investigation](AGENT_WORKFLOW_RESEARCH_2026_10_13.md).

## Scope and method

Pinned repository revisions, followed actual call paths across the application bridge and agent loop, inspected relevant tests, and executed seven isolated reproductions using exact AST-extracted upstream methods with controlled collaborators. No paid provider requests, full upstream test suites, Windows desktop, Unity Editor or Blender were run. Python transport/control methods can be reproduced locally; C# execution behavior is source-reviewed only.

The snapshot contains 25 source/test files (24,165 lines of source material). Inspection focused on execution, partial batches, readiness, retries, completion, compaction, state propagation and cancellation. This is a bounded mechanism audit, not an audit of every file or a security certification of these repositories.

| Project | Revision | Commit date |
| --- | --- | --- |
| browser-use/browser-use | `c75e8476e26d18b7617643bc2ae082fae8eae431` | 2026-10-07 |
| CoplayDev/unity-mcp, beta | `142ea0af4890337f0ff6658df61db23982313717` | 2026-10-08 |
| ahujasid/mcp-for-blender | `7a0373ec9199183cb460068c4f96aed9c579fb4f` | 2026-10-06 |
| microsoft/UFO | `a795552d976c4c019d7c2f778a0effb5cef7de6b` | 2026-09-29 |

Results and source hashes: [audit evidence](../reports/upstream-agent-audit/probe-results.json), [source manifest](../reports/upstream-agent-audit/source-manifest.json), [revisions](../reports/upstream-agent-audit/revisions.json). [Reproduction harness](../reports/upstream-agent-audit/probes.py) reads upstream snapshots; it does not import or launch the full applications. To rerun, materialize the source manifest paths under a directory containing probes.py and run Python there. Verify the recorded SHA-256 values before running. Upstream source material is not vendored into Axiom.

## Browser Use: execution, stagnation, completion and context

Source: [agent/service.py](https://github.com/browser-use/browser-use/blob/c75e8476e26d18b7617643bc2ae082fae8eae431/browser_use/agent/service.py), [agent/views.py](https://github.com/browser-use/browser-use/blob/c75e8476e26d18b7617643bc2ae082fae8eae431/browser_use/agent/views.py), [message_manager/service.py](https://github.com/browser-use/browser-use/blob/c75e8476e26d18b7617643bc2ae082fae8eae431/browser_use/agent/message_manager/service.py).

The call chain executes a proposed action list with multi_act, stores its actual results, then post-processes plan and loop state. multi_act preserves partial results and stops on error, done, sequence-terminating actions or URL/focus changes. This is useful stale-observation protection, but URL/focus checks alone do not prove the DOM is unchanged. In Axiom, tool handles and expected revisions must also remain valid; a generic scene revision change after an expected write must not automatically abort every useful batch.

**Reproduction B1: detector counts skipped actions.** `_update_loop_detector_actions` iterates last_model_output.action rather than dispatched actions. With a proposed navigate+click batch and one navigation result, it records both navigate and click. The upstream issue [#5725](https://github.com/browser-use/browser-use/issues/5725) describes this same family. Our reproduction independently executes the pinned method; it does not execute a browser navigation.

**Reproduction B2: partial batch errors reset the consecutive failure counter.** `_post_process` increments it only for a single result carrying an error. With two results, the second failed, a prior count of two becomes zero. This is intentional reliance on loop/replan mechanisms for batches, but those are soft signals. Axiom must count failures by dispatched operation and unmet criterion; successful unrelated actions must not erase them.

The loop detector hashes normalized actions and tracks a page fingerprint over URL, element count and text hash. It nudges at five/eight/twelve similar actions, but never prohibits another action. Useful as a first warning, insufficient as the sole cost control. A meaningful multi-step task can repeat the same operation while progressing, and a stuck task can alternate different tools. Axiom needs both action fingerprints and a deliverable/evidence fingerprint.

**Reproduction B3: a negative judge leaves success=true.** `_judge_and_log` attaches the judge result but deliberately preserves the agent's self-report. The fake judge rejects a missing deliverable and success remains true. This is a documented separation for telemetry, not necessarily a bug in Browser Use's intended reporting. It is unsuitable for Axiom's authoritative verified state. Deterministic authored/compile/runtime checks should gate completion; a model judge can supplement subjective quality and must remain visibly separate.

MessageManager has per-instance state and a regression test for state isolation. Its step preparation clears ephemeral context and rebuilds current state; optional history limits and LLM compaction retain a first item, recent items and summary. A summary is explicitly marked unverified. Adopt separate durable journal and compact request context, but keep accepted requirements, IDs, receipts and failed predicates in deterministic structured state. Do not promote a model summary to evidence. Compaction itself uses a provider request and truncates long summaries, so meter that cost and protect indispensable fields outside the summary.

Inspected tests cover normalization, repetition thresholds, page fingerprints, injected nudges and state isolation. Those are useful unit/regression checks. They do not establish end-to-end completion or cover all the dispatch/aggregate interactions reproduced here.

## Unity MCP: batch semantics, readiness and retry ambiguity

Sources: [Python batch tool](https://github.com/CoplayDev/unity-mcp/blob/142ea0af4890337f0ff6658df61db23982313717/Server/src/services/tools/batch_execute.py), [C# batch executor](https://github.com/CoplayDev/unity-mcp/blob/142ea0af4890337f0ff6658df61db23982313717/MCPForUnity/Editor/Tools/BatchExecute.cs), [legacy sender](https://github.com/CoplayDev/unity-mcp/blob/142ea0af4890337f0ff6658df61db23982313717/Server/src/transport/legacy/unity_connection.py), [transport selection](https://github.com/CoplayDev/unity-mcp/blob/142ea0af4890337f0ff6658df61db23982313717/Server/src/transport/unity_transport.py).

Python validates and normalizes commands, fixes one editor instance for the entire batch and applies a configurable size limit. C# runs sequentially on the main thread even when parallel is requested, preserving API safety. Each operation has a result and callSucceeded. failFast defaults to false, and earlier successful writes remain if a later command fails. DetermineCallSucceeded treats null or an unrecognized response without explicit success as successful. These are invocation semantics, not evidence of the requested authored effect.

Adopt explicit per-operation receipts, actual ordering, one workspace identity, size/time budgets and known response schemas. For dependent mutations, stop after failure and return executed/failed/skipped operations. Keep Axiom proposal isolation. A batch is not automatically an atomic transaction: recovery must not rerun already committed operations or assume rollback. Readonly parallelism may be allowed separately, while application mutations remain serialized.

**Reproduction U1: batch-limit cache is not keyed by instance.** The Python module uses one `_cached_max_commands`. Two fake editors with limits 1 and 20 return 1 and 1; only the first editor is consulted. There is an explicit invalidation function, but these direct calls do not invoke it. This demonstrates the function-level risk; an outer lifecycle could mitigate it. Axiom caches must be keyed by application/project/workspace and capabilities revision, with invalidation on switching or configuration change.

**Reproduction U2: ambiguous mutation replay in the legacy transport.** `send_command` retries communication failures without a mutation idempotency key in its payload. The fake endpoint commits a creation then loses the reply; the exact sender dispatches the same creation a second time and returns success. We did not execute Unity itself or prove duplicates for every Unity command. The observed two dispatches establish the ambiguity. This finding applies to the legacy sender, not the separately implemented HTTP PluginHub.

Adopt monotonic total deadlines, bounded reconnect/backoff and authoritative readiness. Do not adopt generic mutation retries after an unknown outcome. Safe retry requires distinguishing not-dispatched, rejected, running, committed and unknown states, plus stable operation IDs and readback/receipt reconciliation. Axiom already has proposal mutation receipts and partial reconciliation; audit every entry point, especially compile, runtime and resumed batches, against that contract.

The HTTP helper distinguishes missing instance selection but turns many other exceptions into a generic retry hint. Axiom should classify transport errors, stale state, contract errors and permanent unsupported operations separately. Invalid parameters cannot be fixed by reconnecting.

Inspected editor-state contract and refresh retry tests. The refresh recovery test mocks a retry response and readiness; it proves that branch of the adapter, not exactly-once mutation behavior. Inspected C# batch tests preserve nested serialized keys and verify actual audio/object effects. Relevant integration testing is a good reference, but those tests do not validate an arbitrary model's milestone completion. The advertised 10–100x batch improvement is not a transferable measurement for Axiom; benchmark actual requests, tokens and latency.

## Blender MCP: application thread, compact observation and execution boundary

Sources: [server.py](https://github.com/ahujasid/mcp-for-blender/blob/7a0373ec9199183cb460068c4f96aed9c579fb4f/src/blender_mcp/server.py), [addon.py](https://github.com/ahujasid/mcp-for-blender/blob/7a0373ec9199183cb460068c4f96aed9c579fb4f/addon.py), [safe_mode.py](https://github.com/ahujasid/mcp-for-blender/blob/7a0373ec9199183cb460068c4f96aed9c579fb4f/src/blender_mcp/safe_mode.py).

Socket handlers enqueue work; a registered main-thread timer drains the queue. The client holds a lock across send+receive because responses are matched by stream ordering. This prevents concurrent commands exchanging responses. Adopt application-thread ownership and explicit operation correlation; Axiom should use IDs rather than relying solely on ordering. The drain loop runs until its queue is empty, so its iteration is not bounded by an explicit work/time quantum; Axiom should yield between bounded groups to preserve editor responsiveness.

**Reproduction L1: disconnected client does not cancel queued mutation.** `_drain_command_queue` executes first and sends its reply second. With a disconnected fake client, the mutation executes once, then reply sending fails. This can be an acceptable policy for already committed/running work, but transport disconnection must not be described as cancellation. For Axiom, cancelled pending operations must not start; running operations need an acknowledged cancellation policy, and committed effects must be recorded even if the reply is lost.

Blender scene queries offer root/query/fields/limit and compact textual summaries. These are directly relevant to context cost. Capture only requested fields, paginate, return hashes/handles and fetch detail on demand. Version/capability discovery prevents guessing application APIs. Structural and visual observations are complementary; screenshot latency and tokens should not be paid after every numeric write when readback is sufficient.

Python execution is broad by default. The optional safe-mode validator is an AST guard on the MCP path, explicitly not a Blender process sandbox; the addon's socket still accepts code. Even safe mode allows Blender save/import/export operations. Axiom Assistant should retain project-scoped tools and controlled compile/runtime execution rather than acquire unrestricted engine-host scripting. This is an integration-boundary decision, not a claim of a newly discovered exploit. Partial Python mutations before an exception must not be assumed rolled back.

Inspected the threading tests, which also lift the server class through AST and enforce timer registration on the main thread; safe-mode tests cover opt-in behavior and rejection families. Those are meaningful reference tests, but they do not provide a bounded autonomous task orchestrator. Blender MCP delegates planning to the external assistant.

## UFO: explicit states and error propagation

Sources: [application state machine](https://github.com/microsoft/UFO/blob/a795552d976c4c019d7c2f778a0effb5cef7de6b/ufo/agents/states/app_agent_state.py), [processor framework](https://github.com/microsoft/UFO/blob/a795552d976c4c019d7c2f778a0effb5cef7de6b/ufo/agents/processors/core/processor_framework.py), [processing strategies](https://github.com/microsoft/UFO/blob/a795552d976c4c019d7c2f778a0effb5cef7de6b/ufo/agents/processors/strategies/app_agent_processing_strategy.py).

Application states distinguish CONTINUE, SCREENSHOT, PENDING, CONFIRM, FINISH, FAIL and ERROR, archiving outcomes and returning control to a host. Processing is divided into phases with dependency/provides checks and middleware. Adapt that separation, not its full multi-device architecture: Axiom does not need additional autonomous agents to fix its single project workflow. Approval should refer to a concrete stored scope; queued/running/checking/repairing/blocked/verified states must be host-owned and durable.

**Reproduction F1: aggregate result can remain successful after a phase failure.** ProcessorTemplate.process initializes combined_result with success=true. When a strategy returns success=false, it invokes error middleware and breaks without propagating false/error to combined_result. With one failing fake strategy and no middleware, aggregate success is true and its phase result false. Consumers may inspect phase_results or agent.status, so this does not establish global UFO task false-success. It does demonstrate a risky wrapper contract to avoid. Axiom must propagate any mandatory phase/check failure into its authoritative outcome; warnings and successful transport cannot substitute for deliverable acceptance.

The application LLM response helper retries parse failures with the same prompt and returns the cost from the eventual successful call. This helper alone does not aggregate costs of discarded attempts; other layers might meter them. Axiom must charge every attempt from provider usage in a single authoritative ledger, classify parse errors and return specific schema repair feedback, while respecting request/token limits. Do not blindly keep resending the identical failing prompt.

## Concrete adoption decisions for Axiom

| Mechanism | Decision | Required adaptation / verification |
| --- | --- | --- |
| Domain tools and capability discovery | Adopt | Versioned schemas, only relevant domains; unknown model IDs do not imply capability |
| Filtered state observation | Adopt | Projection/pagination, stable IDs, workspace identity and source revision |
| Batched execution | Adopt with changes | Sequential dependent mutations, per-operation receipts and skipped tail; no blind full-batch replay |
| Readiness / async job waiting | Adopt | Host waits without model polling; bounded deadline and explicit error class |
| Compile caching | Adopt | Source+SDK+build-target cache key; current assignment/runtime evidence remains separate |
| Action repetition / state fingerprint | Adapt | Only dispatched operations; semantic state tied to outstanding criterion, not global revision or alternating tool names |
| Soft loop nudges | Supplement only | One bounded repair stage, then recoverable stop and clear unmet condition |
| Model self-reported success | Never authoritative | Host predicate validation and current evidence gate ready-for-review |
| Model judge | Optional supplement | Useful for subjective quality; disclose cost/disagreement, never override deterministic failure |
| LLM history compaction | Adapt | Protected structured task state and durable raw journal; summary never becomes verified evidence |
| Generic retry after receive timeout | Reject for mutations | Reconcile stable operation IDs; ambiguous outcome is not permission to replay |
| Transport disconnect equals cancellation | Reject | Pending/running/committed distinction and cancellation acknowledgement |
| Whole UFO multi-device/multi-agent stack | Do not import | Adopt a small single-workflow state machine and explicit failure propagation |
| Unrestricted Blender-style Python exec | Do not import | Preserve scoped project tools and controlled source compilation/runtime |

## Direct implications for the new Axiom traces

Current Axiom checkProgress keys repetition by name, arguments, global scene revision and the complete result. Unrelated revision increments change the signature. work.check returns from its private route without calling this detector, so repeated false checks can bypass that path entirely. Failed checks returning a successful RPC also escape exception-only failure counters. Enforce semantic progress centrally after every completed operation/turn, including private tools, successful RPCs containing failed predicates, batch children and model calls without tools.

Use typed acceptance predicates and reject invalid hashes, directories-as-files and component paths before execution; support explicit handles for not-yet-created resources. Include expected type, actual type, predicate result and precise repair suggestions. Correcting a malformed checker is distinct from weakening the approved deliverable. Retain all mandatory requirements while allowing plan repair.

For PMD, the host should create a persistent section queue from the approved scope. The model drafts section content; the host owns current revision, idempotent upsert, link/completeness checks and completion. A new lexical approval is not needed to finish already-authorized construction. Scope changes still require the appropriate approval, and persistent human Apply remains separate. Show committed sections immediately in the proposal viewer, with pending drafts and preserved work on cancellation. Long documents can progress through many sections; the no-progress budget applies to an unmet item, not total document length.

## Acceptance before claiming the pillar repaired

1. Reproduce the supplied M2 bad selectors/predicates, reject them before expensive work, repair them without dropping requirements and complete actual source/assignment/runtime checks.
2. Repeated checks, alternating readonly tools, empty edits and unchanged compilation must not reset semantic stagnation. Legitimate section creation, asynchronous waiting and new passing evidence must not cause false stops.
3. Lost response after mutation, resumed partial batch and cancellation must preserve receipts; no duplicate authored effects and no silent replay from an ambiguous state.
4. A failed mandatory phase, stale evidence or invalid acceptance contract cannot end in verified/ready-for-review success.
5. PMD construction after a natural human approval builds all required linked sections, displays progress and finishes without a second magic phrase. Interrupt/restart preserves committed sections and does not erase chat.
6. Separate deterministic host regression tests from budgeted, opt-in live-model task evaluations. Test repeated runs across simple/complex tasks and record completion, false completion, tokens (cached/uncached/output), latency and cost. Full application checks remain necessary where relevant.

These are implementation and evaluation requirements, not achieved Axiom release claims. No percentage improvement or complete-agent success rate can be inferred from the seven isolated reproductions.
