# M14 — Automated game testing and editor workspace

Version 0.0.27. Complete, 100%. Project: approximately 80% (83/104 roadmap weight
points). M15 replay is planned and has not started.

## Delivered

- Controlled simulation input and exact fixed 1/60 stepping, paused begin/manual
  step/finish and cancellable bounded public gameTest.control jobs.
- Runtime entity count, position/quaternion, collision, animator and real pixel
  assertions. Fixed CPU/Wasm input repeats identically for the tested C# controller.
- Human saved suites, JSON import/export and readable actual/expected/frame results.
- Three editable demos: Frame Step Lab, Collision Assertions and Animation
  Assertions; passing, deliberately failing and visual suites demonstrate outcomes.
- Independent Scene/Game cameras render simultaneously in main/popup windows using
  one kernel, worker, simulation, audio owner and renderer lease.
- Physical dock tab reorder/move, self-drop no-op, persistent closure/order, Panels
  reopening and Reset restoring Project-first defaults. Compact right-hand controls.
- File/Create/Panels/Config/Help menus; implemented modular quick examples, version
  details and removed redundant Hierarchy buttons. Planned entries stay disabled.
- Save icon before File, confirmed dirty asterisk, File Save/Undo/Redo and Ctrl+S,
  including focused Inspector fields and detached windows.

## Acceptance

All 24 CI jobs pass in run [37346013283](https://github.com/Krozzeo/AxiomEngine/actions/runs/37346013283)
on executable commit `9bd1ea533df830c170b4a99e0dffc81354697030`, tree `086cfb3a1621ed15ad5101273117f753a1cacbb9`.
169 Node tests, 39 Rust tests, 17 schema documents, 80 semantic tools and all prior
browser/C# development/AOT/platform regressions pass. New real-browser acceptance:
13/13 criteria, zero page/console errors. See m14-browser-evidence.json.
The 163 locally available Node tests also passed; six clean-build server fixture
checks ran in CI. CI freshly built Cargo/Wasm and compiled the actual C# controller.
Screenshots of test results and both simultaneous views were visually reviewed.
Local DOM checks additionally cover failed-save dirty retention.

## Limits

Suites are bounded to 12 blocks, 600 total frames and 48 assertions, with a 30-second
active execution budget. Manual UI stepping advances the first plan block; public
step accepts a validated block. Test completion, cancellation and external scene
replacement release input/runtime without restoring stale authored state. Audio
playback and live gameplay input are suppressed during isolated tests.
Determinism is limited to fixed-delta CPU/Wasm, controlled input and supported
resource/script behavior; arbitrary C# wall clocks/random, audio clocks and GPU
pixels are outside that guarantee. Pixel assertions use explicit tolerance; Null
fails with unavailable pixels. Software GPU evidence is not a physical GPU benchmark.
Secondary Scene is a camera preview; activate its tab for the interactive surface.
Quick Video/entity-camera entries remain planned. Frame Step movement requires
.NET 10/wasm-tools; missing compiler is reported, never claimed as tested gameplay.

## Delivery and next work

No new user-only manual test is required. Run npm.cmd run demo to create the three
projects, then npm.cmd run dev; see demos/M14_GUIDE.md. Preserve .axiom/projects
when moving to a new source folder. Source ZIP corresponds to the closure commit.
PR #17 is ready/open and stacked on #16; all milestone PRs stay unmerged.
Next: M15 input recording, seeds, checkpoints, replay ranges and diagnostic
re-execution, per M15_PLAN.md and master section 134.
