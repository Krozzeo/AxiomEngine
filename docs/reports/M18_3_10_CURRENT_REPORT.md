# 0.0.48 / M18.3.10 — implementation in progress

This is a work record, not a completed release. PR #39 is draft and unmerged.

## Scope

- Hub-only project creation/opening and reliable automatic Hub dismissal.
- Remove public Autonomy diagnostics menu; keep deterministic regression machinery internal.
- Physical .scene editor documents, Main Scene in every new project, additive authoring hierarchy, active title/camera/view, independent collapse/close and undoable document changes.
- Explicit PlayerPref Inspector bindings keep saved counters visible outside Play without preserving arbitrary runtime mutations.
- Remove cumulative creation quota; retain live world/frame limits, correct lifetime cleanup and add 2D/3D stress labs.
- Partial executable expansions in platform/tooling, grid navigation/HTTP, presentation, execution/time and scenes/resources/save serialization. BATCHES.md records remaining capabilities; full Unity category compatibility is not claimed.
- Typed script component/asset references and compatible drag/drop, pointer-release selection, independent locked/dockable/detachable Inspectors, duplicate Inspector and common tab close context actions.

## Verification

- First checkpoint CI304: native/Rust success and actual Linux C# development execution passed 45 SDK checks, including 68 lifetime creations with bounded live objects. This checkpoint predates the reference/Inspector additions.
- Current focused Node suites cover authored scenes, camera restoration, atomic invalid opens, references, focus locks, network bounds/credential exclusion and generation of all eight physical demo projects.
- Full updated CI, C# references/AOT/Windows and new browser UI acceptance are still required. No final delivery is approved by this report.
- Local browser process exits in the managed environment; browser acceptance is run in CI rather than treated as a user prerequisite.

## Demos

See demos/M18_3_10_GUIDE.md. No paid model calls or Player demo revalidation are needed.

Original weighted MVP baseline remains approximately 94%; the expanded compatibility work is additional unweighted scope.
