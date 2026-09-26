# M3 asset pipeline — 0.0.13

Status: acceptance candidate; browser hot-reload gate pending.

## Database, identity and dependency graph

`scene.assetDbVersion = 1` identifies the embedded Asset DB. Its records live in
`scene.assets`, so project save atomically persists the scene and its asset graph.
`id` is stable logical identity. Legacy M2 IDs keep their existing `asset://hash`
spelling; the initial hash is not recomputed when that logical asset is replaced.
`sourceId` identifies immutable source bytes by SHA-256. An omitted sourceId uses
id, allowing old M2 projects to load without changing entity references.

Mesh records may reference an imported PNG with `textureId`. This is an explicit
base-color texture dependency applying to all primitives of the mesh. It replaces
embedded base-color textures and sets the base-color multiplier to white; normals,
geometry and other supported material flags are retained. Original source bytes
remain immutable. The graph validator rejects missing/incompatible dependencies
and the key builder rejects cycles. Scene entities reference logical IDs.

Each import/composition node has a deterministic buildKey computed from source
hash, importer version and ordered dependency keys. The fixed supported settings
are covered by that importer version. A changed texture invalidates its own output
and dependent mesh outputs, not independent assets. Identical content reuses the
same output. Build statistics distinguish `rebuilt`, `cacheHits` and `unchanged`.
The renderer uses buildKey, not logical ID alone, to invalidate browser asset data.

## Derived cache and importer API

`AssetPipeline.resource(projectId, scene, id, signal)` resolves a graph node.
`build` prepares all changed nodes in dependency order before scene publication.
PNG/static GLB importers are the bounded M2 implementations. PCM WAV adds audio
metadata (channels, sample rate, bit depth, frame count and duration), not playback.
Supported WAV is RIFF PCM, mono/stereo, 8/16/24/32 bits, 8–192 kHz; compressed and
extensible WAV formats are rejected. Source size remains at most 8 MiB.

Derived JSON files share the project's protected asset folder and are addressed
by buildKey. Cache headers contain importer version, key and output checksum.
Missing/corrupt cache entries regenerate from hash-verified source bytes. Each
output is limited to 32 MiB. Writes use temporary files, fsync and atomic rename;
link checks and bounded reads follow the source store's confinement model.
Cache and unreferenced source files are disposable/retained respectively; automatic
cache eviction and source garbage collection are not implemented in this milestone.

Import CPU work runs in a fixed internal Node worker module with a 128 MiB V8
old-generation limit and a 15-second timeout. HTTP clients cannot supply module
paths, processes or external URLs. The worker API takes source bytes and returns
an immutable decoded resource or AX_ASSET_0001 error. One background job runs per
daemon; at most 64 job receipts are retained. Cancellation terminates active CPU
work. A cancelled/failed job can leave reusable immutable cache/source files,
but never replaces the live authoring state.

## Commands and publication

| Command | Data | Result |
| --- | --- | --- |
| asset.job.start | id, expectedSceneRevision, operation, assetId when replacing/binding; name/base64 for sources; textureId for binding | queued job receipt |
| asset.job.get | id, jobId | queued/running/completed/failed/cancelled status and build evidence |
| asset.job.cancel | id, jobId | cancellation request; poll until terminal |
| asset.explain | id, assetId | whyAssetNotLoaded, whyWasRebuilt, whatUses and recent matching jobs |

Operations are `import`, `replace`, `bindTexture`. M2's `asset.import` remains a
compatible awaited operation. Jobs capture the project and scene revision. All
outputs are prepared before commit; intervening edits, project changes or Play
reject a stale job. Save/project switches wait for the active job to finish or be
cancelled. Successful publication is one undoable scene edit and emits
`asset.jobFinished` with the original trace/correlation/causation IDs.

The editor offers source replacement, texture binding, cancellation and an
Explain view. It polls event deltas every 750 ms to refresh a completed external
job without navigation; own jobs refresh immediately after completion. Uploading
replacement source bytes is the supported update path. Arbitrary host paths and
OS filesystem watching are not exposed. Play blocks new authoring jobs.

Save persists updated source pointers/build keys. Undo/redo restores earlier
pointers, including dependent keys; immutable bytes make that reversible. Jobs
and events are session diagnostics, while per-record lastBuild reason persists.
`whatUses` resolves dependent assets and scene entities. `whyAssetNotLoaded`
checks registration and source availability; it is not a physical GPU residency query.

## Verification and limits

Node regression tests cover selective invalidation, unchanged cache timestamps,
stable references, cache recovery, cancellation, stale edits, failure preservation,
causal events, undo/redo, restart and WAV rejection. Browser M3 acceptance uses a
second API client to replace a shared texture and verifies changed sprite/mesh
pixels, unchanged independent build keys, the same page identity and exact pixels
after daemon restart. M2 acceptance remains a separate regression gate.

The Node bootstrap is the verified path. Native authoring parity, general schema
code generation, GPU-only partial buffer updates, background job crash resumption,
OS file watching, unrestricted glTF resources and audio playback are not claimed.

WAV source references:
https://learn.microsoft.com/en-us/windows/win32/api/mmreg/ns-mmreg-waveformatex
https://learn.microsoft.com/en-us/windows/win32/xaudio2/resource-interchange-file-format--riff-
