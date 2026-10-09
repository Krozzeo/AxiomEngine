# M18 — bounded autonomy and live editor workflow

Accepted; 12/12 required groups, eight browser criteria. Version 0.0.32. M19 not started.

`autonomy.control` run/query/cancel owns one active loop, up to eight retained
sessions, 24 initial semantic actions, 1–4 attempts, 10–600 seconds, 64 commands
(excluding deadline-bounded polling), 64 receipts and 96 KiB evidence. Objective
text is descriptive; executable work is an explicitly validated structured plan.
At least one real GameTest assertion is required. Deterministic local repair
policies cover world-position error deltas and unique exact compiler-source patches.
An external model can provide plans through MCP; no unconfigured model is invoked.

The loop creates a proposal from saved stopped MAIN, edits only scoped semantic
APIs, compiles C# in the owned compiler capability, runs isolated fresh-world tests
through the exact live editor bridge, retains failures and diagnoses, repairs,
retests and measures two independent verification runs. Success returns the
proposal revision and review hash. Human workspace review/accept and explicit
Save remain required; agent acceptance and source publication are forbidden.
Cancellation or budget exhaustion retains evidence and the unverified proposal.
Sessions are in-memory; exported JSON is durable evidence, not resumable execution.

Editor runtime values are separate from authored scene revisions/history. Attached
components and Transform may change during ordinary Play. Script fields are checked
against typed metadata and readonly/range rules before hydrating the running C#
instance. Structural edits are stopped-only. Stop discards runtime edits. C# source
writes/saves during Play persist authored files but preserve the current worker
until Stop. Compilation is rejected during Play by UI, Ctrl+D, legacy IDE and
daemon API; Auto defers saved changes until immediately after Stop. The next
Play starts the new build. Inspector Transform and typed script fields sample
the live world every 100 ms without overwriting the focused edit control.

A shared compiler controller handles toolbar, Ctrl+D, legacy IDE Compile, Play,
project opening and Auto-after-save. Source hash, build mode and SDK ABI version
identify current builds. Failed hashes remain disabled until source changes. Auto
compiles saved sources without flushing other dirty IDE buffers. No file-system
shell command or AI-generated code is executed outside existing capabilities.

Acceptance: tests/autonomy.test.mjs, tests/game-test-runtime.test.mjs,
tests/scene-workspace.test.mjs, tests/browser/m18.mjs and development/AOT/Windows
C# gameplay gates. See demos/M18_GUIDE.md. Full acceptance evidence is retained in ../reports/m18-browser-evidence.json.
