# M16 — canonical file authoring and bounded performance

Implementation and acceptance are complete; see M16_CURRENT_REPORT.md.
Protocol, project-document and scalar Wasm ABI remain v1. Named paths are an
optional backward-compatible scene.projectFiles field, not unrestricted OS access.

## File and clipboard contracts

Project files store kind/path and either immutable assetId or bounded UTF-8 text.
Older scenes derive Assets/Scripts/Scenes and imported source names. Importing new
assets after initialization registers their files. Paths are case-insensitively
unique, portable and relative; traversal, links, Windows aliases and collisions
are rejected. Limits: 512 entries, 64 KiB aggregate source/JSON text, existing
192 KiB canonical project budget. Root folders are permanent. Moves preserve asset
identity; copies reference the same immutable blob. Last-reference deletion refuses
live components/dependencies and attached compiled script source. Blob reclamation
is not performed because bounded Undo may still need it.

project.files.edit commits against scene revision through the normal history,
validation, save/open and reviewed-workspace path. scene.entities.paste remaps
fresh IDs and internal parents; copied cameras/listeners are inactive. Parent-aware
Create and scene.component.paste use the same validated authoring transaction.
Copying entities is limited to 256 entries; all inherited scene/resource budgets
remain enforced. Clipboard data is typed and project-scoped for files/entities.
Existing app copies paste without prompting for browser clipboard permission;
Ctrl+V may read external Axiom JSON only when no internal copy is present. Native
clipboard writes are best effort; ordinary OS file/Unity clipboard formats are not
imported. Copy Path and native text copying clear the app copy. The last active panel retains
keyboard scope when a tree redraw removes its focused node; text editors retain native
keyboard behavior and Project Supr cannot fall through to entity deletion. Invalid types disable contextual Paste.

Project → Show in Explorer writes a MAIN-only isolated export, with literal paths,
no shell and no execution. Up to three 64 MiB exports are retained per project.
It does not grant a directory watcher: external edits are not automatically imported.
Project paths remain virtual/canonical in the JSON document and immutable asset store.

C# filenames/classes use valid identifiers and Game namespace, with empty OnStart,
OnUpdate(double) and OnStop. Compiler Host selects the public Script subclass,
retaining GameScript compatibility. Only the existing one compiled source/runtime
contract is supported; multiple independent compiled scripts remain future work.

## Human editor

Project tree/icon view share selection, inline Rename, confirmed Supr, clipboard and
folder drops in both directions. Creation commits on Enter/blur; Escape cancels.
Hierarchy context Create nests under the clicked entity, Locate frames world pose,
Rename uses inline authoring and Copy includes children. Inspector boxes expose
optional component X/removal and typed Copy/Paste values. Fundamental Transform
cannot be removed; multiple selection keeps its existing grouped editing contract.
Inspector numeric/text edits commit on Enter/focus change; choices/checks commit on
change. Config forms keep their explicit submit contract. Menus use list commands,
exclusive sibling submenus, Save* dirty emphasis and equally sized tab controls.
New templates use mutually exclusive 2D/3D/Empty radio choices. Project title is in
the menubar. Game Debug shows measured loop FPS during Play and hides on Stop.

## Performance scope and defaults

Tier 0 retains Null/CPU fallback and explicit Low quality. Render scale 0.5/0.75/1
changes backing targets in primary and parallel views; 1 stays the default.
No automatic reduction of authored lighting/materials/animation/replay occurs.
Low/high feature budgets retain M9 limits. Actual software GPU regressions are gates;
physical hardware FPS is not inferred from them.

Hierarchy parent indexing removes repeated whole-list filtering. More than 150
rows use a visible DOM window plus overscan; the full canonical scene remains the
source for selection, parenting and commands. The Wasm module cache is keyed by the
actual bytes object; every load instantiates a fresh world and memory. World
allocation/compilation remains bounded and measured, not shared across replay.
Asset instance admission uses a one-pass count map; resource/build identity caching,
shared mesh vertices and existing pipeline caches remain in place. Production GPU
staging arrays reuse 253,952 bytes at the existing 1024-instance/64-light limits.
One completed submission precedes the next frame, bounding queue growth on slow
adapters and ensuring controlled pixel assertions observe completed work. Device
loss still owns the existing Null fallback. renderScale changes rebuild target-sized
GPU resources; unchanged settings preserve them.

`npm run benchmark:m16` records environment, 40-sample median/p95/min/max, legacy
versus indexed Hierarchy equivalence, Wasm byte instantiation versus cached module
with a fresh world, actual scene compile/null mesh counts and Wasm memory at
128/256/1024 instances. Process memory is reported when the host supports it.
These CPU measurements are not total editor RAM peaks or physical low-end FPS.
Shader caches and C# Development/AOT regressions are retained; no unmeasured shader
or compiler speedup is claimed. See ADR-0031 for the scope and portability choice.

Controlled GameTest steps advance every requested CPU frame and present exact
assertion boundaries. Replay advances every input/checkpoint and presents first,
every fifteenth, diagnostic-range and final boundary frames. Requested pixels are
retained before yielding the WebGPU drawing buffer. These private presentation
options do not drop simulation inputs or change the public fixed-step contract.
Live Frame Diagnostics publishes with a bounded time cadence for slow adapters.

Repeated editor redraws that reaffirm the same view preserve held Game keys. Actual
view switches and window blur release input; CI M4 explicitly reselects Game while
ArrowRight remains held and checks movement, spawn, compile/reload and saved reopen.
