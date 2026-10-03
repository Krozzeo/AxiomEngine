# M8 — causal evidence and scene authoring

Version 0.0.18. Protocol/scene/MCP semantic API versions remain 1.

## Views and authoring

Scene and Game are views, independent of Play/Stop. Game previews the saved scene
camera while stopped; Play runs the existing isolated copy and initially selects
Game. Either view can be selected during Play without restarting it. Scene uses
a transient editor camera; navigating it does not mutate the project camera or
the scene. There is currently one game camera per scene.

Scene selection synchronizes with Hierarchy and Inspector in both directions.
Picking intersects imported triangles after their world transforms, choosing the
nearest hit. Transparent sprite pixels are not tested by picking. A projected
selection-bounds outline and transform gizmos show the selected object.

- W/E/R: move, rotate, scale. Drag colored axis handles or rotation rings.
- World/Local: orient translation/rotation axes. Scale edits local scale values;
  the center square scales uniformly.
- One drag submits one scene.entity.update command with the current revision;
  live preview is transient, Escape cancels, and Undo reverses the completed drag.
- F: frame selection; Alt + left drag: orbit; middle drag: pan; wheel: zoom.
- Right mouse + WASD/QE: 3D flythrough; Shift increases speed, wheel changes speed.
  In orthographic mode right drag pans; orbit/flythrough are disabled.
- The bottom-left XYZ widget aligns the editor camera to positive/negative axes.
  Ortho/Persp switches only the editor projection. The left Game camera projection
  control changes the authored game camera.

Authored gizmo edits are disabled during Play. Scene navigation remains available
and keyboard gameplay input is routed only while viewing Game during Play.
Physics colliders remain the M7 world-aligned shapes; rotating/scaling visuals
does not implicitly rotate/resize collider half-extents.

## Diagnostics

The Diagnostics tab is beside Structured Console. It exposes a readable decision
path, JSON Decision Graph evidence, Frame diagnostics (including contacts/triggers)
and the last command trace. Select an entity, choose a question and Explain selected.
whyNotColliding also uses the second-entity selector; whyAssetNotLoaded uses the
selected asset in the Assets list.

The same read-only diagnostics.explain semantic command/MCP tool accepts:

```json
{"id":"project://...","expectedSceneRevision":12,"kind":"whyNotRendered","entityId":"entity://..."}
```

Kinds: whyNotRendered, whyNotColliding, whyAssetNotLoaded, whyScriptNotRunning.
Optional otherId, assetId, traceId and workspaceId target pairs, resources,
retained frame evidence and proposal scope. Input identities must be real IDs.
Results distinguish explained, inconclusive and unavailable. Null renderer
evidence works; disconnected/stale editors cannot provide current evidence.

Rendering evidence reports component/resource admission, actual draw matrices,
camera clip-plane exclusion and submission backend. Submission does not prove
pixel visibility; depth occlusion and texture alpha remain inconclusive.
Collision evidence reports configured dimensions/layer masks and actual retained
contacts. A missing contact is not fabricated into a separation/solver diagnosis.
Script evidence reports attachments, stopped simulation, worker activity and
actual initialization/update faults. Resource errors preserve the loader failure.

The graph is query-local, at most 24 nodes/23 edges and 16 KiB over the bridge.
Lineage includes frame trace ID, last workspace command correlation/causation IDs,
project/workspace IDs and scene revision. Frames and commands have distinct IDs;
lineage links evidence to the scene command, not a claim that command executed
every later frame. Schema: protocol/schema/decision-graph.schema.json.

Normal mode collects detailed geometry evidence only on demand. Deep trace is
opt-in, samples every 15 rendered frames, retains at most 32 samples and expires
evidence after 30 seconds. Disabling it clears retained samples. Use a returned
traceId in the optional frame trace field to inspect a retained sample. Historical
frames from another project/workspace/revision are rejected explicitly.

## Validation and limits

tests/causal-diagnostics.test.mjs injects ten faults: absent Renderable, failed
resource load, resource kind mismatch, Null pixels, collapsed geometry, clip-plane
exclusion, missing Collider, dimension mismatch, rejected mask and script failure.
tests/browser/m8.mjs checks normal authoring, real WebGPU/physics, selection,
gizmo Undo/cancel, camera isolation, diagnostic UI and the live command bridge.
scripts/benchmarks/causal-diagnostics.mjs measures host bookkeeping on 256 entities;
it does not measure physical GPU performance or complete editor frame overhead.

This is causal diagnostics v1, not a full pixel debugger, physics replay or complete
Unity editor. There is no multi-selection, transform snapping or per-pixel outline.
The render/runtime boundary is the bootstrap WebGPU editor; the native daemon
retains its documented M0 scope. Future renderer decisions must extend evidence
at their actual decision site, never infer arbitrary root causes from symptoms.
