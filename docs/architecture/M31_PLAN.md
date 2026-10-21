# M31 — Animation, rigging and Playables

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M22, M23, M30.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Animation/AnimationClip, Animator/controllers/parameters/states/transitions/events/root motion.
- Actual skinning/Avatar/humanoid/retargeting/IK and assigned constraints.
- Playables/graphs/synchronization/blending/lifecycle; Timeline is a versioned M39 package.

## Planned batches

- 31.1 Clips/controllers/events.
- 31.2 Rigging/root motion/humanoid/IK.
- 31.3 Playables/blending.

## Closure criteria

- [ ] Poses/transitions/events match reference results at defined times.
- [ ] Pause/blending/scene change/destruction release graphs/resources.
- [ ] Verify rendered movement/pose and evaluation cost, not parameters alone.

## Required editable demo

Animation & Playables Lab: character, IK, root motion and clip blending.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
