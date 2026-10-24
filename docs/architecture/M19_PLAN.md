# M19 — Complete audit and compatibility contract

Implemented in the0.0.57 review candidate. **4/4 audit acceptance criteria passed locally.** SDK8 remains partial; M19 adds no Unity implementation or GPU-solver credit. [Evidence and limitations](../reports/M19_REPORT.md), [frozen baseline](../compatibility/README.md).

Minimum dependencies: M18.3.10.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Freeze Unity 6.3 LTS (6000.3), snapshot/hash; inventory namespaces, types, members, overloads, inheritance, obsolete APIs, platforms and modules. Keep versioned packages and the6.6 delta separate.
- Map every signature against SDK/engine, resolve ambiguous name matches and classify compatible, partial, pending, blocked or explicitly out of scope.
- Define code/behavior compatibility, P0/P1/P2 priorities, numeric precision, namespaces, budgets and browser/daemon/native profiles; design conformance harness and script corpus.
- Define CPU/GPU hardware, precision/replay, synchronous query/callback contracts; freeze workloads, duration and performance/stability thresholds before prototype evaluation.

## Planned batches

- 19.1 Reproducible inventory and member ownership.
- 19.2 SDK/engine mapping, priorities and dependencies.
- 19.3 Harness, reference cases, metrics and relative effort, including CPU/GPU synchronization/shader/performance contracts.

## Closure criteria

- [x] Every snapshot record has stable identity, provenance and assignment; do not omit unimplemented members.
- [x] Separate declared surface, proven behavior, platform restrictions and packages; partial types do not complete all members.
- [x] Harness covers positive, negative and lifecycle cases; publish first measured coverage and revised roadmap weighting.
- [x] Publish CPU/GPU profiles, accelerated/fallback/blocked matrix and reproducible thresholds; rendering, Null and compile-only shaders do not prove GPU physics.

## Required editable demo

Compatibility Observatory: inventory browser and executable object/time/physics/resource corpus; harness is not implementation of pending APIs.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
