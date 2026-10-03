# M7 — Physics Foundation

Status: complete; see ../reports/M7_CURRENT_REPORT.md. Master specification section 126. Weight: 7%.

Implement owned 2D/3D physics, CPU/Wasm first, per ADR-0009. Read the master
specification, schema contracts, Wasm ABI and M6_WORKSPACES.md before editing.

1. Define bounded collider/rigid-body schemas, fixed-step world state, collision
   layers and deterministic test mode; record solver choices in an ADR.
2. Implement broad/narrow phases, gravity, impulses, triggers and raycasts.
3. Integrate authoring, isolated Play, C# bindings and scoped proposal operations.
4. Build stable, reproducible golden physics scenes and measure representative
   workloads. Move work to GPU only when benchmarks justify it.
5. Automate native/Wasm parity, editor workflows, persistence and diagnostics;
   update milestone report and handoff with evidence and limitations.

Do not merge the stacked milestone PRs or reinterpret CI success as integration.
