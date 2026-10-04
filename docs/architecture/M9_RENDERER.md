# M9 — Renderer Production Foundation

Version 0.0.19. GPU, Inspector, demo and Null acceptance pass in real Chromium
software WebGPU. Full 17-job cross-platform CI passes; read M9_CURRENT_REPORT.md.
See ADR-0022 for the precise bounded
rendering contract and explicit unsupported capabilities.

`engine/renderer` owns renderer math, planning and native WGSL/WebGPU resources.
The browser adapter owns canvas, device acquisition and PNG decoding. Production
scenes are opt-in, so M0–M8 persisted golden images keep their existing shader.

Canonical commands: `scene.material.set`, `scene.light.set`, `scene.lod.set`,
`scene.rendering.update`, plus optional-component removal. Each uses the shared
project schema, expected scene revision, bounded validation and existing Undo.
These commands are permitted in isolated AI proposals and do not bypass acceptance.

The Inspector exposes editable material, light, LOD and HDR controls. Diagnostics
shows actual tier fallbacks, batch/resource counts, CPU admission references,
selected LODs and sampled GPU indirect results with frame/trace. `AX_CAUSAL_0140`
adds renderer decision references to the existing whyNotRendered graph. Admitted
or submitted instances do not establish visible pixels.

Automated acceptance lives in `tests/renderer-production.test.mjs` and
`tests/browser/m9.mjs`. CPU and compute-culling golden images must match; disabling
light/shadow/bloom and changing tone mapping must produce measured pixel effects.
The editable gallery and instancing/LOD lab also exercise Inspector Undo, constrained
quality, real GPU readback, bounded resources and Null semantics. Existing milestone
browser jobs remain required. `scripts/benchmarks/renderer.mjs` enforces planner
p95 budgets for 128/512/1024 instances and one shared opaque batch.

No physical GPU benchmark is claimed from CI's software Vulkan adapter.

Existing legacy projects enable this path by applying HDR Rendering in Inspector.
The M9 demos already contain those settings. Base material and light edits alone
do not switch a legacy scene to HDR, preserving its existing image contract.
