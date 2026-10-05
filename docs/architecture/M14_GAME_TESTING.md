# M14 — Automated game testing

Version 0.0.27. Execution acceptance is recorded in `docs/reports/M14_CURRENT_REPORT.md`.

## Public contract

`gameTest.control` is a public HTTP/MCP tool scoped by project ID, exact scene
revision and optional proposal workspace ID. Actions are `run`, `begin`, `step`,
`finish`, `cancel` and `query`. Run/begin require a suite; step requires a block.
A receipt returns immediately, so callers poll query and can cancel running work.
Only one isolated test session and one pending bridge request are allowed.
A live editor owns the renderer lease. Tests require a stopped, open project.
No test command writes authored scene data or enters daemon Play.

The canonical schema is `protocol/schema/game-test.schema.json`. A suite has a
name and 1–12 blocks. Blocks specify 0–120 exact frames, input key codes and
assertions. Session totals are 600 frames and 48 assertions. Each active execution
has a 30-second wall-time budget; human waiting in a paused session does not consume
its next step budget. Input is cleared after every block/frame and every exit.
Assertions cover entity count, position, quaternion rotation, current collision /
trigger pairs, animator state and screenshot RGBA pixel samples with tolerance.
Unknown keys, missing targets, nonfinite values and invalid revisions fail explicitly.

`engine/testing/session.mjs` owns validation, bounded scheduling and assertion
comparison; it has no DOM/rendering/gameplay dependency. The current browser frame
adapter owns one Rust/Wasm kernel, one C# worker and one frame pump. Test execution
pauses ordinary RAF simulation, reinitializes a separate runtime from a clone of the
current authored snapshot, applies synthetic input and delta 1/60, then restores
that snapshot on completion/failure/cancel. External revision changes abort the old
session and never restore an obsolete snapshot over the new project.

Determinism covers fixed-step CPU/Wasm simulation and explicit input for a given
scene, resource version and script. GPU pixels, audio/hardware clocks, arbitrary C#
wall-clock/random/network behavior are outside that guarantee. Audio output is
suppressed during automated tests. Null cannot provide screenshot pixels and
returns a failed assertion with an unavailable reason, never fabricated evidence.
Visual assertions sample the real Game camera at 960×540; they are tolerance-based,
not cross-driver pixel-perfect image baselines. No replay implementation is added.

## Human controls and persistence

Config → Game Tests exposes saved suites, bounded JSON editing/import/export,
Run, Begin paused, Step plan first block, Finish and Cancel. Results identify exact
frames, actual/expected values and unavailable evidence. Up to eight suites persist
in project editor settings through the existing public project API. Scene Save is
still explicit; editor preferences/suites do not silently save unsaved scene edits.

## Editor workspace

Project is the first bottom tab by default. Each tab drags between the five fixed
sections or before/after another tab in its section. Dropping on itself does
nothing. Order and closed panels persist per project. Each active header includes
compact position selection, separate-window icon and close X, aligned right.
Panels reopens closed tabs. Reset restores the default sections/order.

Scene and Game can now render simultaneously. A secondary target has its own
camera, surface and renderer resources but reads the same simulation state. It
owns no second kernel, worker, audio clock or RAF. Popup Game keyboard input is
forwarded with an explicit view tag, and close returns the real panel/handlers.
Profiler main CPU includes this secondary submission; existing GPU timestamps
measure the primary viewport only. This supersedes M13.1's single visible viewport.

Menus are File, Create, Panels, Config, Help. File contains Save/Undo/Redo;
Create contains primitives and supported modular examples. Empty entity, point /
directional lights, imported-WAV audio source/listener, UI panel/button, 2D light
and particles use canonical scene commands and one atomic undo entry. Context or
asset requirements fail explicitly. Video playback and entity-camera components
are labelled planned; the existing scene Game-camera settings remain functional.
Help shows package version, runtime/protocol/license and documentation links.

A save icon before File mirrors canonical dirty state. The asterisk remains until
server-confirmed Save; failures retain it. Ctrl+S also works in editable fields.
