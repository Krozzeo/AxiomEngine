# M14 — Automated game testing and editor workspace

Version 0.0.27. Status: implementation under acceptance; not a completed release.

Implemented public bounded test controls, fixed frame stepping/synthetic input,
runtime/collision/animation/pixel assertions, human saved suites and three editable
demos. Editor changes include parallel Scene/Game, ordered/closed dock panels,
compact controls, File/Create/Panels/Config/Help, quick examples and confirmed dirty
save icon/Ctrl+S. See M14_GAME_TESTING.md and ADR-0028 for limits and ownership.

Local acceptance: 160 Node tests pass using verified M13.1 Rust/Wasm runtime bytes
(the Rust implementation is unchanged). Six build/server-fixture tests require a
fresh Cargo build and are exercised by CI. Schema/architecture checks pass. Browser
acceptance and the complete 24-job CI matrix are pending; no completion claim yet.

No user-only test is currently requested. Project progress remains 76% (79/104)
until M14 acceptance closes. M15 replay is not started.
