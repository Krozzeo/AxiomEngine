# M13.1 — Workspace and retained profiler demos

Run `npm.cmd ci`, `npm.cmd run demo`, then `npm.cmd run dev`. The authenticated
editor URL opens in the default browser. `npm.cmd run dev -- --no-open` or
`AXIOM_OPEN_BROWSER=0` disables automatic opening. A printed URL remains available
if the desktop launcher is unavailable. Reloading the same tab keeps its token.
Restarting the daemon creates a new token; open its new link. Tokens are never
stored in project documents or capture exports.

Open Demo · M13.1 Frame Spike Lab from Archivo → Proyectos. Profiler is initially
in the bottom section; Hierarchy left, Inspector right and Scene/Game center,
matching the previous default architecture. The top dock starts empty.

## Capture and analysis

Game previews without Play. Start Play, wait for comparable reference frames,
focus the viewport and press 1 once. The real C# controller adds a ~140ms worker
pulse; arrows move its cube. Compilation requires .NET 10/wasm-tools, as before.
Pause collection shortly afterward. Click a frame or enter its sequence, choose
Elapsed and Explain frame spike. A highlighted analysis result identifies the
frame and action count, baseline, increase and observed contributors. Repeated
clicks visibly confirm a new analysis even when the evidence is unchanged.

Stop restores the authored scene but automatically archives the previous capture.
Choose it in the capture selector: its original project/revision/generation remain
visible and are never compared with the new live run. Save capture takes an
immutable snapshot without stopping gameplay. Browser storage keeps the newest
eight captures for this origin, including after reload. Export JSON retains a
portable copy; Import capture validates/reopens it; Delete capture removes the
selected saved copy. Clear history only clears Live. Saved captures are immutable.
Frames remain bounded to 120 per normal session (hard maximum 240).

## Reorganize panels

Click and drag any tab: Hierarchy, Inspector, Project, Structured Console,
Diagnostics, Profiler, Scene or Game. Drop into the left, right, top, bottom or
central section. Empty destinations appear during the drag and the hovered section
is highlighted. Each tab is independent; tabs placed together form a group. Clicking
one displays its panel. Dock selectors also provide a precise alternative.

Scene and Game share the engine's one active interactive viewport. Their tabs may
be docked independently; selecting either moves that viewport into its panel and
selects its camera. An inactive viewport panel says to activate its tab; it does
not show a fabricated second rendering or start another simulation.

Use Separate window for a panel, then move that browser window to another monitor.
Controls keep the same scene, selection and command path. Editing Entity name in
a detached Inspector updates Hierarchy in the main window. Close it or use Return
to editor to reattach it. Browser popup blocking may require allowing the window.
Reload/close of the main editor returns/closes child windows. Windows are reopened
by an explicit click, not automatically after reload.

Dock locations and existing panel sizes save in the project's editor settings,
without publishing unsaved scene changes. Ajustes → Reset panel layout restores
the default arrangement. Preserve the complete `.axiom/projects` directory when
upgrading. Repeated demo generation creates new copies and preserves old projects.

The 2D Pass Timing demo provides five editable sprites and a separate 2D timing
route. It needs no controller. Use it to try docking, selection and captures with
a simpler scene. GPU timestamps remain sampled and capability-dependent; Null
reports unavailable pixels/timestamps honestly.
