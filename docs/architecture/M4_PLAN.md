# M4 — C# Gameplay Runtime

Status: acceptance passed; final release verification in progress. Source: master specification section 123.
Begin after M3 acceptance closes. The actual runtime and full editor acceptance are documented in M4_CURRENT_REPORT.md.

## Required outcome

A C# script accesses Transform, reads Input, moves an entity, spawns an entity and
logs messages. Editing the script triggers compilation and execution without
restarting the whole editor. Runtime operations must preserve authoring isolation.

## Ordered work

1. Inspect the current .NET browser-Wasm publish spike and establish a measured
   browser integration baseline before selecting runtime packaging/lifecycle.
2. Define the versioned script contract and declarative binding inputs; generate
   the C# SDK/bindings instead of manually duplicating entity/component metadata.
3. Expose capability-scoped compilation with fixed commands, bounded source/output,
   cancellation, diagnostics and project-only paths. Follow SECURITY.md before
   introducing compiler execution; no arbitrary shell or client executable paths.
4. Integrate ScriptRuntime with Wasm engine handles, Transform, Input, spawning
   and causal logs. Test stale handles and ownership across Play/Stop.
5. Define lifecycle hooks and safe development reload boundaries. A failed compile
   retains the last good runtime. Document which changes require resetting Play.
6. Establish the release AOT path foundation separately from development builds;
   record actual startup, output-size and runtime evidence before claiming support.
7. Automate all five script actions and edit/compile/reload in the real browser,
   including error mapping, failure recovery and unchanged authoring data.

## Read first

AXIOM_MASTER_SPEC.md section 123; ADR-0005; SECURITY.md; PROTOCOL_V1.md;
M1_KERNEL.md and ADR-0016; M2_BETA.md; M3_ASSET_PIPELINE.md;
spikes/csharp-wasm/README.md; engine/wasm/host.mjs and lifecycle code.

## Reporting

Define executable acceptance criteria before implementation. M4 weighs 6% of the
roadmap. Do not count the existing publish spike as completed gameplay integration.
Follow MILESTONE_REPORTING.md and deliver only after the complete milestone passes.
