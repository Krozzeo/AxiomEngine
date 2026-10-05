# ADR-0027 — Modular editor and retained profiler captures

Status: Accepted, M13.1.

Five dock sections keep eight independently movable tabs and the previous default
arrangement. Dependent same-origin windows adopt existing controls rather than
starting duplicate editors. A document facade resolves controls in those windows.
Scene/Game select one active interactive viewport. Canonical project.editor.update
persists placement without publishing unsaved authoring or invalidating runtime.

Profiler histories archive as bounded immutable captures at reset. Historical
readers retain their own project/revision/generation and cannot satisfy live
semantic requests. Origin storage and validated JSON roundtrip preserve analysis.
Per-tab credential storage enables reload. Authenticated pagehide release frees
the old renderer lease and bounded tombstones reject late reports. Platform URL
launchers use no shell and keep a printed fallback.

Consequences: window lifetime depends on the main editor, popup policy remains a
browser choice, top/bottom share height, and simultaneous camera rendering is a
future feature. See M13_1_EDITOR_WORKSPACE.md and M13_1_CURRENT_REPORT.md.
