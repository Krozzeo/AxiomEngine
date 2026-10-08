# M18 demos — 0.0.32

Run `npm.cmd run demo:m18`, then `npm.cmd run dev`. Existing saved projects remain.
Choose a **Demo · M18** project in File → Projects Create / Open. C# demos require
.NET 10 SDK and wasm-tools; the editor reports actual compiler diagnostics.

## Script Component Lab

Opening compiles its physical C# files automatically. Select Cube in Hierarchy:
InspectorMover has Speed, Direction, Mode and Enabled plus readonly Frames.
Use the arrow to fold a component; drag the Speed label horizontally, or edit
its value. Select nothing or a Project file: Transform/Add Component disappear.
Play opens Game. Change Speed to 0 during Play: movement stops and Frames continues.
This change belongs to the running world; Stop opens Scene and restores authored
values. Other attached component values and Transform can also be edited live.
Structural edits still require Stop.

Open InspectorMover.cs via its Inspector link or Project double-click. IDE remains
editable during Play. Ctrl+S saves the current file; Save All saves open buffers.
With Auto unchecked, the old compiled code keeps running after a source save.
Compile*/Ctrl+D compiles and replaces the running script world on success;
this is a restart with the new build, not state-preserving hot reload. Failed
compilation keeps the last good runtime; Error shows diagnostics in IDE. Editing
again enables Compile*. Auto compiles after saved C# changes, not every keystroke.
Unsaved buffers in other tabs are preserved by automatic compilation. Play compiles
pending sources first. The title's ● is a project marker, not the connection state.

## Autonomy Position Repair

The target starts at X=0; its saved objective requires X=2. Open AI → AI proposal,
find Autonomy loop and click Run objective. The first acceptance test fails; the
bounded position repair fixes the error in an isolated proposal, then retests and
runs two fresh-world measurements. The timeline retains the failed attempt.
At completed/ready-for-review, MAIN still has X=0. Select the resulting proposal,
Review differences, then Accept reviewed changes to publish it. Save is explicit;
Undo reverses the publication. Export evidence downloads all attempt receipts.

## Autonomy Compiler Repair

RepairMover.cs intentionally lacks a semicolon. Opening reports Error; this is
expected. Run its saved objective through the same Autonomy loop. The first
compiler attempt fails; the supplied exact source patch repairs that single line.
The next compilation and 30-frame movement assertion pass, followed by two fresh
runs. MAIN still contains the original file until human-reviewed publication.

The included policies repair position discrepancies or explicit exact source
patches. Arbitrary natural-language problem solving requires an external AI client
providing a structured plan through the semantic API; these demos do not silently
connect a paid model. Cancel/time/iteration/command limits preserve MAIN and retain
an unverified proposal/evidence. Benchmark values are measured bridge + fixed-step
execution + presentation wall time, not a physical-GPU performance guarantee.
