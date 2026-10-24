# M20 — Compatible objects, components and hierarchies

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M19.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Object, GameObject, Component, Behaviour and Transform: searches, tags/layers, activation, parenting, cloning, destruction and assigned overloads.
- Resolve destroyed-object equality/null, identity, component order, references and lifetime; UnityEngine code compatibility preserves Axiom.Gameplay.
- Correct transforms, spaces, conventions and numeric types according to M19.

## Planned batches

- 20.1 Identity/null/create/destroy.
- 20.2 Component queries and graph cloning.
- 20.3 Transforms, namespaces and migration corpus.

## Closure criteria

- [ ] Corpus scripts use assigned Unity signatures without hidden adaptations.
- [ ] Hierarchy/references/deferred destruction/activation match reference behavior without leaks.
- [ ] Stop, Undo and existing projects retain contracts; assigned members have tests or explicit closure-blocking dependencies.

## Required editable demo

Object Lifecycle Lab: hierarchies, destroyed references, clones and activation changes.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
