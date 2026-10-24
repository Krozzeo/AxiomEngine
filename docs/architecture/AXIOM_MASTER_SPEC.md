# Axiom Game Engine — maintained master specification

English current edition,2026-10-21. This document is product reference, not a new user request or authorization. The complete original162-section specification and accumulated historical release notes are preserved in [the original-language snapshot](../archive/original-language/docs__architecture__AXIOM_MASTER_SPEC.md.txt). Detailed subsystem contracts, ADRs, schemas and executable tests remain authoritative alongside this edition; no historical acceptance result is promoted to a new implementation claim.

## Vision and priorities

Axiom is an open-source local browser game engine with a local daemon. Humans use a full visual editor; agents use structured semantic operations over the same engine rules. AI should not depend on opaque screenshots/click sequences or giant logs as its main API. The original architectural priority is intelligent agent operation, performance, graphical power, iteration speed, usable manual authoring, web portability, extensibility and future collaboration. Preserve manual usability while designing observable/reproducible/controllable systems.

The initial foundation is a small kernel and correct boundaries, an early runnable beta, AI control, diagnostics, gameplay, performance and incremental expansion. Prefer simple measured replaceable components. Record architectural choices through ADRs, build/test every vertical batch and preserve an executable project. Full CAD/Math/Animation are future Platform products, not implicit Engine features.

## Runtime and authoring architecture

Rust kernel, WebAssembly browser target, WebGPU graphics and WGSL native shaders; Null is a functional testing/fallback profile, never proof of GPU output. C#/.NETWasm is the primary gameplay runtime behind a replaceable ScriptRuntime boundary. Node is the current production daemon; the narrower Rust daemon does not silently replace it. Keep compile/import/asset jobs off the UI thread, bounded memory/messages/work and finite declared capability tiers.

Separate authoring world from runtime world. Play uses a snapshot/compiled runtime; Stop restores authored state. Runtime property editing is transient unless an explicit adoption operation exists. Keep stable identity, typed references, asset ownership and revisions. Persistent projects are portable native documents/resources rather than machine-specific cache paths. Validate complete resulting documents before commit, use atomic persistence and expose stale/conflicting writes without loss.

Specialized editor: Hierarchy/Scene/Game/Inspector/project browser/source IDE/profiler and diagnostics, multiple docked/detached views and clear state. New3D scenes/projects use Cube/Directional Light/configured Camera. Inspector instances live in docks, while Panels→Inspector is one creation action. Scene title/Always active stay left and lock/close right. Compatible drag targets use the same reference validation for preview/drop, with subtle global and stronger hover highlighting. Code buffers remain protected across close/compile; pending unsaved buffers are not falsely saved by a host.

## Semantic commands, agents and changes

UI and agents are clients of common domain operations, not independent file mutation paths. Commands declare identity/actor/scope/capabilities/expected revision/operation identity, validate preconditions, return structured result/evidence and causal diagnostics. Queries are bounded and inspectable. Expose tool/schema/catalog machine-readable documentation, meaningful errors, cancellation and task state. Transport success is not domain success.

AI experiments in isolated proposals/workspaces. Capture base, plan/obtain required human confirmation, execute typed operations, validate, inspect evidence/diff and apply through the product transaction only after human review and freshness checks. Do not accidentally mutate MAIN, lose concurrent authored changes or promote resources partially. Preserve receipts, recovery and journals; unknown external outcomes require reconciliation. Manual and AI proposals use the same review gates. Deterministic autonomy, PMD templates/context/C# game tools and acceptance remain Engine-owned; generic transport/turn/usage/registry/review/journal now come from Platform.

Accounts are session-scoped, credentials outside projects/source/logs. Each project retains its destination, model/limits/confirmation and publication preferences. Connecting an account does not grant publication/Apply/cross-project authority. Saved MAIN is the publication source; explicit review, expected remote head and receipts protect GitHub writes. Never blindly retry ambiguous commits. TestRepo is testing-only, not a demo destination. AI Master remains a later planned capability, not enabled by restructuring.

## Rendering, simulation and assets

Keep actual render results separate from Inspector values. Resource lifetimes/limits/capability errors are observable. The Engine owns render plans, geometry/materials/cameras/lights, asset imports/derived data,2D/3D simulation, audio, animation and replay. Static CAD import is not a parametric CAD kernel. Current physics is CPU/Wasm; GPU rendering is not GPU physics. GPU compute/shader/solver work remains explicitly planned under the roadmap with measured CPU/GPU/Auto selection, consistent queries/callbacks and visible fallback.

Maintain fixed-step/runtime lifecycle and reproducible diagnostics/replay where contracts support it. GPU precision/replay must declare tolerances rather than promise cross-vendor bit identity. C# development/AOT/Windows, native/Wasm and browser/daemon profiles need their actual evidence. Hardware/SDK/service blockers remain visible rather than silently excluded from compatibility metrics.

## Build and product target

The original MVP target is a standalone WebGPU browser game containing only necessary runtime/resources, excluding editor/heavy development diagnostics/metadata/unused assets. Scene compilation should progressively remove authoring data, resolve references, prepare archetypes/static batching/GPU buffers/hierarchy/acceleration structures; not all optimization is required at once. The current Engine does not yet expose a complete game build/export pipeline. Direct editor startup is implemented and is not evidence of standalone game export. M38/M40 retain build/export acceptance; Platform P4's dependent export gate remains open.

The end-to-end sample from original sections 138–139 combines2D/3D gameplay and a human-reviewed AI enemy that follows/takes damage/provides feedback; the agent inspects/edits/compiles/runs/verifies/repairs/measures with retained evidence. Final acceptance requires the complete working sample, representative measured tiers, recovery and reproducible builds, not merely wrappers or an attractive demo.

## Current scope and roadmap

M18.4 is closed only in the user-approved scope, with native real-account acceptance explicitly deferred (ADR0034). Engine now has 45 main milestones,23 historically closed and 22 plannedM19–M40. NewM19 audits the complete frozen Unity 6.3 public runtime/editor inventory; M20–M39 implement/conform and M40 inherits all formerM19 hardening. M39 target is at least95% verified core public signatures and 100% P0, with complete denominator and separate package/platform metrics. These are future targets; current full coverage is unaudited. Historical94%(122/130) is original MVP progress only.

GPU work: M25.0 compute/resource/synchronization foundation; M26.4–26.6 GPU3D; M28.4–28.6 GPU2D; M30.4 shared shaders; M39.4 cross-backend conformance; M40.2 hardware/stability hardening. M19 fixes workloads/hardware/thresholds before prototype evaluation. Nine new batches do not add main milestones. CPU/Wasm remains complete fallback; required GPU scope cannot be satisfied by routing everything to CPU. [Roadmap](ROADMAP_M19_M40.md), [GPU plan](GPU_PHYSICS_AND_SHADERS_PLAN.md).

## Platform ownership and delivery discipline

Axiom Platform has independent P0–P5. Public MIT for both repositories, commercial decision deferred. Platform owns Hub/catalog/settings/local services/accounts/generic AI/review/SDK and proven UI primitives. Engine retains domain/adapter/direct startup/standalone runtime ownership. Publish compatible provider first, pin HTTPS/integrity consumer, test jointly, review PRs and preserve recovery. No format/namespace migration merely for branding.

Use English for development/UI/maintained docs. Historical original sources preserve traceability. Milestones require actual behavior, negative/lifecycle cases, editable demos, current handoff/status/changelog/matrix and exact checks/evidence. Empty wrappers/fake values/compile-only APIs count as partial/pending. Physical GPU, real accounts and models need separate evidence; mocks/Null/historical green runs cannot replace it. Do not force main or rewrite recovery refs. [Current status](IMPLEMENTATION_STATUS.md), [reporting](MILESTONE_REPORTING.md), [handoff](../AI_HANDOFF.md).

## Product integration audit update —2026-10-22

Engine0.0.56/SDK8 with Platform0.1.7 follows the [product contract](PRODUCT_INTEGRATION_0_0_56.md) and [architecture audit](../reports/ARCHITECTURE_AUDIT_0_0_56.md). Account connection belongs only to Platform; project model/reasoning inherits Same as Hub or explicit overrides. Generic prepared releases/storage/diagnostics belong to Platform. Standalone playable game export remains missing and owned by Engine; Platform MVP closure does not certify it. M19–M40 compatibility/shader/GPU scope remains unchanged.
