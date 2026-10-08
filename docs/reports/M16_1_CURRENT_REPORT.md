# M16.1 — Editor corrections and ambient light

Version 0.0.30. Complete: 9/9 required correction groups, 100%. Project approximately 88% (91/104), unchanged because these are corrections to existing capabilities. M17 has not started.

## Outcome

Project files and entities now share exclusive selection. Deleting an entity leaves nothing selected. Escape and blank clicks clear selection. Renames update the Inspector and open IDE buffer. Source editing uses canonical revision/Undo/save transactions; failed or busy writes preserve pending text. Ctrl+S commits the source buffer before saving the project. File context Open and double-click focus the dockable IDE after Scene/Game.

Menus share item geometry, Undo/Redo sit at the bottom of File, and Create project remains a distinct form button. AI labels determine menu width; prose panes wrap. Cascading panes clamp/flip against the owning viewport. Project has parent navigation, drag target highlighting, empty-folder deletion without a dialog, names that remain editable on collision, globally unique C# names and native absolute Copy Path exports. Close icons match Separate; Inspector Close is smaller. Debug is round and aligned. The project title is gray, bold and starred when dirty.

2D/3D starters explicitly store ambient RGB `[0.12,0.16,0.24]`. Config Ambient light edits the appropriate canonical scene settings and preserves unrelated rendering options. Empty scenes inherit renderer fill until dimensional authoring is configured. Asset refresh runs without disabling controls and rejects stale responses.

## Acceptance

| Required group | Result |
| --- | --- |
| File/Panels alignment, bottom Undo/Redo, form Create button | Passed |
| Long AI labels, exclusive branches and viewport-safe cascading menus | Passed |
| Dirty title/Save, matching icons and aligned round Debug | Passed |
| Project parent navigation and drag target highlighting | Passed |
| Name/move collisions, global C# names, inline errors and native paths | Passed |
| Empty/nonempty deletion, context Delete and rename targeting | Passed |
| Exclusive selection, Escape/blank clicks and no deletion fallback | Passed |
| Dockable IDE, source editing/history, Ctrl+S and rename synchronization | Passed |
| Config ambient fill, starter persistence, editable demos and documentation | Passed |

## Automated evidence

CI 179: all 27 jobs pass. Run: https://github.com/Krozzeo/AxiomEngine/actions/runs/37673493328.
Executable commit `0b064c85105c443132c2a06d7a83d5c0458905f8`, tree `90a815d569076970bccfffff5e90d3c9ff46c75d`. The closure changes documentation/evidence only; tested application code is unchanged.
199 Node tests, 39 Rust tests, 18 schemas and 86 semantic tools pass. M16.1 has 16 browser criteria, zero page/console errors. Prior M2–M16 browser gates, correction gates and C# Development/AOT Linux/Windows gates remain green. Five runners timed out installing Ubuntu dependencies and passed on the focused retry of the same commit.
Local 193 non-server Node tests also passed; six clean-build server tests, Rust and browser rendering were verified through CI. The final browser screenshot was reviewed.
Raw browser evidence: m16-1-browser-evidence.json. Contract: ../adr/0032-editor-source-and-ambient.md.

## Manual tests requested

None. The requested workflows have equivalent automated evidence. The demo guide is optional exploration, not a required manual gate.

## Limitations

IDE provides source editing, line numbers, search and indentation; it does not claim full IDE language services. Editing/saving does not automatically compile or attach a script. Compile remains a deliberate Script operation. Native paths refer to bounded exports, not live watched files. Historical copied C# names normalize in the authoring view and persist on the next explicit file transaction, preserving the stored document until that action. Ambient fill is uniform environmental light, not baked or ray-traced global illumination. Physical GPU performance is not inferred from software-GPU acceptance.

## Demos and delivery

`npm.cmd ci`, `npm.cmd run demo`, `npm.cmd run dev`. Open either **Demo · M16.1 3D Editor & Ambient Lab** or **2D Editor & Ambient Lab** from Saved projects. See demos/M16_1_GUIDE.md for expected visuals and editing actions. Preserve the complete `.axiom` folder when moving user projects between source snapshots. The immutable GitHub archive contains the full tracked source/documentation; dependencies and build outputs regenerate normally. PR #20 is ready/open/unmerged, stacked on #19. Next: M17 Advanced Assets/CAD.
