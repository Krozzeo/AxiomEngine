# ADR-0014: Dependency-light editor bootstrap

## Context
The initial shell needs a small, inspectable surface before UI component boundaries are understood.

## Decision
Use TypeScript-compatible browser modules and platform APIs for M0. Evaluate React and other UI frameworks against measured hierarchy/console virtualization prototypes before M2.

## Alternatives
Locking a framework before benchmarks was deferred.

## Consequences
M0 has no frontend supply-chain dependency. This is not a permanent ban on frameworks.

## Status
Accepted for bootstrap; review before Milestone 2.

