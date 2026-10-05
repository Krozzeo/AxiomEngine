# M13.1 — Editor workspace and profiler corrections

M13.1 (0.0.26) is complete: six correction groups, 100%. Project progress remains approximately 76% (79/104 roadmap weight points); these corrections do not advance M14.
Profiler captures survive Stop, retain their original session and can be saved,
exported/imported and reopened after reload. Analysis visibly identifies its frame.
Eight tabs drag independently into five fixed dock sections, preserving the old
initial arrangement. Separate windows share selection and canonical editing through
one renderer lease; closing returns their controls. Project layout saves without
publishing unsaved scene edits. Same-tab credentials survive reload; pagehide
releases the old lease. Dev opens the default browser, with a printed-link fallback.
All 23 CI jobs pass at 03607cdf87bef62732b4bb39c432be97f3e79611 (tree ae36db768f7c484a02966442b01c401cdf94b08c).
158 Node tests, 39 Rust tests and nine new browser criteria pass, including all
prior gameplay and C# development/AOT regressions. Final screenshots reviewed.
See docs/reports/M13_1_CURRENT_REPORT.md and demos/M13_1_GUIDE.md.
PR #16 is ready for review, stacked on unmerged #15; do not merge automatically.
Next: M14 automated game testing.

## Acceptance

| Correction group | Status | Evidence |
| --- | --- | --- |
| Visible analysis | Passed | action count, selected frame, baseline and contributor feedback |
| Retained captures | Passed | Stop/reload, immutable original lease, exact export/import explanation, bounded archives |
| Modular workspace | Passed | actual mouse drag to center and empty right dock, independent tabs, five sections, default reset |
| Separate windows | Passed | real Inspector popup edits canonical entity and updates main Hierarchy; close reattaches |
| Connection and launch | Passed | same-tab reload, explicit release and late-client rejection; platform launcher arguments and failure fallback |
| Demos, regressions, closure | Passed | 23/23 CI, reviewed screenshots, source/report/handoff synchronized |

## Automated evidence

https://github.com/Krozzeo/AxiomEngine/actions/runs/37325146035

Executable commit: `03607cdf87bef62732b4bb39c432be97f3e79611`. Executable tree: `ae36db768f7c484a02966442b01c401cdf94b08c`.
158 Node tests on Windows/Linux and 39 Rust tests pass. Formatting, Clippy,
Wasm release/core checks, 16 schemas, 78 tools, generated C# bindings, architecture
rules and daemon parity pass. Nine new browser criteria include token reload,
repeated analysis feedback, Stop capture retention, JSON roundtrip and reload,
actual tab drag to center, grouped selection, real separate-window editing,
Scene/Game relocation to an empty right section and saved layout/reset. Earlier
M2–M13/correction and C# Windows/Linux development/Linux AOT suites pass.
Final screenshots: docked-profiler, detached-inspector, restored-workspace.
Unexpected browser page/console errors are empty. Local DOM smoke also exercised
all eight tabs and immutable analysis roundtrip. Local JS tests used verified M13
Wasm where Rust was absent; final acceptance uses a fresh CI Rust build.

The browser acceptance preserves authored scenes while retaining captures. Normal
sessions contain at most 120 frames, hard maximum 240, eight captures and bounded
import size/scopes. No physical-device performance claim or new FPS benchmark.
Existing profiler benchmark remains in the full regression gate.

## Desktop check

Only desktop integration cannot be reproduced equivalently in headless CI:
on the user's Windows machine, confirm npm.cmd run dev opens the configured
default browser. Refresh and popup editing are already browser-automated.
Expected result: the authenticated editor opens without copying a URL. If it does
not, return the terminal output and configured browser name. The launcher is
covered for all platform commands, shell-free arguments and failure
fallback; it prints the authenticated link if opening is unavailable.

## Demos and limits

Run npm.cmd ci, npm.cmd run demo, npm.cmd run dev. M13.1 Frame Spike Lab retains
the real C# pulse (1) and arrow movement; 2D Pass Timing contains five editable
sprites. Both support docking and capture workflows. See demos/M13_1_GUIDE.md.
Preserve the full .axiom/projects directory. Generation creates additional copies.

Scene/Game tabs are independently located, but select the engine's one active
interactive viewport; an inactive view displays an activation hint. No second
simulation or concurrent camera renderer is introduced. Popup windows depend on
the main editor; reload closes them and requires explicit reopening. Dock positions
and dimensions persist; top/bottom share the existing height setting. Captures
persist in browser storage for the origin; use JSON export to move or preserve them
when changing port/browser/storage. Saved captures do not enter current live MCP
queries. New daemon instances issue new session tokens.

M13.1: 100%. Whole project: approximately 76%. M14 remains 0%, next task.
