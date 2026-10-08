# M17 demos

From the M17 folder run `npm.cmd install`, `npm.cmd run demo`, then
`npm.cmd run dev`. Each demo command creates new projects and preserves existing
ones. Refresh Saved projects and open a name beginning **Demo · M17**.

## CAD & Mesh Workshop

Game shows two imported CAD solids, an OBJ tetrahedron, an STL triangle and a sphere.
Scene remains independently navigable. Select STEP solid/IGES solid in Hierarchy:
their Renderable references the original source and they have generated box Colliders.
The sphere has two generated LOD levels and a box Collider. Imported units have been
scaled explicitly so the tiny CAD fixtures are visible next to the other objects.

Use File → Assets → Import / Manage to import your own OBJ/STL/STEP/IGES. Mesh settings
let you choose metre conversion, Y/Z up axis, normals, centering and CAD tessellation
quality. Sources are limited to 8 MiB; this is static geometry import. Place an imported
asset, select its entity, then Process selected entity mesh to generate editable
LODs and/or a centered box Collider. Use Undo to revert the complete processing job.
Collision is a bounding-box approximation, particularly noticeable for the sphere
or hollow geometry. Add a RigidBody to simulate; the workshop itself is a static
inspection scene. Move the Game camera further away to exercise distance LODs.

## Script Component Lab

The cube has InspectorMover and Notes. The sphere has another InspectorMover with
independent Speed and Direction. Select the cube: change Speed, the Direction vector,
Mode enum or Enabled before Play. Title/Space/Tooltip organize the fields; Frames
and Elapsed are readonly. First Play compiles the physical sources automatically
(.NET 10 SDK and wasm-tools must be installed); compilation status is in IDE.
The cube oscillates horizontally and the sphere vertically at a different speed.
Frames/Elapsed update in the Inspector during Play. Stop restores authoring fields.

Click the source name in an Inspector card to open it in IDE. Open both scripts:
each has its own tab, close icon and pending edits. Type a comment in both; Ctrl+S
saves only the active script, while Save All saves both. Ctrl+F opens Find/Replace.
Right click a Script card: Open or Show in Project locates its physical source.
Create a C# file in Project, keep its MonoBehaviour template, and select an entity:
find its class name in Add Component or drag the file onto Inspector. Existing
scripts can be reused across entities; runtime code stays in IDE, not Inspector.

The Inspector supports scalar/string/bool/enum fields, vectors and integer vectors,
Quaternion, Color/Color32, Rect and Bounds; public fields show by default, private
ones use SerializeField. See ADR 017 for grammar and budget limits. Empty templates
contain OnStart/OnUpdate/OnStop. This is an Axiom SDK, not a UnityEngine assembly.

No context menu appears on Scene/Game right click. Camera navigation keeps using
right mouse. Deselect an entity with Esc or a blank click and reselect it: rename
requires another deliberate click on its selected name.
