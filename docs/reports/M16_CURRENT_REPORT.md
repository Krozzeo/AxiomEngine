# M16 — Performance & Low-End Pass and editor authoring

Version 0.0.29. Complete: 8/8 required groups, 100%. Project approximately 88%
(91/104). CI 171: all 26 jobs passed on 2026-10-07.
Executable commit: e6ebb9e1fe4af2b93dfbd1dd1e61ebe7318497a2; tree: 978eaac0d41c72bb6a75050ae601254daaa4415b.
Run: https://github.com/Krozzeo/AxiomEngine/actions/runs/37629606850. Closure only changes documentation/evidence; tested code is unchanged.

## Delivered

Portable Project folders/files, inline names, folder drops in both directions,
scoped copies and confirmed deletion are canonical authoring transactions. Named
C# templates contain the SDK's empty lifecycle functions; generic assets, JSON,
scripts and folders have distinct vector icons. Typed Hierarchy/component clipboard,
parent-aware contextual Create, Locate and optional component X/removal share the
existing revision/Undo/resource validation path.

Requested list menus, exclusive AI/Config branches, Save* dirty emphasis, matching
Close/Separate icons, radio templates and the menubar project title are implemented.
Inspector values commit on valid change/Enter/blur; Game Debug displays actual loop
FPS during Play. Lighting remains explicit: new 3D starters have zero environment
fill, whereas Workshop deliberately authors Environment RGB 0.12, 0.16, 0.24.

The indexed/virtualized Hierarchy, cached Wasm modules with fresh worlds, one-pass
asset admission and reused GPU staging reduce bounded editor/runtime work. Scale
50/75/100% is explicit in primary/parallel targets, defaulting to 100%. GPU work
completes before the next presented frame. Tests render exact assertion boundaries;
replay renders sampled/diagnostic/boundary frames while advancing every simulation
input. Requested pixels are retained before yielding a WebGPU drawing buffer.
Live Diagnostics adds a bounded time cadence for slow adapters.

## Required acceptance

| Required group | Final gate |
| --- | --- |
| Portable file creation/names/moves/copies/deletion/save/Undo | CI M16 and Node |
| Scoped entity/component context clipboard and parenting | CI M16 and Node |
| Menus, Inspector, templates, title, icons and FPS | CI M16 and earlier browser |
| Indexed/virtualized UI and measured memory budgets | CI M16 benchmark/browser |
| Cached isolated Wasm and shared resource admission | Node/Wasm/benchmark |
| Explicit scale, bounded GPU work and exact controlled pixels | M16/M14/M15/browser |
| Editable demos and prior platform/runtime regressions | All 26 CI jobs |
| Evidence, synchronized documentation and complete source delivery | Passed, this report/state/source release |

## Limits and manual checks

Project paths are virtual canonical authoring paths, not arbitrary OS paths.
Explorer opens a bounded export (three retained, 64 MiB each); external edits are
not automatically imported. Copying an asset file aliases immutable data.
Current C# compilation still has one source/class contract; multiple files may be
authored but are not automatically linked into independent script components.
Null has no pixel evidence; software-GPU results do not certify physical low-end FPS.

Only user-specific native OS integration needs a smoke check: on Windows, right-click
a Project file and choose Show in Explorer. Expect Explorer to select the exported
file (folders open their exported directory). If it fails, report whether a window
opened and the latest Structured Console/command trace. Canonical export paths,
bytes, no-shell launch arguments, retention and traversal rejection are automated.
Do not repeat builds, C#, browser editing, physics, replay or pixel tests manually.

## Validation and measurements

190 Node tests, 39 Rust tests, formatting and Clippy with denied warnings, 18 schema
documents, 86 semantic tools and 17 M16 browser criteria pass. Zero page/console
errors. All previous milestone browser gates, real C# Development/AOT, Windows/Linux
bootstrap and Windows/Linux/macOS script boundaries pass. Final Workshop and Grid
screenshots were reviewed. UI scopes are tested without artificial focus workarounds. CI 170 initially hit a compile wait timeout; its retry compiled/started successfully
but exposed held-input release on an unchanged view redraw. The implementation now
clears keys only on actual view changes, and CI 171 tests the same-view/held-key case.
No wait threshold, movement assertion or compiler gate was relaxed.

Environment: v24.19.0, Linux x64, AMD EPYC 9V45 96-Core Processor, 4 logical CPUs;
40 samples per CPU case. Timings are milliseconds, median (p95).

| Measurement | Before | After |
| --- | --- | --- |
| Hierarchy 1024 row construction | 3.824 (6.659) | 0.068 (0.177) |
| Wasm byte instantiation vs cached module/fresh world | 0.437 (0.996) | 0.048 (0.093) |

| Scene instances | Compile median (p95) ms | Actual Wasm bytes | Null processed meshes |
| --- | --- | --- | --- |
| 128 | 0.625 (1.610) | 1179648 | 128 |
| 256 | 1.242 (2.040) | 1179648 | 256 |
| 1024 | 4.925 (7.846) | 1376256 | 1024 |

Each scene shares one asset. The 256-instance browser scene mounts 43 Hierarchy rows,
not the full list, and explicit 50% targets are 480x270. Browser heap samples:
Workshop 13507915 bytes; Grid 13755796
bytes. These are point-in-time JavaScript heap observations, not total/peak RAM.
Raw distributions/environment/budgets: m16-performance-benchmark.json.
Criteria and browser samples: m16-browser-evidence.json.

## Demos and source delivery

Run npm.cmd ci, npm.cmd run demo, then npm.cmd run dev in the M16 sibling snapshot.
Preserve .axiom/projects and its complete asset/script folders from earlier snapshots.
Editor & File Workshop exercises tree/icons, inline authoring, contextual entity/component
copies and explicit environment fill. Low-End Instance Grid contains 256 static cubes
sharing one asset, Low quality and 50% render scale; Game Debug displays FPS in Play.
See demos/M16_GUIDE.md. Source delivery is the immutable public GitHub archive of the
closure commit, containing the complete tracked source/docs; dependencies and build
outputs are regenerated normally. No locally generated ZIP/hash is claimed.
Next M17 is Advanced Assets/CAD, planned in M17_PLAN.md, not started.
