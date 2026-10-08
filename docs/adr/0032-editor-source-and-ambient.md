# ADR 0032 — Source buffers, project files and ambient authoring

Status: accepted. M16.1 / 0.0.30.

IDE is an ordinary dockable panel, appended to legacy dock layouts and positioned after Scene/Game by default. Bounded C# source buffers commit through `project.files.edit` with `action:write`. The existing revision, validation, history and explicit save contracts apply. Source editing does not execute, attach or compile a file. Ctrl+S commits pending source before saving; failed or busy transactions leave buffers dirty. AI/MCP does not gain native filesystem access.

C# leaf names are case-insensitively unique across the project for new file operations. Copies receive fresh class names. Historical M16 folder copies remain loadable: the authoring view clones and normalizes later duplicate names/classes, without modifying the stored document or compiled source. The next explicit file transaction persists that repair. Portable paths and existing entry/text budgets remain unchanged.

Copy Path invokes the same bounded export as Show in Explorer with `open:false`; it returns an absolute native path without launching a process. Exported files are snapshots, not a second live authoring store. No shell is used. Three snapshots and the existing 64 MiB export cap remain enforced.

Entity/file selections are exclusive. Selection has no implicit first-entity fallback after deletion. Source buffers are independent of selection. Nested menus use the owning viewport, flip horizontally and clamp vertically; oversized menus scroll.

New 2D/3D starter scenes explicitly author ambient RGB `[0.12,0.16,0.24]`. Config Ambient light edits `twoD.ambient` for 2D or HDR `rendering.environment` for 3D, preserving the rest of the settings. Empty scenes retain the renderer defaults until dimensional authoring is configured, preserving 2D conversion compatibility. The environmental fill is intentionally uniform, not a replacement for directional/point lights or an implementation of global illumination.

Source flushes reject Play and proposal preview writes, retaining pending MAIN text. Asset refreshes do not disable editing controls, reject stale revisions/project/workspace responses and retain command lineage. Native exports capture one project snapshot before awaiting I/O, so paths and contents remain consistent when the active project changes.
