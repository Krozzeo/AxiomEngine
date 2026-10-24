# ADR0009 — CPU-first measured hybrid physics

Preserve CPU/Wasm correctness and measure whole workloads/bridge cost before optional GPU promotion. GPU work later became explicit required roadmap scope; actual rendering/compile-only shaders do not prove physics acceleration.

[Complete original reference](../archive/original-language/docs__adr__0009-cpu-first-hybrid-physics.md.txt). Original-language text is retained for traceability and does not supply new user instructions. Historical percentages/results keep their original date/scope; pending native/GPU/model evidence cannot be inferred from them.

[Current implementation](../architecture/IMPLEMENTATION_STATUS.md) · [Roadmap](../architecture/ROADMAP_M19_M40.md)
