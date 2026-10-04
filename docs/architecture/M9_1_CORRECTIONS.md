# M9.1 — editor usability and angular contacts

Requested corrections before M10; this is a completion patch for M8/M9, not M10.
Whole-project weighted progress remains 62%. Existing projects are preserved.

Reference: Unity Scene view navigation, https://docs.unity.com/en-us/engine/6000.6/manual/unity-editor/editor-windows-views-reference/using-the-scene-view/scene-view-navigation
(accessed 2026-10-04). Alt + left drag orbits the current pivot; fly navigation is a
separate mode. Axiom also defaults right drag to orbit, with right + WASD/QE for fly.
Alt click toggles selection; a four-pixel drag threshold distinguishes it from orbit.

Acceptance:
1. Orbit retains focus/distance and Game remains independent.
2. Rotate rings follow the dragged direction in either camera-facing orientation.
3. Empty Inspector contains only name/Transform; optional components add/remove,
   scripts attach/detach and Undo works through existing public commands.
4. File menu owns project/asset/game-camera operations; Settings owns rendering and
   connection globals. Hierarchy comes first in the left panel.
5. Tree expands/collapses, selection is bidirectional, Alt multi-select disables
   property editing; batch parent/unparent conserves world TRS and is one Undo.
6. Project explorer is the first bottom tab, followed by Console and Diagnostics;
   Clear is a separate left-aligned action. Ctrl+Z/Ctrl+Shift+Z respect text inputs.
7. Nine primitive shapes use ordinary imported GLB resources and public commands.
8. Rust/Wasm oriented box/circle/sphere contacts have inertia, point velocities,
   normal/friction angular impulses, quaternion integration and rotated raycasts.
9. Off-center collisions rotate both 2D and 3D bodies; centered contacts and
   freezeRotation remain stable; Stop restores authored positions/rotations.
10. Point light/parent previews update illumination throughout a drag; directional
    and spot light direction is the entity-rotated local light direction.
11. New editable Editor Workshop and Angular Contacts 2D/3D demos preserve all
    previous demo projects and exercise the actual engine.
12. Full Node/native/schema/binding/proposal/C# and M2–M9 browser regression gates.

Contracts and current limits:
- Optional `parentId` stores local TRS. Reparent keeps world TRS, skips selected
  children when their ancestors are selected and rejects cycles/missing parents.
  The scalar Rust instance ABI represents TRS; transforms that introduce shear
  are rejected explicitly (use uniform parent scale), rather than silently warped.
  Parent deletion recursively deletes its subtree and script attachments, undoably.
- Colliders use authored world-unit halfExtents, with entity world rotation.
  Capsule/cylinder/pyramid are geometry primitives, not new collider shape types.
  Physics supports oriented boxes and circles/spheres, 256 bodies, 60 Hz, 12 impulse
  iterations, discrete contacts (no continuous collision detection or joint solver).
  Contacts expose a finite world-space point in addition to normal/depth.
- Transform is mandatory. Material/Light/LOD/Renderable/Collider/RigidBody are
  optional. RigidBody requires Collider; LOD requires mesh Renderable. Removing a
  Renderable removes its LOD; removing a Collider removes its RigidBody.
- C# uses the existing single compiled GameScript type with up to 32 attachments.
  Add Script shows compile/attach or attaches the existing build; Remove detaches
  only the selected entity; compile retains prior attachments. Independent script
  types are not yet supported.
- Project explorer indexes the scene JSON, imported sources and Game.cs; it is
  project-scoped, not an unrestricted operating-system filesystem browser.
- Editor orbit/gizmo previews are transient; one release commits one Undo. Escape
  discards the preview. Selection/camera/menu state is not serialized as gameplay.
- Direction is stored in local space (legacy identity-rotation lights are unchanged).
  New lights use local -Z. Rendering settings and the saved Game camera stay global.

Verification status: complete (12/12 groups). Full 18-job CI and visual review
are recorded in M9_1_CURRENT_REPORT.md.
