# M16 — Performance & Low-End Pass

Status: planned, not started. Master specification section 135.

Use completed M15 as the baseline. Preserve fixed-step tests/replay, public revision
contracts, entity Camera/Game preview, explicit lighting and authored MAIN isolation.

Measure representative editor and gameplay workloads before changes. Address Tier 0
fallbacks, memory budgets, entity/draw scaling, UI virtualization, asset/shader caches
and C# compile/runtime costs only where measured evidence justifies the change.
Keep low-quality behavior explicit rather than silently discarding capabilities.

Add editable stress/low-end demos and repeatable measurements with environment,
counts, timing/memory distributions, limits and diagnostics. Software-GPU CI is a
regression environment, not a physical low-end performance claim. Retain all earlier
platform/browser/C#/Rust/schema gates and demonstrate behavior equivalence through
M14 game tests and M15 replay where applicable.

Close with actual benchmark and acceptance evidence, current report/handoff/state/
changelog, a complete source ZIP and ready/open/unmerged stacked PR. Do not begin
M17 advanced asset/CAD work during this optimization milestone.
