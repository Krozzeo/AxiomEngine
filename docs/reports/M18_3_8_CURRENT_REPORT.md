# M18.3.8 / 0.0.46 — panel vision, durable Apply and four scripting API batches

Automated acceptance is complete. [CI 295](https://github.com/Krozzeo/AxiomEngine/actions/runs/39001000290) passes all **39 jobs** at executable commit `d7d11fb0dfa07a1d157f8a9779078017f16f4e66` (tree `f22939062469f36bf466bd63b1be227e1bc0f86b`): **388 Node tests on Linux and Windows**, **39 Rust tests** with formatting/clippy/Wasm checks, **C# Linux development/AOT and Windows development**, and **30 browser groups**. The new browser group passes **7 criteria**. No paid provider calls were performed.

## Changes

- `renderer.capture` accepts a named panel. Scene and Game use independent renderer targets and their real respective cameras; other supported visible panels use bounded DOM rasterization. Capturing does not switch tabs or Play. Capture metadata binds project, workspace and scene revision; stale/unavailable frames fail explicitly.
- Actual PNG input is delivered to Responses using `input_image`, with only the latest two images and eight captures per task. History exports contain metadata rather than base64 bytes. No paid provider calls are used in automated acceptance.
- Human Apply persists the reviewed full branch before publishing MAIN. Save failures retain MAIN/proposal and roll back newly promoted resources. Successful Apply preserves preview edits and is immediately durable; pre-Apply recovery remains available.
- SDK 5 adds the implemented first two follow-up batches: objects/components and execution/time. See the canonical reference and `docs/scripting-api/BATCHES.md` for exact scope and exclusions. The word “implemented” does not claim full Unity compatibility or every overload/type.
- FixedUpdate is invoked for each actual native 1/60 solver step; contact dispatch follows the solver. Global Update precedes global LateUpdate. Scaled/unscaled time, coroutine waits/cancellation and Invoke are integrated with these phases.
- Shutdown closes owned HTTP connections and is idempotent, addressing the reproduced M2 restart failure (10-second daemon shutdown timeout). Earlier test cleanup could mask it with ERR_SERVER_NOT_RUNNING.

- Physics 2D and Physics 3D add live body/collider access, forces and inertia-aware torque, active/trigger/layer-filtered queries, manifold contact arrays and body-only integration. Runtime collider dimensions remain world units; shape casts, joints, CCD, advanced shapes and contact impulse/pre-impact velocity remain pending.
- Frame replacement drains the previous asynchronous frame before kernel disposal; the initial uncompiled kernel is not stepped. The legacy M6 acceptance assertion now checks automatic durable Apply rather than requiring an obsolete manual save. Project synchronization now compares project identity as well as revision and compiles newly opened projects through the external/API path too.

## Validation

- Controlled Responses receives actual Scene/Game PNG input_image content; images do not enter history exports. Named Scene/Game/Hierarchy PNG captures keep view/Play unchanged and enforce project/workspace/revision identity.
- Apply save/reopen and injected save failure preserve durability and branch recoverability. Acceptance covers preservation of manual preview edits and the explicit full-state replacement policy.
- C#/Wasm checks object hierarchy cloning, serialized fields, components, lifecycle order, fixed phases, coroutine/Invoke and scaled/unscaled pause. Physics checks cover mass, fixed-step force and impulse semantics, box inertia, off-center torque, 2D degree conversion, kinematic guards, live collider sizing/enabled, ordered/filtered/bounded rays, oriented overlap, closest point and full contact manifolds.
- Actual Wasm checks body-only gravity, angular writes, atomic invalid angular batches, removal of queued writes and fresh-body momentum reset. Real browser demos compile physical C# files, fall on the floor, respond to Space through native simulation and restore authored state on Stop.
- Regressions include repeated Play/Stop across asynchronous frames, snapshot replacement while editing prefab hierarchies, Null rendering, legacy durable Apply and the full prior browser suite. No supplied Player demos are recreated for delivery.

## Limits and remaining work

Scene/Game captures are renderer color views; DOM gizmo/selection overlays are not included. UI captures require a visible supported panel and redact password inputs. OS/external-site capture is outside this API. Captures are capped at eight/task, latest two images, 512 KiB PNG.

This is a partial Unity-compatible surface, not a complete Unity runtime. See [BATCHES.md](../scripting-api/BATCHES.md): joints, real capsule/mesh/compound colliders, CCD, shape casts, sleep/interpolation, per-axis constraints, pre-impact velocity and contact impulse remain pending. Collider extents currently use world units independently of Transform scale. NonAlloc bounds caller writes but still uses managed temporary arrays; MovePosition/MoveRotation update immediately; kinematic bodies are manually posed and do not integrate stored velocity autonomously. Callback overrides remain explicit public methods.

The five remaining main API batches are Input; Scene/assets/persistence; Presentation; Navigation/network; Platform/tooling. Advanced limitations in already expanded batches are retained separately rather than counted as complete compatibility. The original weighted MVP estimate remains approximately 94% (122/130); this expanded API scope has no validated weighting of its own.

## User-only acceptance

Real account/model visual quality and actual billed token usage cannot be established by controlled provider tests. With a connected vision-capable model, request independent Scene/Game captures and compare its description with the visible views. This is the only account-side check requested for the release; automated engine checks above are already complete.

## Reproducibility

Local Node verification uses a recovered previously tested native kernel because this managed workspace cannot initialize Rust's toolchain executable through /proc. Native rebuild, C# development/AOT and full browser acceptance are established by the pinned GitHub CI above. This limitation is not represented as a local successful rebuild.

Demo: [M18_3_8_GUIDE.md](../../demos/M18_3_8_GUIDE.md). Historical MVP completion remains approximately 94% (122/130 original weights); expanded compatibility scope has no new validated weighting. M18.4 GitHub integration and M19 hardening have not been advanced by this correction.
