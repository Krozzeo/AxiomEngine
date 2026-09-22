# ADR-0005: C# gameplay behind ScriptRuntime

## Context
The developer-facing language must be productive without coupling engine internals to one managed runtime.

## Decision
Use C# through a `ScriptRuntime` boundary. Development builds prioritize iteration; release builds evaluate .NET Wasm AOT. Runtime generations are disposable on incompatible reloads.

## Alternatives
JavaScript-only gameplay and a direct C# dependency throughout engine core were rejected.

## Consequences
C#→Wasm size, startup, interop and reload semantics must pass an early spike before API expansion.

## Status
Provisional pending spike gate.

