# M8 — Causal Diagnostics and Scene authoring

Status: acceptance in progress. Implementation is present; the browser gizmo gate
is being verified before completion is claimed. M7 is the last completed roadmap
point (48%). Completing M8 adds six percentage points.

| Requirement | Evidence / status |
| --- | --- |
| Four evidence-backed causal queries | Passed unit and live bridge tests |
| Bounded Decision Graph and stable lineage | Passed identity/revision/budget tests |
| Visible Diagnostics and opt-in deep trace | Unit tests passed; browser gate pending |
| Ten deliberate faults and unavailable evidence | Passed ten faults, expiration, eviction and stale scope |
| Normal-mode budget, schema/API and documentation | Passed 16 schemas, 51 tools and host benchmark; closure pending |
| Stopped Game preview and independent Scene camera | Passed browser checks before the gizmo gate |
| Bidirectional selection and move/rotate/scale Undo/cancel | Picking passed; browser gizmo gate pending |
| Navigation, global XYZ widget and editable demos | Demos and geometry tests passed; complete browser gate pending |

## Behavior

Game previews the saved game camera even while stopped. Play starts an isolated
runtime independently. Scene has a transient camera with orbit, pan, zoom,
flythrough, framing and axis alignment. Selection synchronizes with Hierarchy and
Inspector. Projected bounds and transform handles identify the selected object.
Completed drags submit one undoable edit; Escape cancels the preview.

Diagnostics beside Structured Console exposes decision paths, graphs, frame
contacts/triggers and command traces. diagnostics.explain also works through MCP.
It returns explained, inconclusive or unavailable, with revision and frame/command
identities. Deep trace is opt-in, sampled every 15 frames, capped at 32 frames and
expires after 30 seconds. Normal mode builds detailed draw evidence on query.

npm run demo preserves existing projects and creates four fresh editable projects:
the M7 physics samples plus M8 Scene Workshop and M8 Diagnostic Lab. The latter
contains named intentional faults for reproducing causal explanations. Each future
milestone includes useful demos for its new capabilities when applicable.
See demos/README.md for controls and expected results.

## Evidence

88 local Node tests passed, excluding the six server tests requiring a clean
Cargo build. CI runs the complete suite and real builds. Ten fault cases cover
missing Renderable, failed load, wrong resource kind, Null pixels, collapsed
geometry, clip exclusion, missing Collider, dimensions, masks and script failure.
Generated tool/script contracts, 16 schema documents, three architecture rules
and daemon parity pass. Final browser acceptance remains pending.

scripts/benchmarks/causal-diagnostics.mjs measures evidence bookkeeping over
256 entities. It is not a full editor-frame or physical GPU benchmark.

## Manual tests

None requested. The remaining browser gate is being automated.

## Limits

Selection outlines projected bounds, not pixel silhouettes. Picking does not
reject transparent texture pixels. One saved game camera is supported; snapping
and multi-selection remain future work. M7 colliders keep explicit world sizes
when visuals rotate/scale. Submission cannot prove pixel visibility; missing
contacts do not establish a fabricated solver cause. Deep trace is short-lived
evidence, not replay. See ADR-0021 and M8_DIAGNOSTICS_AND_EDITOR.md.

PR #8 is stacked on unmerged PR #7. After full acceptance follow M9_PLAN.md.
