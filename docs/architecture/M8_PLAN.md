# M8 — Causal Diagnostics v1

Status: complete, 8/8 acceptance points. See ../reports/M8_CURRENT_REPORT.md. Master specification section 127. Weight: 6%.

Read existing causal protocol, M5/M6 agent contracts, M7_PHYSICS.md and resource/
script runtime decisions before implementing new diagnostic surfaces.

1. Define evidence-backed whyNotRendered, whyNotColliding, whyAssetNotLoaded and
   whyScriptNotRunning queries; explanations must describe actual decisions.
2. Add bounded Decision Graph nodes, stable reason codes and correlation lineage.
3. Integrate a trace viewer, diagnostic mode and opt-in deep-trace architecture.
4. Deliberately inject ten known faults and prove correct causal identification
   through automated tests, including unavailable/expired evidence handling.
5. Keep normal-mode overhead bounded; update schema/contracts, report and handoff.

Preserve proposal isolation and the unmerged milestone PR stack.

## Accepted editor additions (user feedback, 2026-10-03)

Deliver these alongside causal diagnostics in M8; switching views must never
implicitly start simulation.

- Separate Scene and Game views from Play/Stop. Scene uses an independent editor
  camera; Game previews the active game camera while stopped as well as playing.
  Editor navigation must not change the saved game camera or authored transforms.
- Click objects in Scene to select their entities, synchronized with Hierarchy
  and Inspector; selecting in Hierarchy highlights the corresponding object.
  Show an outline and interactive translation, rotation and scale gizmos, with
  W/E/R shortcuts, world/local axes and undoable authored edits. One drag is one
  undo operation; Escape cancels a drag.
- Add Unity-style Scene navigation: orbit, pan, zoom, right-button flythrough
  with WASD/QE in 3D, and F to frame selection. In 2D use planar pan/zoom. Avoid
  collisions between navigation shortcuts, transform tools and game input.
- Show a clickable absolute XYZ orientation widget in the bottom-left corner.
  Axis clicks align the editor view; expose perspective/orthographic switching.
- Make Frame diagnostics easy to locate through a Diagnostics tab beside Structured Console
  rather than requiring a long Inspector scroll. Include contact/trigger evidence
  and retain the planned causal explanations.

Acceptance covers stopped Game preview, independent cameras, picking in 2D/3D,
selection synchronization, gizmo undo/cancel, navigation and axis alignment.
M7 user verification: 2D movement/jump, 2D/3D physics/colliders and the Frame
diagnostics trigger were manually verified. Selection must work in both directions.
Standing delivery requirement: include editable demos for new milestone capabilities
whenever they can demonstrate useful functional behavior.
