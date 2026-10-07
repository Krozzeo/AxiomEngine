# ADR-0031 — Portable authoring files and bounded low-end work

Accepted implementation contract for M16; acceptance evidence is pending.

Persist a bounded virtual authoring tree in the canonical scene document, referencing
immutable asset IDs and source text. This preserves revisioned Undo, reviewed AI
workspaces and atomic save/open instead of adding an unreviewed filesystem side
channel. Explorer views are bounded exports, not an external-edit watcher. The
existing one-source C# runtime remains explicit. Folder/file operations do not
change resource identity or bypass portable path validation.

Use typed app clipboard records with best-effort OS text interoperability. App copies
must work without a browser read-permission dialog. Arbitrary native files or Unity
objects are not accepted. Fundamental entity identity/Transform remain protected;
optional component values pass the canonical validator.

Optimize measured CPU indexing, DOM population and Wasm module compilation while
keeping fresh replay worlds and authored quality. Reuse fixed GPU staging budgets;
wait for submitted GPU work to bound slow-adapter queue growth. Expose explicit
render scale, preserving 100% defaults. Software GPU CI verifies functionality and
bounds; it cannot certify the Tier 0 FPS of an unspecified physical machine.
Retain existing shader/asset caches and Development/AOT contracts unless measurements
justify a separate change. This milestone does not add CAD or autonomous agent loops.
