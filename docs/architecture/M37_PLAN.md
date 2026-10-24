# M37 — Platforms, native APIs and specialized devices

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M19, M22, M24, M29, M30, M32.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Application/SystemInfo/Screen/Cursor/paths/files/windows/display/application lifecycle by backend.
- Native adapters for browser-unavailable capabilities; sensors/camera/microphone/XR/mobile/specialized inventoried platforms.
- SDK/hardware/permissions matrix and per-platform evidence; consoles/external services retain explicit dependencies.

## Planned batches

- 37.1 Platform contracts/native backend.
- 37.2 Devices/mobile/XR.
- 37.3 Capability matrix/verification.

## Closure criteria

- [ ] Actual system values/operations, not hints/defaults as completed capability.
- [ ] Each target has backend/hardware evidence; emulators do not certify physical devices.
- [ ] Missing SDK/service/hardware is blocked, not complete or silently excluded.

## Required editable demo

Platform Capability Lab: real file/window/available-device operations.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
