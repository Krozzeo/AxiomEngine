# Platform P4 — Hub and distribution consumer

2026-10-21. Engine 0.0.53 / scripting SDK 8, Platform 0.1.3 / IPC1, native project format1. Review candidate over P3; no automatic main merge. Public provider149403753092f24a684d0241fe2aa7762abf7bc0 is pinned by HTTPS archive/integrity in package-lock.

## Product changes

Hosted project creation now explicitly asks SceneWorkspace for its existing3D preset, creating Cube, Directional Light and Camera with configured scene/camera state. The prior adapter omitted dimension and therefore created the low-level empty document. New physical3D scenes already use the preset; legacy saved empty scenes remain untouched.

project.rename is an optional advertised capability. Active rename runs inside the command-bus transaction with expected editor revision and idle/dirty/buffer guards. Closed rename uses product storage ownership and persisted revision. The atomic store changes title/revision/save metadata while preserving identity, scene/editor data and extensions. Other hosted lifecycle controls remain protected.

The browser proposal selector consumes the shared stable option primitive from the installed provider; build-editor copies only the necessary UI helper into the editor build. Native startup uses the same installed source. No game schemas or scene classes move to Platform.

## Run and test

Extract the combined ZIP and double-click root Start Axiom.cmd, or run AxiomPlatform/Start-Axiom.cmd with sibling AxiomEngine. Relative paths allow relocation. The launcher prepares Node 24/.NET 10/wasm-tools and locked dependencies, uses the packaged built editor, opens the default browser and leaves error output visible. Source-only builds still require Rust 1.90.

[Full Hub/Settings/P4 guide](https://github.com/Krozzeo/AxiomPlatform/blob/feat/p4-hub-and-distribution/docs/P4_GUIDE.md). Verify one project/session row, seeded editor, Edit title, Save, Cancel/Save-close, remove/re-add without file loss and typed-name deletion only on disposable data. Test Settings account icons/import gate/appearance/storage and compatible installation activation/deferred switch/rollback.

Engine npm run check and Platform check/browserP1–P4 provide automated evidence. Native chooser browser results and remote accounts are controlled fixtures. Fresh-machine dependency download, manual Windows picker and real account/model acceptance remain separately labeled. P4's standalone exported-game gate remains open because Engine currently has no game build/export pipeline; tested direct editor startup is not equivalent. [Report](../reports/PLATFORM_P4_REPORT.md).
