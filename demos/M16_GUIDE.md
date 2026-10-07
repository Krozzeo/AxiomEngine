# M16 demos — Editor authoring and low-end rendering

Run from the release folder in PowerShell:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

Generation preserves existing projects. File → Projects → Refresh list, select a
project and Open. These demos need Rust/Wasm for the normal build; creating or
inspecting the empty C# source does not need .NET. Compiling it needs .NET 10 and
wasm-tools. Play and Game remain separate controls.

## Editor & File Workshop

Three lit primitives (cube, sphere, capsule), an editable Camera and a Directional
Light appear. Config → HDR Rendering explicitly sets Environment RGB to
0.12, 0.16, 0.24. This fills unlit faces: no hidden global sun was added. A new 3D
starter deliberately uses Environment RGB = 0 and therefore has black unlit faces.
Increase this explicit environment or create an additional light if you want fill.

In Project, inspect the folder tree and icon area. Scripts/Gameplay contains an
empty WorkshopController.cs; Assets/Examples contains Settings.json. Right-click
an empty icon area to create a folder or script; type its name and Enter, or leave
the field to commit. Escape cancels. A renamed script updates its C# class name.
Create → C# Script prompts for a name and uses the directory currently open here.
Scripts expose empty OnStart, OnUpdate and OnStop methods; there is no Unity API.

Drag a file or folder into another folder in either view, or onto Project/the
current icon-area background to move it out. A second slow click on a selected
item begins Rename. Ctrl+C/Ctrl+V copy files in Project; Supr asks for confirmation.
The fixed Assets/Scripts/Scenes root folders cannot be removed. Assets still used
by components or dependent assets must be detached before deleting their last file.
Copying an asset file creates another reference to its immutable data, not a new
editable geometry source. Show in Explorer exports the current authoring draft;
editing that export does not automatically import changes. Copy Path gives its
portable Project-relative path. Save/Undo/Redo apply to canonical file operations.

In Hierarchy, right-click an entity for Rename, Locate, Copy or Eliminate. Create
there places the new entity under the clicked parent. Ctrl+C/Ctrl+V duplicate selected
entities including children and remap parent IDs. Locate frames the world position
in Scene. In Inspector, boxes delimit components; X removes an optional component.
Transform is fundamental and cannot be removed. Right-click a component to Copy,
Paste values into the same component type or Remove. Paste in the Inspector adds a
copied missing component to the selected entity. Values apply on Enter/focus change;
checkboxes and choices apply immediately. Save* in File and the save icon indicate
unsaved changes. Ctrl+S saves the project.

## Low-End Instance Grid

256 cubes share one mesh asset. Scroll Hierarchy to the last cube: only its visible
row window is mounted. Selection and the Inspector still use the full scene.
The authored settings are Low quality, CPU culling, 50% render scale, no bloom and
no shadows. Game uses the camera at [0, 10, 36] without starting simulation.

Press Play and enable Debug beside Play/Stop. Actual presented-loop FPS appears at
the upper-right of Game and hides on Stop. Config → HDR Rendering → Render scale
can switch 50%, 75%, 100%; this intentionally changes backing resolution. Higher
quality modes and 100% remain available. These cubes do not fall: this is an
instance/render/editor stress scene, not another physics playground.

Profiler and Diagnostics expose frame/render/asset data. FPS and software-GPU CI
are measurements of their environment, not a promised frame rate on your computer.
See docs/reports/M16_CURRENT_REPORT.md for reproducible CPU/Wasm measurements and
known limits. Run `npm.cmd run benchmark:m16` after building for your own CPU data.
