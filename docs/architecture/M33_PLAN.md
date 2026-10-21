# M33 — UI, text, layout and events

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M22, M23, M29, M30.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Canvas/RectTransform, assigned uGUI controls/layout/events/navigation/raycasting.
- Assigned UI Toolkit visual tree/styles/binding/focus/panels/controls and editable/selectable text/fonts.
- UI persistence/extensibility/scaling/DPI/accessibility/script use; text packages fixed in M39.

## Planned batches

- 33.1 Canvas/layout/events.
- 33.2 UI Toolkit/data binding.
- 33.3 Text/fonts/accessibility/scaling.

## Closure criteria

- [ ] Public APIs build menu/HUD responding to keyboard/mouse/touch/gamepad.
- [ ] Layout/focus/capture/navigation/destruction verified across resolutions/windows.
- [ ] Editor UI is not evidence of an unimplemented gameplay UI API.

## Required editable demo

UI Application Lab: menu, HUD, inventory and accessible forms.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
