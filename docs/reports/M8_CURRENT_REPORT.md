# M8 — Causal Diagnostics and Scene authoring

Status: complete. M8: 8/8 (100%). Weighted whole-project completion: 54%.

| Requirement | Evidence / status |
| --- | --- |
| Four evidence-backed causal queries | Passed unit tests and all four live demo questions |
| Bounded Decision Graph and stable lineage | Passed project/workspace/revision/graph-budget and live bridge checks |
| Visible Diagnostics and opt-in deep trace | Passed browser trace lookup and retention/expiry tests |
| Ten deliberate faults and unavailable evidence | Passed ten injected faults, expiration, eviction and stale scope |
| Normal-mode budget, schema/API and documentation | Passed 16 schema documents, 51 tools, host benchmark and closure documentation |
| Stopped Game preview and independent Scene camera | Passed saved-camera isolation during orbit/fly/zoom |
| Bidirectional selection and move/rotate/scale Undo/cancel | Passed 3D/2D picking, actual drags, one-drag Undo and Escape |
| Navigation, global XYZ widget and editable demos | Passed navigation/alignment/projection and persisted M8 projects |

## Behavior

Game previews the saved game camera even while stopped. Play starts an isolated
runtime independently. Scene has a transient camera with orbit, pan, zoom,
flythrough, framing and axis alignment. Selection synchronizes with Hierarchy and
Inspector. Projected bounds and transform handles identify the selected object.
Completed drags submit one undoable edit; Escape cancels the preview. SVG targets
are preserved across redraws and handle hits resolve painted geometry when a
browser retargets animated SVG pointer events to its root.

Diagnostics beside Structured Console exposes readable decision paths, graphs,
frame contacts/triggers and command traces. diagnostics.explain also works through
MCP. It returns explained, inconclusive or unavailable, with revision and
frame/command identities. Deep trace is opt-in, sampled every 15 frames, capped
at 32 frames and expires after 30 seconds. Normal mode builds detailed draw
evidence on query rather than every frame. Resource/script failures retain their
actual errors; submitted geometry and absent contacts do not fabricate causes.

npm run demo preserves existing projects and creates four fresh editable projects:
the M7 physics samples plus M8 Scene Workshop and M8 Diagnostic Lab. The latter
contains named intentional faults for reproducing causal explanations. Each future
milestone includes useful editable demos for its new capabilities when applicable.
See demos/README.md for controls and expected results.

## Automated evidence

Release code 47a431d8e971fb9a18140749564e56ae9b4f9c4a:
https://github.com/Krozzeo/AxiomEngine/actions/runs/37133003810

94 Node tests pass on Linux and Windows, including six server tests requiring a
clean Cargo build. 30 Rust tests, formatting, Clippy with warnings denied, core
Wasm compilation, generated tool/script contracts, 16 schema documents, three
architecture rules and daemon parity pass. C# development/AOT execution and
Windows development pass. Every M2–M8 browser acceptance passes in isolated jobs.

M8 passes eight browser criteria with zero page errors. The workflow exercises
the two demos, actual WebGPU/physics, game-camera isolation, transform drags,
Undo/cancel, orthographic sprite picking, all four diagnostic questions, the live
semantic bridge and retained frame lookup. Raw report: m8-browser-evidence.json.
Screenshot artifacts are retained by CI; visual acceptance here uses automated
picking, pixel and state checks rather than a local human screenshot inspection.

Ten fault cases cover missing Renderable, failed load, wrong resource kind,
Null pixels, collapsed geometry, clip exclusion, missing Collider, dimensions,
masks and script failure. Separate tests reject expired, evicted and stale scopes.

The host-only benchmark over 256 entities and 1,000 iterations measured about
0.00462 ms per query and 0.194 ms per retained sample.
It retained 32 frames, 322,880 serialized bytes, and a 605-byte
example graph. These measurements exclude geometry evidence collection, picking,
complete editor-frame cost and physical GPU performance.
Raw data: m8-causal-benchmark.json.

The M2/M3 persistence pixel gates now compare the saved Game camera. Scene's
transient camera is independently tested by M8 and is not a persisted screenshot
contract. Pixel failures use bounded messages. Browser CI jobs are isolated so
each milestone has its own execution and evidence artifacts.

## Manual tests

None required. The demos are available for exploration; their acceptance is
automated and is not delegated to the user.

## Limits

Selection outlines projected bounds, not pixel silhouettes. Picking does not
reject transparent texture pixels. One saved game camera is supported; snapping
and multi-selection remain future work. M7 colliders keep explicit world sizes
when visuals rotate/scale. Submission cannot prove pixel visibility; missing
contacts do not establish a fabricated solver cause. Deep trace is short-lived
evidence, not replay. The native Rust daemon retains its M0 surface.
See ADR-0021 and M8_DIAGNOSTICS_AND_EDITOR.md.

PR #8 is stacked on unmerged PR #7. M9 follows M9_PLAN.md.
