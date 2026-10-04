# M10 — 2D Production Foundation

Status: not started. Roadmap weight: 6%. Master specification section 129.
Start only after M9 full CI and closure. Read M9_RENDERER.md, ADR-0022,
M8_DIAGNOSTICS_AND_EDITOR.md, M7_PHYSICS.md, M6_WORKSPACES.md and the current
reports before changing rendering, input, physics or proposal behavior.

Required capabilities: sprite batching, tilemaps, sprite animations,
pixel-perfect cameras, 2D lighting, particles, physics integration and a 2D UI
foundation. Human Inspector/editor controls and AI APIs must use the same
canonical commands, validation, revision checks, Undo and persistence.

Acceptance work:

1. Define bounded declarative 2D components and resource references. Preserve
   existing project formats, M9 opt-in rendering and M6 proposal isolation.
2. Render sprites with batching and correct alpha/order semantics. Add measurable
   draw/resource budgets and explicit WebGPU/Null capability behavior.
3. Implement editable tilemaps with bounded storage and normal asset import,
   commands, save/reopen and visible human editing controls.
4. Implement sprite animation and pixel-perfect Game camera behavior; stopped
   preview and transient Scene navigation remain independent of Play.
5. Add bounded 2D lighting and particle behavior with reproducible runtime state,
   resource lifecycle and useful Diagnostics. Do not introduce an external engine.
6. Integrate 2D physics and a minimal UI layer with input routing that distinguishes
   Scene editing, Game gameplay and UI interaction.
7. Create editable demos for the new functions, with controls and expected results.
   Preserve all earlier projects; use normal commands rather than demo-only paths.
8. Run unit/protocol/proposal tests, real browser pixel/interaction acceptance,
   bounded benchmarks and all earlier CI regressions. Review images, document
   exact limits, update handoff/state/changelog and deliver the entire milestone.

Do not count this plan as functional progress. Define precise component and UI
contracts before implementation, then close every required capability with
executable evidence. M11 remains the separate general animation milestone.
