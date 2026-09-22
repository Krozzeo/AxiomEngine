# ADR-0012: Bounded semantic observability

## Context
Causal diagnostics are foundational but unbounded tracing can become the performance problem.

## Decision
Normal mode uses counters, compact reason codes and bounded buffers. Diagnostic and Deep Trace modes are scoped and temporary. All buffers expose drops/backpressure.

## Alternatives
Global detailed tracing and text-only logging were rejected.

## Consequences
Every instrumented subsystem owns an overhead budget and machine-readable evidence.

## Status
Accepted.

