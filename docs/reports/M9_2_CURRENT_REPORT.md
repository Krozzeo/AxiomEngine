# M9.2 — editor refinements

Status: complete (12/12 correction groups, 100%). Version 0.0.21.
Approximate weighted project progress remains 62%; M10 has not started.

## Outcome

The twelve requested refinement groups are implemented: outward primitive shading,
Ctrl+Y/Delete, Move arrows, searchable components at the bottom of an Inspector
headed by Transform, separate Collider/RigidBody, saved resizable panels,
compact Project tree/icons, visible Scene root and sibling insertion gaps,
Ctrl/Shift selection, atomic group transforms, right-aligned Clear and lateral menus.

Legacy M9.1 sphere/capsule sources are identified by exact hashes and corrected
only in derived import. The original immutable sources and IDs are preserved.
Importer v3 invalidates old derived caches. Panel sizes persist in project.editor,
using the saved scene so the active dirty draft and scene Undo history remain intact.

## Acceptance

| Requested group | Implementation and verification |
| --- | --- |
| Sphere/capsule shading | Outward winding and normals; every closed primitive triangle checked; legacy derived repair |
| Ctrl+Y and Delete | Public Redo and atomic selected-subtree deletion; input/Play guards |
| Move arrows | Directional SVG arrowhead hit targets; actual group drag |
| Inspector order/search | Transform before optional components; prefix suggestions below all components |
| Collider/RigidBody | Independent forms, parameters and removals |
| Resizable panels | Three bounded splitters; automatic project persistence without saving the dirty scene |
| Project explorer | Compact expandable folder tree, file icons and selected-file preview |
| Hierarchy | Framed compact tree; root drop unparents; between-row drop orders siblings; atomic Undo |
| Ctrl/Shift and multiple transforms | Visible range/toggle selection, mixed Inspector values, actual group Move/Rotate/Scale |
| Fundamental properties first | Name/Position/Rotation/Scale appear at the top |
| Clear Console right | Separate right-aligned action |
| Cascading menus | Lateral submenus beside owning rows; creation through actual menu clicks |

## Evidence

[CI run 37218376172](https://github.com/Krozzeo/AxiomEngine/actions/runs/37218376172)
passes 18/18 jobs at exact executable commit
`b2f71b8928395e7469726a257c5ad0caf1631545` and tree
`8f459c1e9745884c661c39acdba1720de5d29e2a`. The local code tree matches.
Closure commits only change documentation/evidence; executable code is unchanged.

- 119 Node tests on Linux and Windows, zero failures.
- 33 Rust tests; formatting, Clippy with warnings denied and core Wasm check pass.
- 16 schemas, 60 semantic tools, generated bindings, three architecture rules
  and shared daemon parity pass.
- M2–M9 browser regressions and 15 correction/refinement browser criteria pass.
- Linux C# development/AOT and Windows development pass.
- Browser reports zero page, console and HTTP errors. During uncommitted light
  dragging, 80,642 shaded pixels change outside the gizmo region.
- Three final demo screenshots reviewed: sphere/capsule outward shading, compact
  Hierarchy/root, arrows, Inspector ordering, right Clear and angular contacts.
- Large bottom-panel resizing preserves the canvas aspect ratio and pointer mapping.

See [retained browser evidence](m9.2-browser-evidence.json) for all 15 criteria.
Chromium software Vulkan/WebGPU proves functionality; physical GPU performance
is not measured.

## Demos

The three refreshed M9.2 demos preserve all old projects and use normal importer,
commands, renderer and physics. See demos/M9_2_GUIDE.md. Editor Workshop is for
stopped authoring; Angular Contacts 2D/3D use Play and retain Stop isolation.

## Required manual tests

None. New editor interactions and prior regressions were automated.

## Limits and next work

TRS without shear; discrete OBB/circle/sphere physics without CCD/joints; one
compiled GameScript type; project-scoped explorer. M10 remains the next milestone.
PR #11 is stacked on unmerged #10; leave all milestone PRs unmerged.
