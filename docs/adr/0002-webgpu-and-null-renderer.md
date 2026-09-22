# ADR-0002: WebGPU and Null Renderer

## Context
Axiom is browser-native but must remain useful without a compatible GPU.

## Decision
Use WebGPU exclusively for MVP graphics and a Null Renderer for headless/no-GPU execution. Treat timestamp queries as optional.

## Alternatives
Parallel WebGL2 and external rendering engines were rejected.

## Consequences
Capability detection and device-loss recovery are first-class; WebGL compatibility work is deferred.

## Status
Accepted.

