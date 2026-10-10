# M18.2 — integrated editable preview and assistant efficiency

Version 0.0.36. Complete: **8/8 acceptance groups, 100%**. Expanded MVP: **approximately 88% (111/126 points)**. M18.1's live gate is closed by the user's confirmed successful Workshop task. PR #26 is draft/open/unmerged, stacked on #25; no automatic merge.

| Acceptance group | Executed evidence |
| --- | --- |
| Integrated chat and automatic stopped preview | M18.2 browser task completion, chat review, toolbar and follow-up task |
| Independent editable branches | Inspector X=5, branch toggles, MAIN independence, branch-scoped IDE and compiler tests |
| Full-state Apply contract | Both exact X examples, unrelated MAIN changes replaced, confirmation, guarded resource promotion |
| Preview Save lock and transient Play | Browser Play/Stop, shortcuts/UI lock and HTTP explicit-MAIN bypass rejection |
| Discard and recovery | Browser discard and pre-Apply restoration, backend project/revision guards |
| Durability and resource isolation | Proposal/restart pointer, physical source/assets/settings, rollback, legacy M6 regression |
| Assistant efficiency and resume | Generic validated batches, created IDs, compact contracts/context/results, safe complete-turn checkpoints, interrupted batch resume |
| Usage and task history | Requests X/Y and previous/next cards; input/cache/output/reasoning totals, persistent session budget and reload/resume |

## Verification

[CI 215](https://github.com/Krozzeo/AxiomEngine/actions/runs/38082922756) passes all **31 jobs** on executable `4435c3790cac78caef692a2db755f5af14c22827`, tree `3568c51bdf9b3d4fe1caf525dffc402188ac49ae`. Linux and Windows bootstrap: **262 Node tests, zero failures**. Rust formatting, Clippy and **39 tests** pass. Schemas (18), semantic tool catalog (88), bindings, architecture and daemon parity pass. C# development on Linux/Windows and Linux AOT pass. All prior browser milestones and the new M18.2 browser gate pass. The new gate has **14 criteria and zero page errors**. Final screenshots for preview, review, task history and recovery were inspected. Evidence: m18-2-browser-evidence.json; artifact 11681421692, ZIP SHA-256 `de73abd2e3c8251b82f925a315377d868e43d264a9a1a115aa3d2a60ba6dafc6`.

Local non-server suite passes; fresh native/Wasm/C#/Chromium gates were performed in CI because those toolchains are unavailable in this local workspace. A final UI polling fix publishes terminal task status only after refreshing working state and controls; the old multistep chat regression verifies immediate follow-up submission. Ambient-light input drafts also survive background redraws and are cleared on project/branch switches; the M16.1 regression tests a paused edit before Apply.

## Measured efficiency

Controlled benchmark: **12 → 3 model requests (75% fewer)**; **180,017 → 35,612 serialized request bytes (80.22% fewer)**. Both controlled schedules query/move/blue-material/create-floor/verify, preserve MAIN and use the same current host configuration. Evidence: m18-2-assistant-benchmark.json, reproducible with `node scripts/benchmarks/assistant.mjs`.

These are synthetic request schedules, not provider token or cost measurements. Actual model choices, reasoning, cache and repeated verification can change consumption. Per-request and persistent session totals expose that behavior; no fixed percentage of live token savings is claimed.

## Delivered behavior and limits

Automatic stopped preview, manual authoring, additional chat edits, detailed review, preview-only toolbar, branch toggles, explicit Save lock, full-state human Apply, divergence confirmation and durable pre-Apply recovery. Apply leaves an unsaved draft. Play changes remain transient. Old proposal review is absorbed into the chat; narrow deterministic autonomy remains labelled diagnostics.

Source files, IDE buffers, deferred writes/Auto builds, failed build state and editor settings remain branch-scoped. Journals and the selected preview survive daemon restart. Task chat/checkpoints retain eight tasks in daemon memory and survive browser reload, not daemon restart; pending proposals remain reviewable after restart. Existing resources are retained for recovery. Credentials never enter project files or model-visible tool authority. AI Master remains planned.

## Demo and remaining user-only comparison

Run `npm.cmd run demo`, then `npm.cmd run dev`; open **Demo · M18.2 Editable Preview Workshop**. Read demos/M18_2_GUIDE.md for interactions. Existing projects are preserved; no AI generation runs automatically.

Only account-specific measurement remains: repeat the exact prior Workshop prompt with the same model/settings and compare requests plus input/cache/output/reasoning totals with the historical ~60k run. Automated evidence already covers the UI and branch semantics; no additional UI-only manual checklist is required.

Next: **M18.3 Assisted PMD** — iterative project definition, milestone planning, optional critique, linked indexed section documents, manual/assisted edits, import/export and history. M18.4 GitHub and M19 hardening follow.
