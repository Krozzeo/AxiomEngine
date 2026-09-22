# C# → browser Wasm risk spike

This spike answers only whether the pinned .NET toolchain can publish a small,
warning-free C# program for `browser-wasm`. It intentionally does not pretend
that runtime embedding, interop, hot reload or AOT economics are solved.

Gate command:

```bash
dotnet workload install wasm-tools
dotnet publish -c Release
```

Record compressed output size, publish duration, browser startup, engine-call
interop cost and reload behavior before ADR-0005 becomes final.

