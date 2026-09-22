# ADR-0006: WGSL native shaders

## Context
WebGPU standardizes WGSL and extra shader languages would add compilers and diagnostics prematurely.

## Decision
Use WGSL as the native shader source. Add controlled preprocessing and generation only after reflection and variant tracking exist.

## Alternatives
GLSL/HLSL translation and a custom shader language were deferred.

## Consequences
Diagnostics map directly to WGSL sources; shader permutation budgets are mandatory.

## Status
Accepted.

