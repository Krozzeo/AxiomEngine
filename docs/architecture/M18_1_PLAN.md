# M18.1 — OpenAI connection and multistep assistant

Status: in progress; version remains development until acceptance. Read M18_EXTENSIONS_ROADMAP.md, M6_WORKSPACES.md and M18_AUTONOMY.md first.

Required acceptance groups:
1. Authenticated local configuration, explicit connection test, available-model selection and disconnect; secrets held in daemon memory or its environment, never persisted/exported/logged.
2. Actual OpenAI Responses adapter, bounded HTTP bodies/timeouts and redacted errors; no hidden requests or bundled account credential.
3. Sequential model/tool/result loop, preserved response items, discovery and schema validation, multiple tasks and recovery from tool errors.
4. Engine-only authority: MAIN read context, lazy isolated proposal for writes, pinned project/workspace/revisions, denied accept/save/delete-project/shell/engine modifications.
5. Bounded request/tool/token/context/duration use, one active task, cancellation and honest usage/termination/error records.
6. AI configuration menu, initially closed dockable AI Assistant panel, auto-open on tested connection, AI Agent/Working indicators and disabled planned AI Master.
7. Project and assistant-instruction context, task summary and link to existing proposal review; no claim of M18.2 editable/automatic preview.
8. Editable multistep demo, meaningful automated transport/authority/UI regression, current guide/report/state and documented account-specific live verification if no credential is available.

Use the existing human proposal publication controls. Retain AI proposal temporarily; its chat absorption belongs to M18.2. PMD remains the existing manual document until M18.3. OpenAI calls use the official Responses function-calling flow; model availability is tested rather than inferred from a typed key. No default model availability, price or access is promised.
