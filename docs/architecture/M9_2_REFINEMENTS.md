# M9.2 — editor refinements before M10

All twelve requested groups are implemented, awaiting full CI and visual review.
Approximate weighted project progress remains 62%.

1. Outward sphere/capsule winding; exact known legacy M9.1 primitive sources are
   corrected in derived import only. Importer v3 rebuilds cached resources;
   original files and stable asset IDs remain unchanged.
2. Ctrl+Y Redo alongside Ctrl+Shift+Z; Delete removes selected subtrees atomically.
   Shortcuts do not intercept text inputs, contenteditable or Play edits.
3. Move uses directional SVG arrowhead hit targets.
4. Transform comes first; Add Component comes last with prefix search suggestions.
5. Collider and RigidBody have independent Inspector forms and removals.
6. Three accessible pointer/keyboard splitters persist bounded panel dimensions in
   `project.editor`. Layout saves use the saved scene, preserving dirty drafts and
   Undo history. AI proposals cannot change main project layout.
7. Project explorer has a compact expandable folder tree and labeled file icons.
8. Hierarchy has visible Scene root, compact framed rows and insertion gaps.
   Drop on a row to parent; drop on root to unparent; drop between rows to order
   siblings. All conserve world TRS, reject cycles and undo atomically.
9. Ctrl toggles individual selection; Shift selects the visible Hierarchy range.
   Scene Ctrl/Shift clicks toggle selection. Alt is reserved for camera navigation.
10. Inspector enables multi-entity position/rotation/scale with mixed values left
    blank. Entered axes apply to every selected entity, preserving mixed blank axes.
    Gizmos use the active entity as shared world pivot and commit one batch Undo.
11. Clear Console is a separate button aligned to the right.
12. File/Settings cascade horizontally alongside their owning menu rows.

Three refreshed M9.2 demos exercise the new editor and existing angular physics.
Old demos and user projects are retained. Limits remain discrete OBB/circle/sphere
physics, TRS without shear, one compiled GameScript type and project-scoped files.

New public operations: scene.entities.update, scene.entities.delete,
project.editor.update and optional beforeId on scene.entity.reparent.
The canonical schema/catalog remains the source of authority (60 semantic tools).
