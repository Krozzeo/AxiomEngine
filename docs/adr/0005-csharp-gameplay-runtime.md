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
Accepted for the bounded M4 API. Chromium CI run 36285741144 executed both
development and AOT with generated component bindings. Reports are
`docs/reports/m4-csharp-development.json` and `m4-csharp-aot.json`.

The selected boundary uses one disposable .NET module worker per generation.
Messages carry bounded snapshots and validated operation batches; no command
token enters the worker. Compile failure retains the previous build. Reload
resets managed and runtime state instead of migrating fields or patching code.
AOT improves this small interop sample while increasing build time and download
size; this does not establish production performance across games or hardware.

.NET 10 compatibility details: keep RunAOTCompilation unset for development
(explicit false still requests native work in the current SDK), use
InvariantGlobalization=false for the prebuilt runtime, and addEventListener
instead of global onmessage (dotnet/runtime#114918). These are covered by actual
CI compilation and browser execution, not inferred from publish success.

