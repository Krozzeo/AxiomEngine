# ADR-0022 — Bounded HDR Forward+ renderer

Status: implemented; M9 GPU acceptance blocked; see M9_CURRENT_REPORT.md.

Scenes explicitly opt into production rendering by saving `scene.rendering`.
Existing scenes retain their legacy pixel contract. WebGPU and Null share a
DOM-free renderer plan. Rust still owns runtime transforms, clocks and physics;
no browser APIs enter the engine. No external rendering engine is introduced.

The canonical project schema defines PBR materials, lights, mesh LODs and HDR
settings. Public revision-checked commands, human Inspector and isolated AI
proposals use those same values. Optional components support removal and Undo.

The GPU path uses linear rgba16float, GGX/Schlick/Smith metallic-roughness direct
lighting, directional/point/spot lights, an analytic ambient environment, one
primary directional or spot PCF shadow map, exposure and ACES/Reinhard tone
mapping. Display gamma conversion occurs only in the final pass. Base-color PNG
textures use sRGB sampling. Alpha mask and sorted blend have distinct pipelines;
blend disables depth writes. World normals use inverse-transpose cofactors.

Medium/high quality build conservative 16×16 screen-tile light lists in compute
(Forward+), with at most 32/64 lights. Low quality loops over at most eight lights,
disables bloom and uses a 512px shadow map. Other tiers use 1024/2048px shadow maps.
A light crossing the camera plane enters all tiles conservatively. Point shadows
are explicitly unsupported in this foundation; the requested direct light still
renders and Diagnostics explains the fallback. Only the first eligible shadow
light is selected, in stable authored order.

Opaque instances share uploaded geometry and one indirect draw per asset primitive.
CPU and GPU culling test the same homogeneous AABB corners. GPU compute compacts
visible instance IDs and writes indirect arguments; actual asynchronous readback
samples carry their source frame/trace and never claim pixel visibility. CPU bounds
are a reference, not proof of per-entity GPU results. LOD chooses separately authored
imported meshes by camera distance. All LOD meshes require the base primitive count;
geometry, not transforms or physics state, changes. Blend instances sort by distance.

Pipeline cache has eight fixed variants. Upload/bind caches are bounded to active
batches; snapshot changes invalidate geometry bindings, preserving correctness across
asset revisions. Buffers support at most 1024 draw instances and 300000 selected
vertices. Shadows also render off-main-frustum casters. Bloom uses a thresholded
half-resolution 25-tap filter. Edge smoothing is a luminance-threshold five-tap filter.

Foundation limits: no imported HDR cubemap/convolved IBL, normal/occlusion/metallic
textures, cascades, point cubemap shadows, transparent shadows, temporal AA or
occlusion culling. Environment is analytic ambient rather than image-based lighting.
Lighting intensity is engine-relative radiance, not a calibrated photometric unit.
Tier budgets bound work and memory; CI software Vulkan cannot certify physical GPU
frame-rate targets. Planner benchmarks explicitly exclude full-frame/GPU costs.
