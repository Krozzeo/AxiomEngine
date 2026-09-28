# C# browser-Wasm runtime gate

The spike now publishes and executes C# in a dedicated Chromium worker, measures
publish time, raw/gzip bytes, startup and 10,000 interop calls, then replaces the
worker without navigating the page. Both development and AOT run in CI.

```bash
dotnet workload install wasm-tools
npm ci
npx playwright install chromium
node tests/browser/csharp-spike.mjs
node tests/browser/csharp-gameplay.mjs
```

Set `AXIOM_CSHARP_MODE=aot` to measure release AOT. Outputs are in
`.axiom/csharp-spike-evidence`. The gameplay gate compiles generated bindings
and executes actual lifecycle, Transform, Input, spawning and logging.
See `docs/reports/m4-csharp-development.json`, `m4-csharp-aot.json` and ADR-0005.
The .NET 10 worker must register through addEventListener: a global onmessage
handler triggers incorrect pthread detection (dotnet/runtime#114918).
