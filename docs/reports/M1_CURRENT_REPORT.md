# Milestone 1 current report

Date: 2026-09-22. Version: 0.0.9. Status: functional criteria passed; remote CI pending.

## Outcome

The browser now loads a compiled Rust/Wasm kernel. Rust owns the demo mesh,
transform, camera projection, clocks and traced render-preparation jobs. WebGPU
uploads the resulting clip vertices; forced Null mode, absent GPU and device-loss
fallback use the same kernel and the Rust Null Renderer. The editor shows bounded
frame traces with kernel frame/trace IDs, fixed steps and CPU timings. GPU timing
is sampled on the first supported render pass.

The generic entity scene APIs remain preliminary. The integrated demo is a
fixed camera and one mesh, not a full scene editor or ECS renderer.

## Acceptance criteria

| Criterion | Status | Evidence |
| --- | --- | --- |
| Viewport shows WebGPU geometry | Passed | User Chrome screenshot: triangle, Wasm frame 840 and one mesh |
| Null Renderer executes the same scene without GPU | Passed | Compiled Wasm projects the shared mesh; forced/absent-GPU editor tests process it through Rust Null |
| Device capabilities are visible | Passed | Existing capability panel and explicit backend/timestamp status |
| A frame trace is inspectable | Passed | Editor integration tests inspect real-Wasm frame trace, stages, CPU timing and mesh count |
| Unit tests pass | Passed | 20 Node and 22 Rust tests pass locally |
| Basic GPU/CPU timings are visible | Passed | User screenshots: CPU about 0.165 ms (WebGPU), 0.05 ms (Null); first GPU sample 0 ms, Null GPU time null |
| Engine contains no editor logic | Passed | Architecture rules pass; Wasm host has no DOM dependency |

Functional acceptance: **7/7 = 100%**. Whole-project functional completion:
**11%** (M0 5% + M1 6%). Formal closure awaits a green remote CI run for this
snapshot; the historical M0 run does not certify M1.

## Automated evidence

- 20 Node tests, including actual compiled Wasm execution, instance isolation,
  invalid input rejection, shared mesh projection and editor forced/absent-GPU paths.
- 22 Rust tests; Rust 1.90 formatting and Clippy with warnings denied pass.
- Release Wasm build passes; the module is approximately 49 KiB.
- 10 schema documents, 3 architecture rules and daemon adapter parity pass.
- Clean-output HTTP regression validates JavaScript MIME, Wasm bytes and CSP:
  Wasm compilation allowed; JavaScript eval remains blocked.
- Browser test infrastructure download failed in this agent environment, so
  simulated-DOM evidence is explicitly distinguished from actual browser rendering.

## Browser evidence received

Both user screenshots confirm version 0.0.9 after the Cargo discovery fix.
WebGPU shows the blue triangle, protocol v1, frame 840, one mesh, CPU about
0.165 ms and timestamp support. The first GPU sample is 0 ms; this confirms the
query/readback path, not zero GPU cost or a useful precision benchmark.
Null mode shows no geometry, frame 225, one mesh, render.null, CPU about 0.05 ms
and GPU time null. These are individual displayed samples, not averages.

No additional manual browser test is required for unchanged code.

## Limitations and next work

- Remote GitHub Actions has not run 0.0.9 yet; its Rust gates pass locally.
- The camera is fixed at the origin. Demo transforms support position/scale;
  rotation, scene editing, parenting and multiple meshes remain future work.
- The render graph is a deterministic skeleton, not a GPU resource allocator.
- GPU timestamps are a first-frame sample, not a rolling query pool.
- Schema generation remains a cross-cutting obligation before public API lock-in.
- Device loss switches to Null; GPU recovery/recreation is not implemented.

## Windows startup follow-up

A Windows run exposed `spawnSync cargo ENOENT`. The build script now tries
`cargo.exe`, then CARGO_HOME/bin and USERPROFILE/.cargo/bin, without a shell.
Four discovery regressions pass, bringing the Node suite to 20 tests. The actual
CARGO_HOME fallback also built Wasm on Linux with Cargo absent from PATH.
The user confirmed startup and supplied WebGPU/Null screenshots after replacing
the build script. That regression is verified; no repeated manual steps needed.
