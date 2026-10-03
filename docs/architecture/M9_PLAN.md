# M9 — Renderer Production Foundation

Status: not started. Master specification section 128. Roadmap weight: 8%.

Read M8_DIAGNOSTICS_AND_EDITOR.md, ADR-0021, M7_PHYSICS.md, rendering/runtime
contracts and current reports before implementing. Preserve editor/game camera
separation, bounded causal evidence, proposal isolation and stacked unmerged PRs.

1. Define PBR/HDR material and light schemas; implement directional/point/spot
   lights, environment, shadows and tone mapping through one declarative source.
2. Implement forward+/clustered lighting, instancing, CPU/GPU frustum culling,
   LOD, postprocessing and pipeline cache with explicit capability fallbacks.
3. Instrument real renderer decisions so causal queries can explain admission,
   culling and resource failures; never equate submitted draws with visible pixels.
4. Add golden image/performance scenes and reproducible benchmarks covering
   normal WebGPU, constrained capability paths and Null semantics.
5. Include editable demos that visibly exercise new capabilities. Run the complete
   required checks, review screenshots and close the milestone with evidence,
   limitations, completion percentages and only truly manual gates.

Start with schema/renderer contracts and an executable minimal PBR/HDR scene,
then grow the required production foundation without partial user releases.
