# M18.3.8 / 0.0.46 — panel vision, durable Apply and runtime API batches

Implementation and automated acceptance are in progress. Do not treat this report as a completed release until the final executable commit and CI result are pinned here.

## Changes

- `renderer.capture` accepts a named panel. Scene and Game use independent renderer targets and their real respective cameras; other supported visible panels use bounded DOM rasterization. Capturing does not switch tabs or Play. Capture metadata binds project, workspace and scene revision; stale/unavailable frames fail explicitly.
- Actual PNG input is delivered to Responses using `input_image`, with only the latest two images and eight captures per task. History exports contain metadata rather than base64 bytes. No paid provider calls are used in automated acceptance.
- Human Apply persists the reviewed full branch before publishing MAIN. Save failures retain MAIN/proposal and roll back newly promoted resources. Successful Apply preserves preview edits and is immediately durable; pre-Apply recovery remains available.
- SDK 5 adds the implemented first two follow-up batches: objects/components and execution/time. See the canonical reference and `docs/scripting-api/BATCHES.md` for exact scope and exclusions. The word “implemented” does not claim full Unity compatibility or every overload/type.
- FixedUpdate is invoked for each actual native 1/60 solver step; contact dispatch follows the solver. Global Update precedes global LateUpdate. Scaled/unscaled time, coroutine waits/cancellation and Invoke are integrated with these phases.
- Shutdown closes owned HTTP connections and is idempotent, addressing the reproduced M2 restart failure (10-second daemon shutdown timeout). Earlier test cleanup could mask it with ERR_SERVER_NOT_RUNNING.

- Physics 2D and Physics 3D add live body/collider access, forces and inertia-aware torque, active/trigger/layer-filtered queries, manifold contact arrays and body-only integration. Runtime collider dimensions remain world units; shape casts, joints, CCD, advanced shapes and contact impulse/pre-impact velocity remain pending.
- Frame replacement drains the previous asynchronous frame before kernel disposal; the initial uncompiled kernel is not stepped. The legacy M6 acceptance assertion now checks automatic durable Apply rather than requiring an obsolete manual save.

## Validation

Focused local tests cover durable Apply/reopen/failure retention, runtime operation atomicity and provider image delivery. Full Linux/Windows Node, Rust, C# development/AOT and browser CI is pending. Local CoreCLR cannot start and local Chromium crashes at launch; those results are environment failures and are not counted as product acceptance.

New C#/Wasm acceptance checks hierarchy cloning, component creation/removal, serialized script copies, global lifecycle phases, coroutines, Invoke cancellation and scaled/unscaled pause. New browser acceptance checks Runtime API Lab, actual named PNGs, Responses image delivery and Apply/reopen persistence.

Demo: [M18_3_8_GUIDE.md](../../demos/M18_3_8_GUIDE.md). Historical MVP completion remains approximately 94% (122/130 original weights); expanded compatibility scope has no new validated weighting. M18.4 GitHub integration and M19 hardening have not been advanced by this correction.
