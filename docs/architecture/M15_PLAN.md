# M15 — Replay and Diagnostic Replay

Status: implementation under acceptance, not complete. Master specification section 134.

Start from completed M14 and preserve its isolated runtime, bounded public controls,
fixed frame/input contract, cancellation, simultaneous view ownership and authored
MAIN isolation. Read the master, architecture manifest, M14_GAME_TESTING.md,
ADR-0028, M13_PROFILER.md and the physics/animation/audio contracts first.

Implement input recording, controlled random seeds, state checkpoints, bounded
replay ranges and diagnostic re-execution. Inventory state that can be faithfully
serialized, including C# worker state and asynchronous resources. Report unsupported
state explicitly; do not infer deterministic GPU/audio/wall-clock behavior.
Public agent operations must carry project/workspace/session identity and revision,
have resource budgets and cancel cleanly. Re-executed diagnostics retain original
and replay provenance, without overwriting evidence or authored project data.

Provide human range/checkpoint controls and editable demos that show recording,
repeatable replay and diagnostic investigation. Complete earlier CI regressions,
browser acceptance and synchronized report/state/source ZIP/ready-unmerged PR.
Do not begin M16 optimization in this milestone.
