# M9.1 — editor authoring and angular physics complete

## Outcome

Version 0.0.20 completes the twelve requested correction groups before M10.
M9.1 is 100% complete; approximate weighted whole-project completion remains 62%.
This patch consolidates M8/M9 and does not claim M10 scope.

The editor now has focus-based orbit, corrected Rotate dragging, optional entity
components and script attachment, a top File/Settings menu, an expandable tree,
Alt multi-selection and world-preserving parenting by buttons or native drag/drop.
Project is the first bottom tab; Console has a separate Clear action, and Ctrl+Z
uses the canonical Undo path. Nine imported primitive meshes are available.
Lights preview throughout drags, and directional/spot directions follow rotation.
Owned Rust/Wasm contacts now integrate rotation and angular velocity in 2D/3D.

## Acceptance criteria

All twelve groups in [the correction contract](../architecture/M9_1_CORRECTIONS.md)
passed; none are deferred:

| Group | Result | Evidence |
| --- | --- | --- |
| Focus orbit and independent Game | Passed | Math tests; real right-drag; M8 regression |
| Rotate direction | Passed | Both-facing projected math; actual Z ring drag and Undo |
| Modular components and scripts | Passed | Empty Inspector; add/remove; C# attach/detach/reload and Undo |
| Menus and entity-only Inspector | Passed | Controller/browser interactions; reviewed image |
| Tree, multi-selection and parenting | Passed | Collapse, Alt click, disabled multi-edit, native batch drag/drop, history/persistence |
| Project/Console/Diagnostics and shortcuts | Passed | First tab/explorer, distinct Clear, Ctrl+Z |
| Nine primitives | Passed | Finite GLB import for each; public menu creation |
| Oriented/angular solver | Passed | Native SAT/raycast/torque/manifold tests and actual Wasm |
| 2D/3D torque and Stop isolation | Passed | Both new demos show changed rotation; Stop restores original scene |
| Live and rotation-based lights | Passed | Lighting plan tests; 80,642 changed shaded pixels outside gizmo region during uncommitted drag |
| Editable demos and preservation | Passed | Three new scenes; old projects retained; screenshots reviewed |
| Cross-platform regressions | Passed | Entire 18-job CI including M2–M9 and C# |

## Verification

[CI run 37209258078](https://github.com/Krozzeo/AxiomEngine/actions/runs/37209258078)
completed successfully, 18/18 jobs, at executable code commit
`ba58fa326cbd481a144a3a075bd6d8ebd0f2df49` (tree
`a7f04d604baabc73f9de823b3f52ed94277772e4`). Local code tree is identical.
Closure commits only add documentation/evidence and preserve tested executable code.

- 112 Node tests on Linux and Windows; zero failures.
- 33 Rust tests; formatting, Clippy with warnings denied and core Wasm check pass.
- 16 schema documents, generated bindings, 57 semantic tools, three architecture
  rules and shared daemon parity pass.
- M2–M9 browser regressions and nine additional correction browser criteria pass.
- C# development on Windows/Linux and Linux AOT pass.
- Correction browser reports zero page, console and HTTP errors.
- Three demo screenshots reviewed: all nine geometries and hierarchy appear;
  both physics demos render, the offset box tips, and the centered box remains supported.

[Browser evidence](m9.1-browser-evidence.json) records the correction interactions.
Tests use Chromium with software WebGPU/Vulkan in CI. This proves functionality;
it does not measure performance of the user's physical GPU.

## Demos and use

See [the demo guide](../../demos/M9_1_GUIDE.md). `npm.cmd run demo` creates nine
editable projects with fresh IDs, including Editor Workshop and Angular Contacts
2D/3D. Existing projects remain intact. Preserve the entire `.axiom/projects`
directory when moving from an earlier source package.

## Current limits

See the correction contract for exact bounds. Nonrepresentable TRS shear is
rejected; uniform parent scale is recommended. Physics remains discrete OBB and
circle/sphere contacts, without CCD/joints; capsule/cylinder/pyramid are geometry
rather than collider types. Project explorer is project-scoped. C# currently uses
one compiled GameScript type with up to 32 entity attachments.

## Required manual tests

None. The newly requested interactions and previous regressions were automated.

## Next work

Proceed with M10_PLAN.md. PR #10 is stacked on #9; keep milestone PRs unmerged.
