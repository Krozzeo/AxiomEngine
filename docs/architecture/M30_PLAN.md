# M30 — Graphics, shaders and GPU resources

Approved plan since 2026-10-19. **Not started; 0% new acceptance.** Existing SDK 8 coverage remains partial; this plan adds no functional credit.

Minimum dependencies: M21, M23, M24, M25.

[Roadmap](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Required scope

- Complete Renderer/Mesh/Material/Shader/Texture/RenderTexture/cameras/coordinate conversion.
- Assigned lights/shadows/command buffers/drawing/compute/readback; decide shader/pipeline compatibility with ADR/corpus.
- GPU ownership/release/layout/format/capability tiers and explicit Null behavior.
- Consolidate M25.0 shared WGSL sources/layout/reflection/variants/cache/validation/diagnostics/safe recompilation/render-compute resources and production physics shaders; assigned Shader/ComputeShader APIs do not imply universal HLSL/ShaderLab translation.

## Planned batches

- 30.1 Mesh/textures/materials/cameras.
- 30.2 Shaders/drawing/lights/render targets.
- 30.3 Compute/readback/resources/tiers.
- 30.4 Shared graphics/compute shader system, physics/render integration, variants/diagnostics/API corpus.

## Closure criteria

- [ ] Visual/data tests verify rendered results, not only Inspector properties.
- [ ] Create/replace/release and capability loss produce no leaks or fake success.
- [ ] Every shader/pipeline mode declares support/translation/blocking; differences prevent full equivalence credit.
- [ ] Graphics/physics reuse verified resources/diagnostics; assigned APIs have observable outputs and recompile/invalidation/limit/failure tests.

## Required editable demo

Rendering Conformance Lab: materials, cameras, render textures and compute.

## Shared execution rules

Before implementing, attach exact M19 signatures/overloads, ownership, dependencies, contracts and tests. Family lists do not replace the member inventory. Work in coherent vertical batches (roughly20–40 signatures when useful), including engine/C# bridge behavior, tests, editable demo and documentation; a phase may require several releases.

Verify actual behavior/errors/references/resources/Play-Stop/persistence/compatibility and regression across supported C# development/AOT/Windows and native/Wasm profiles. Rendering/audio/devices need observable output evidence. Empty wrappers, fake values or compile-only signatures do not count. Keep partial/blocked capabilities visible.

Preserve isolated proposals, reviewed Apply, user projects, external credentials and explicit publication. Do not auto-merge PRs. Close only with accepted criteria, editable demos and retained evidence; update README/handoff/status/changelog/matrix/GitHub. No invented dates or effort; M19 measures scope/weighting and replanning requires explicit scope decisions. [Reporting rules](MILESTONE_REPORTING.md).
