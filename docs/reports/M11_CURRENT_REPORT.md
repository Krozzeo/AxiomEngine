# M11 — General animation closure

M11 (0.0.23) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 72%.
General GLB animation includes skeletons/skins, rigid TRS clips, Rust playback,
shortest-path rotation interpolation, crossfades and bounded state machines.
Animator Inspector, C# and AI controls share observed runtime state; canonical
editing retains revisions, Undo, Save and isolated proposals. WebGPU skinning
works in legacy/HDR, and Null consumes the same Rust poses. Pixel-perfect Scene
uses nearest texture filtering while preserving its free editor camera.
All 20 jobs in CI run 37239883665 pass at executable commit
cc4b072cef49ffe7b9e9d8b9aea4a095275f8172 (tree c265d3894305fae4973816320eb08bee6d2d0f8f).
135 Node and 39 Rust tests, nine new browser criteria and earlier regressions pass.
Final software WebGPU/Null screenshots were reviewed. No user-only test remains.
Read docs/reports/M11_CURRENT_REPORT.md, docs/architecture/M11_ANIMATION.md and
demos/M11_GUIDE.md. Next: M12 audio, per M12_PLAN.md/master section 131.
PR #13 is ready for review, stacked on unmerged #12; do not merge automatically.

## Acceptance

| Group | Status | Evidence |
| --- | --- | --- |
| Bounded GLB skeleton/skin/TRS resources | Passed | standard import, normalized weights, invalid input rejection, static regressions |
| Rust clips and skeletal hierarchy | Passed | actual native/Wasm timing, pause, interpolation and deformation |
| Crossfade and state machines | Passed | parameter decisions, finished-clip return and independent instances |
| GPU skinning and Null parity | Passed | changed actual legacy/HDR pixels, animated bounds and Null observations |
| Shared human/AI/C# control | Passed | Inspector editing/Undo, C# keyboard API, observed query and lease checks |
| Persistence and proposals | Passed | Save/reopen, atomic validation, private review/accept/Undo |
| Demos and Scene pixel correction | Passed | three canonical demos, exact nearest colors in Scene/Game |
| Regression, measurements and closure | Passed | 20/20 CI, image review, bounded benchmark and synchronized docs |

## Automated evidence

https://github.com/Krozzeo/AxiomEngine/actions/runs/37239883665

135 Node tests on Windows/Linux and 39 native Rust tests pass. Formatting,
Clippy with zero warnings, Wasm check/release build, 16 schemas, 70 semantic tools,
generated bindings, three architecture rules and native/bootstrap parity pass.
Nine new browser criteria cover bind preview, editing/Undo, autoplay, pixel pause,
C#/AI transitions, Stop reset, HDR skinning, rigid clips/Scene filtering and Null.
M2–M10/correction regressions and Windows/Linux development/Linux AOT C# pass.
Browser page/console/HTTP error arrays and editor/renderer fault diagnostics are empty.
Screenshots reviewed: editor, bind/Play, pause/reset, crossfade, HDR, rigid clips,
Scene/Game pixel art and Null. Adjacent JSON retains exact source/run provenance.
Actual Rust/Wasm pose evaluation, scalar boundary and CPU reference deformation
p95 at 1/8/16 instances (4096/32768/65536 vertices): 13.26/43.50/54.03 ms.
All meet the bounded 350 ms software-host admission threshold. This measurement
excludes GPU skinning and full-frame/hardware FPS; it is not a low-end performance claim.
Closure changes documentation/evidence only after the executable source passed CI.

## Manual tests

None required. Editing, keyboard input, physics/rendering regressions, pixel
comparison, persistence, pause/Stop and runtime observations were automated.
Physical GPU/full-frame performance has not been benchmarked.

## Demos and limits

Run `npm.cmd ci`, `npm.cmd run demo`, `npm.cmd run dev`. Open M11 projects through
Archivo → Proyectos. Skinned Robot Studio shows independent joint animation;
Clip and State Lab uses rigid tracks; Pixel Scene Clarity compares nearest
sampling while Scene keeps free navigation. See demos/M11_GUIDE.md for controls.
Optional keyboard controller compilation needs .NET 10/wasm-tools; unavailable
compilation explicitly preserves all scenes and Inspector/AI controls. Preserve
all .axiom/projects folders including asset/script files on upgrade. Repeating
demo generation creates additional projects and never deletes existing scenes.

STEP/LINEAR TRS, up to 128 nodes, 8 skins × 64 joints, 16 clips, 4096 keys,
16 Animator instances and 65536 expanded animated vertices are supported.
Animator excludes LOD; no IK, retargeting, root motion, events, cubic curves or
morphs are implemented. States/transitions/parameters are bounded; exact contracts
are in M11_ANIMATION.md and ADR-0024. Native daemon authoring still uses its M0
surface; project authoring uses the Node bootstrap. Arbitrary zoom/rotation can
alter pixel distribution, even with sharp nearest texture colors.

M11: 100% (8/8). Approximate weighted project completion: 72% (68% + 4%).
Next: M12 audio (planned, 0%). PR #13 ready, stacked on #12, unmerged.
