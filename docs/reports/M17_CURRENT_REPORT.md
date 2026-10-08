# M17 — Advanced Assets / CAD and editor scripting

Version 0.0.31. Complete: 12/12 required acceptance groups, 100%. Project
approximately 90% (94/104 roadmap weight). M18 is planned and not started.

## Outcome

OBJ, STL, STEP and IGES import through the stable asset resource/job APIs with
explicit units, axis, centering, tessellation quality and normals. Cleanup removes
duplicate/degenerate triangles. Processing publishes editable dependent LOD levels
and optional bounding-box Colliders in one undoable transaction. Immutable sources,
build/dependency identity, cancellation and revision checks remain authoritative.

C# files live in Project and attach as reusable per-entity components through
Add Component class search or drag. Typed Inspector fields serialize per instance;
layout/visibility/editing attributes organize them. Readonly values update during
Play without changing the authoring world. Transform uses Vector3/Quaternion;
the SDK includes float/integer vectors, colors, rectangles, bounds and math helpers.
The IDE has independent tabs, close/list controls, dirty indicators, scoped Ctrl+S,
Save All and Find/Replace. Inspector Open/Show in Project locate the physical file.
No viewport right-click menu appears, Panels hover matches other menus, the project
title inherits the font with italic gray styling and deselection resets rename.

## Acceptance

| Required group | Result |
| --- | --- |
| Bounded OBJ/STL import and concave OBJ triangulation | Passed |
| Executable STEP/IGES tessellation fixtures | Passed |
| Persisted units, axis, pivot and tessellation settings | Passed |
| Mesh cleanup and flat/smooth normals | Passed |
| Dependent generated LODs, stable build identity and invalidation | Passed |
| Undoable generated collision with explicit box approximation scope | Passed |
| Worker limits, cancellation, revision and dependency validation | Passed |
| Physical reusable C# sources, multiple components and source reconciliation | Passed |
| Typed SDK/Inspector fields, attributes, hydration and runtime isolation | Passed |
| Multi-tab IDE, scoped save, save-all, find/replace and reopening | Passed |
| Viewport context behavior, Panels/title and delayed rename corrections | Passed |
| Editable demos, full regressions, visual evidence and synchronized docs | Passed |

## Automated evidence

All 28 jobs in CI 185 pass:
https://github.com/Krozzeo/AxiomEngine/actions/runs/37825538456.
Executable commit `f3ca567d179b348210ac2495c7530025fdd08618`, tree
`0cbd8bf9665722c4e27b7b612e725fe1b0d8e0a8`. Closure changes documentation/evidence
only; executable source is unchanged. Bootstrap checks on Linux/Windows validate
214 Node tests, 18 schema documents, three architecture rules, daemon parity,
generated bindings and 87 semantic tools. Rust fmt/clippy, 39 tests and Wasm target
check pass. Linux development/AOT and Windows development execute physical multi-file
C# compilation, typed private-field hydration, integer vector/color snapshots,
readonly counters and the legacy gameplay lifecycle. Earlier browser milestones
and corrections pass. M17 browser acceptance passes eight criteria with no errors.

Local verification: 208 non-server Node tests, architecture/schema/tool/binding/parity
checks and module build using the existing kernel. Six clean-build server tests,
native Rust and browser/.NET gates were executed in CI, not claimed as local runs.
Raw evidence: m17-browser-evidence.json. Final CAD and script screenshots were
reviewed from artifact 11571805325. Rendering uses software WebGPU; no physical GPU
performance or broad CAD corpus compatibility is inferred from these fixtures.

## Manual tests requested from the user

None. Requested interactions have equivalent automated acceptance. Demo exploration
is optional, not a manual release gate.

## Known limitations and risks

CAD imports static tessellated geometry, not parametric editing or an assembly
entity tree. Sources are at most 8 MiB; output is bounded to 64 primitives and
300,000 vertices. Workers have a 15-second deadline, 128 MiB V8 old-generation limit
and 256 MiB Wasm linear memory. OBJ does not fetch external MTL/textures. Generated
collision is a centered box; it does not model hollow/concave geometry. Generated
LOD ratios are quality targets, not guaranteed triangle percentages. Static mesh
processing rejects animated/skinned resources; ordinary animated imports remain.

Inspector metadata covers documented scalar/enumeration/vector/color/rect/bounds
instance fields, not arbitrary properties, nested classes or generic collections.
Computed initializers execute in C# and show actual values after Play; editing
before Play explicitly overrides them. This is Axiom's SDK, not UnityEngine binary
compatibility. IDE is a simple editor without complete language services. Old
script bundles need recompilation for runtime field snapshots. Native exports are
snapshots rather than live watched files. License/source/rebuild notices accompany
the pinned CAD dependency in THIRD_PARTY_NOTICES.md and docs/licenses.

## Demos, delivery and next task

Run `npm.cmd ci`, `npm.cmd run demo`, then `npm.cmd run dev`. CAD & Mesh Workshop
demonstrates four imports, mesh settings, LODs and box collision. Script Component
Lab demonstrates reusable components, independently configured motion, readonly
fields and IDE workflows. See demos/M17_GUIDE.md for controls and expected results.
Preserve the complete `.axiom` folder when moving existing projects. The immutable
source ZIP includes all tracked code/docs; dependencies/builds regenerate normally.
PR #21 stays ready/open/unmerged, stacked on #20. Next: M18 Agent Autonomy Loop;
see docs/architecture/M18_PLAN.md. Do not begin M19 or merge milestone PRs automatically.
