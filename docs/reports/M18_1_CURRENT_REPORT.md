# M18.1 — current report

Version 0.0.33; in progress. This is not a milestone closure or a live-account verification claim.

Implemented: daemon-only OpenAI connection and model test, explicit model listing, configurable request/tool/token/time limits, a bounded sequential Responses loop, schema-validated engine tool execution, lazy proposal writes, continuation of pending proposals, cancellation/usage/error records, a dockable project chat, real connection/working indicators and planned/disabled AI Master. Workshop demo uses ordinary project commands and preserves existing projects.

Automated evidence currently available: 12 new Node tests cover transport, complete response-item continuation, four-call tasks, tool-error recovery, isolation, limits, credential redaction, cancellation and project switches. Schema/tool/architecture checks pass locally. The browser acceptance harness exercises the real UI/daemon/proposal/review path using a controlled Responses adapter. It is pending CI execution; no browser pass is claimed here.

Local environment lacks Cargo, .NET and Chromium. Existing real Wasm is used for local checks; clean builds and browser gates run in GitHub CI. Historical M18 CI remains evidence for its executable tree, not this version.

Acceptance groups from M18_1_PLAN.md remain open until the full gates and visual evidence are reviewed. No group is counted complete yet. Overall expanded baseline remains 99/126 ≈ 79%.

Account-specific manual check (cannot be performed without your configured API account): connect a model locally, run the Workshop request once and inspect the resulting proposal and actual task steps. Do not send a credential in chat. The explicit connection test and task may incur API charges. Controlled adapter tests cannot prove account model access, quota, current live response compatibility or free-form quality.

Limitations: connection/history/task state is daemon-memory only; keys are not saved in an encrypted vault. Usage limits are application task bounds, not dollar spending caps. Captures send semantic metadata without image bytes. The current separate proposal review and stale-source rejection remain until M18.2. Editable preview, replacement Apply, assisted modular PMD, GitHub and AI Master are not implemented by M18.1.
