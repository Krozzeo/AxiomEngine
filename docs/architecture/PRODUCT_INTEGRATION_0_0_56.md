# Game Engine0.0.56 — product integration contract

Owner-approved architecture audit and integration corrections, 2026-10-22. This is post-M18 integration work, not M19 API acceptance. Platform0.1.7 owns accounts, installation/update discovery, common transport and diagnostics. Engine owns all game-domain state, tools, renderer, simulation and C# SDK. Public MIT and existing document/namespace identities remain unchanged.

## Runtime and ownership

Platform starts one registered product adapter process per open project. Its version is read from `platform/product.json` and checked against the adapter's initialization response; no project edit is required for a new Engine revision. The adapter authorizes a project root, detects schema/application identity, acquires the shared folder lease and starts the Engine daemon. IPC carries explicit product/session/project identity and correlation. It does not grant the browser arbitrary filesystem/process authority. Platform never imports Engine domain types.

The Engine browser is a presentation client of its authenticated loopback daemon. Project commands, revision checks, traces, imports, compilation and proposal transactions remain in the daemon. Rust core/renderer/Wasm supply game primitives; JavaScript authoring/runtime services and the C# host bridge coordinate browser execution. Native Rust daemon parity checks certify only their declared shared endpoints/vectors; they do not assert that every bootstrap service has a native Rust implementation.

The hosted editor shell maintains the per-project editor lease, blocks input on lost sessions and reconnects on reopen. Settings links use a source/origin-checked message to the Platform shell; the product never receives the Hub's authentication token. Direct independent editor startup remains available for manual authoring, but it does not provide its own account connection UI. Direct startup is not standalone game export.

## Account connection versus project configuration

OpenAI and GitHub connect/disconnect only in Platform. Engine HTTP account mutation routes are refused, and the parent broker rejects attempts from product IPC as well. The Engine shows inherited connection status immediately, rather than requiring a second local account test. A model test remains available independently of connection.

An empty project model and reasoning `platform` mean **Same as Hub**. A specified model overrides the Hub model for that project. A specified reasoning effort overrides the inherited effort; an inherited effort unsupported by a different model resolves to provider default. The status response exposes both overrides and effective values. Existing explicit choices are preserved on upgrade; new project defaults inherit. Tasks capture effective model/reasoning and keep immutable request configuration for their lifetime. Account epochs, cancellation, usage accounting and provider stateless request validation remain enforced in Platform.

Task/request/tool/token/time budgets, PMD, instructions, confirmation policy, proposals, human review/Apply, script compiler and MAIN transactions remain Engine-specific. They are not moved into Hub just because both products use AI. Provider transport limits already apply to all requests through the Hub. Project GitHub destinations/branches/history and publication review remain available; game publication is unrelated to publishing the Engine software.

## Distribution and project compatibility

Product identity `axiom.game-engine`, IPC1, Platform API0.1, native format1 and scripting SDK8 remain stable. Package0.0.56 and its descriptor agree. Platform detects published versions using stable GitHub releases with the shared release manifest, not branch names or manually edited project versions. The prepared artifact includes built editor and locked dependencies. Its download hash and descriptor/handshake are checked before activation. Versions install side by side; active sessions defer activation and the previous version remains available for rollback.

Unknown native formats are refused without writes. This revision introduces no migration. Future format changes require explicit reviewed backups/migration acceptance before publication. Recorded last-opened product version is diagnostic metadata, not permission to rewrite a project with an incompatible format. See [Platform release contract](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/PRODUCT_RELEASES.md).

## Next work

M18.4 remains closed under ADR0034's agreed scope, including explicitly deferred native real-account acceptance. M19.1 is still the next API inventory/audit batch; M19–M40 Unity, shaders/compute/GPU physics remains unchanged. Standalone game export is still missing and belongs to Engine build/export planning. Integration tests do not increase Unity coverage. [Architecture audit](../reports/ARCHITECTURE_AUDIT_0_0_56.md), [roadmap](ROADMAP_M19_M40.md).

## Renderer device availability

A preferred adapter is not necessarily a usable device. Engine0.0.56 tries the preferred device, permits rendering without optional timestamps, and then tries an explicitly identified WebGPU fallback adapter before Null. The toolbar/status distinguishes software fallback; this is actual WGSL rendering on a fallback device, not GPU physics or physical hardware acceptance. Both products pin the same immutable shared SDK commit for inheritance and transport.
