# M36 — Networking, HTTP and multiplayer

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M22, M23, M24.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete UnityWebRequest/handlers/uploads/forms/streaming/progress/errors/cancellation per platform.
- WebSockets and real interprocess transports, protocol/ownership/authority/RPC/replication/reconnect for chosen multiplayer profile.
- Separate Netcode/Transport package versions; explicit CORS/cookie/socket backend contracts.

## Planned batches

- 36.1 HTTP/handlers/errors.
- 36.2 Transports/sessions.
- 36.3 Replication/authority/network failures.

## Closure criteria

- [ ] Separate-server tests verify data/cancel/errors; HTTP is not multiplayer.
- [ ] Two clients and server exchange actual game state under controlled latency/loss/reconnection.
- [ ] Preserve credentials/authority; browser-unavailable capabilities need real backends or visible blockers.

## Required editable demo

Network Arena Lab: two clients, server and reproducible network conditions.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
