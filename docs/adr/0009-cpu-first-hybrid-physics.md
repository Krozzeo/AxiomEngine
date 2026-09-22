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

