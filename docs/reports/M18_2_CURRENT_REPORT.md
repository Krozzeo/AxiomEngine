# M18.2 — integrated editable preview and assistant efficiency

Version 0.0.36. Implementation and local verification complete; full CI/browser acceptance pending. M18.1's live gate is closed by the user's confirmed successful Workshop task. This report will be closed only after CI evidence is inspected.

Delivered: automatic stopped preview, branch-aware authoring/file/IDE/compiler/settings, chat and preview toolbar Review/Preview/Apply/Discard, replacement confirmation, durable recovery snapshot, explicit Save lock, proposal restart restoration and follow-up edits. The two exact X replacement examples pass backend tests. Legacy deterministic autonomy remains labelled diagnostics, without a duplicate model proposal menu.

Efficiency: corrected host-free assistant schemas, supplied common contracts, validated generic batches with created-object references, prefix-safe budget resume, compact query/context/results and complete-turn checkpoint compaction. Actual per-request input/cache/output/reasoning and persistent session totals are exposed. Requests X/Y and history arrows browse task cards. Reasoning effort is configurable only for verified supporting families.

Controlled benchmark: 12 → 3 model requests (75% fewer); 178,169 → 35,150 serialized request bytes (80.27% fewer). Both schedules query/move/blue-material/create-floor/verify, preserve MAIN and use the same current host configuration. These are measured synthetic schedules, not a live provider token/cost comparison. No 75% token saving is claimed.

Local checks: 37 assistant/proposal tests, full non-server regression suite, origin/auth/Save-lock/replacement/recovery HTTP acceptance, schema/catalog/bindings/architecture/parity and cached-kernel frontend build. CI will perform fresh Rust/Wasm/C# and browser gates. The demo is Editable Preview Workshop; see demos/M18_2_GUIDE.md.

Remaining user-only check: repeat the exact Workshop prompt with the previously tested model/settings, then compare reported requests and input/cache/output/reasoning totals against the ~60k historical run. Account-specific pricing/usage/model behavior cannot be established by controlled responses.
