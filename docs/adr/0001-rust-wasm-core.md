# ADR-0001: Rust/WebAssembly engine core

## Context
The engine needs predictable memory ownership, data-oriented layouts and a browser target.

## Decision
Implement runtime-critical engine systems in Rust targeting WebAssembly. Keep core crates DOM-free.

## Alternatives
C++, TypeScript-only, and C# core were considered.

## Consequences
Browser bindings remain thin; Rust/Wasm toolchain validation is a release gate.

## Status
Accepted.

