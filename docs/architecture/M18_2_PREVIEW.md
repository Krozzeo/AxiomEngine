# M18.2 — editable preview and efficient assistant

The OpenAI assistant cannot publish or save MAIN. Every mutating semantic operation runs through the existing validated command bus in an isolated proposal. Human-only authenticated HTTP endpoints review, toggle, apply and recover a proposal. No model-selected project identity, revision, endpoint or publication authority is accepted.

## Branch behavior

A completed modifying task automatically opens an **authored, stopped** preview. Scene, Game, Inspector, creation tools, virtual project files, script compilation and editor settings use the preview workspace. Play is transient; Stop restores authored values. View changes also flow through the existing editor bridge, including detached views. Save buttons/shortcuts and daemon `scene.save` / `project.save` are blocked during preview. IDE source edits are branch authoring, not project publication.

Review changes is inside AI Assistant. The same Review / Preview / Apply / Discard controls appear in the top bar while viewing preview. Preview toggles between separate MAIN and proposal branches without accepting either. Follow-up chat targets the current/pending proposal. Detailed review includes scene, script files and editor settings. The old proposal menu is absorbed; deterministic autonomy remains explicitly labelled development diagnostics.

Apply publishes the **whole authored proposal**, not a three-way merge. MAIN X=5 plus proposal X=2 yields X=2; manually changing preview X=2 to X=5 yields X=5. All later MAIN additions/edits are replaced, including unrelated objects and files. A divergent MAIN requires an explicit confirmation. Apply preserves the current saved revision for the next Save and leaves an unsaved MAIN draft. It does not implicitly persist the project.

Human Apply runs in the command bus transaction queue. It checks current MAIN and proposal revisions, review hash, project identity, external saved revision and active jobs/Play. It validates resources, writes a durable pre-Apply recovery snapshot, promotes only allowed proposal resources and rechecks revisions before replacing authoring state. Promotion failure removes newly promoted resources. Original resource bytes remain available for recovery. Recover is human-only, project-bound and revision-guarded; it restores an unsaved draft. Discard deletes only the proposal.

Proposal journals include authored editor settings and virtual files. The preview view pointer is durable: daemon restart reopens the corresponding saved MAIN and authored proposal, with Play stopped. Task chats/checkpoints remain bounded daemon memory (eight tasks); browser reload can fetch them. Restarted proposal review uses the pending proposal selector. Recovery snapshots remain local; the UI offers the latest snapshot for the current project.

## Consumption

Common assistant contracts are supplied once in stable instructions. Assistant-specific discovery removes the fields the host pins, avoiding contradictory schemas. Unknown contracts remain discoverable; known incompatible model families remain excluded and unknown model names remain selectable/untested.

`axiom_batch` accepts 1–12 ordered semantic operations with object arguments. A data-only `{$ref:"2.entityId"}` references an earlier result. Each operation independently checks authority, arguments, current revision, cancellation and tool budget. Creation results expose created IDs without sending the complete scene. A failure stops the batch and returns the successful prefix/failed index/skipped count. Interrupted batches retain their completed prefix for resume, preventing duplicate successful writes. Batch is generic, not a Workshop shortcut.

Tool responses summarize full project snapshots, preserve query counts and allow `_fields` selection. Entity queries retain authored component information without dumping irrelevant state. Initial context lists bounded entity/file indexes and a short master-document overview, rather than repeatedly including an entire document. Bounded project.master.read and project.file.read ranges retain access to omitted sections.

Long conversations compact only **after all pending tool calls have outputs**. A fresh stateless input carries objective, current project index, completed step statuses and bounded explicitly truncated evidence. Individual reasoning/call/output items are never deleted from an unfinished turn. Small conversations preserve complete provider reasoning items. Compaction does not claim omitted evidence was checked.

Every request records reported input, cached input, output, reasoning and total tokens, plus request bytes/time. Cached input is a subset of input; reasoning is a subset of output. Neither is added again to the session budget. Missing reported totals stop the task and are visibly counted. The session counter/limits persist without credentials. Reasoning effort is optional (`default` omits the field); explicit low/medium/high is accepted only for verified supporting model families, with unknown models using their default.

Task steps and usage has Requests X/Y and up/down icons. The arrows browse retained tasks independently of the current chat/proposal. Y follows current configuration; each task also retains the limits with which it ran. The blue session meter remains cumulative.

## Verification boundary

The controlled benchmark compares the same objective and host configuration under discovery/individual-operation and grouped schedules. It measures **requests and serialized payload bytes**, never fictitious real token savings or price. Both schedules verify the same authored result and untouched MAIN. A real model chooses its own schedule. Repeat the user's original prompt/model/settings to establish live token/cost improvement; the app now exposes the breakdown needed to diagnose it.
