# ADR-0007: Command, event and causal protocol

## Context
Human UI and agents must operate the same semantics with auditable lineage.

## Decision
All important mutations are versioned commands. Facts are immutable events. Every envelope carries message, correlation, trace and causation identity. Transport adapters remain separate.

## Alternatives
UI-to-engine calls, REST resources as the domain model and string logs were rejected.

## Consequences
Undo, diagnostics, deltas and future MCP adapters share one command model.

## Status
Accepted.

