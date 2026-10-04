# M10 — current acceptance report

Status: implementation complete, verification in progress. Version 0.0.22.
Milestone not closed; weighted project baseline remains 62% until full acceptance.

All eight required groups await final integrated CI: contracts; sprite batching;
tilemaps; animation/pixel camera; lights/particles; physics/UI routing; editable
demos; regression/visual/budget/documentation closure. Read M10_PLAN.md and
M10_2D.md. Local contract/proposal tests and planner benchmark have executed.
Clean Rust/Wasm builds, .NET/browser behavior and cross-platform regressions
require CI; no old cached Wasm artifact is evidence for the new exports.

Demos: M10 Pixel Adventure and M10 Sprite Batching Lab, generated through normal
commands. Existing projects remain untouched. See demos/M10_GUIDE.md.
No user-only test has been identified; CI acceptance must complete first.
