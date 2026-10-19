# ADR-0009: CPU-first measured hybrid physics

## Context
GPU compute is attractive for large batches but creates latency, readback and determinism costs.

## Decision
Build a deterministic CPU/Wasm baseline first. Promote workloads to GPU only when tier-specific benchmarks show a benefit while preserving explainability.

## Alternatives
GPU-mandatory physics and external physics engines were rejected.

## Consequences
Backend selection emits reason codes and remains queryable per workload.

## Status
Accepted.


## Ampliación de alcance — 2026-10-19

[ADR-0033](0033-gpu-physics-and-shader-roadmap.md) convierte la promoción medida a GPU en subtandas requeridas del roadmap. Conserva la alternativa CPU/Wasm y el rechazo de GPU obligatoria. El backend GPU sigue planificado, sin implementación ni aceptación atribuida a esta decisión.
