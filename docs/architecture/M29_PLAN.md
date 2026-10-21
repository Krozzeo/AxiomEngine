# M29 — Input and devices

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M20, M22.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Input/KeyCode/Touch, mouse/keyboard/gamepad state/profiles/deadzones/hotplug.
- Sensors/pen/haptics/orientation/device APIs with identified backends/hardware.
- Interactive rebinding/persistence and primary/detached Game focus; Input System is a separate M39 package.

## Planned batches

- 29.1 State/profiles.
- 29.2 Devices/sensors/haptics.
- 29.3 Rebinding/focus.

## Closure criteria

- [ ] Deterministic edge/held/hotplug/focus-loss tests.
- [ ] Device capabilities count only with real backend/device evidence; label emulation.
- [ ] Primary/detached windows work without duplicate actions.

## Required editable demo

Device & Rebinding Lab: profiles, hotplug and persistent rebinding.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
