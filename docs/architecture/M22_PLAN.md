# M22 — Lifecycle, time, events and asynchrony

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M20, M21.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete MonoBehaviour messages/order, activation/destruction, pause/focus and physics synchronization, including private Unity messages per contract.
- Extend Time, configurable fixed step, coroutines/waits/timeouts/Invoke/Awaitable/cancellation and required async bridge.
- UnityEvent/delegates ordering/reentrancy, exception propagation, cancellation and cleanup on scene unload/Stop.

## Planned batches

- 22.1 Messages/scheduling.
- 22.2 Coroutines/time/cancellation.
- 22.3 Events/async/cleanup.

## Closure criteria

- [ ] Reference order traces match across render/physics rates and timeScale.
- [ ] Disable/destroy/unload/Stop terminate exactly the relevant work without late callbacks.
- [ ] Errors/cancellation have observable states distinct from success.

## Required editable demo

Lifecycle Timeline Lab: per-frame execution, events and cancelled tasks.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
