# ADR-0029 — Verified prefix replay and AI project context

Status: accepted implementation contract; execution acceptance pending M15 CI.

M15 records bounded controlled input plans and seed against an exact authored
project/workspace revision, asset build keys and C# bundle identity. Checkpoints
retain observable entities/transforms, velocities/contacts, animator state/time
and the 2D simulation clock. Restoration reinitializes one isolated runtime and
reconstructs the recorded input prefix, verifying each checkpoint. It does not
serialize an arbitrary .NET heap or skip prior C# lifecycle execution. Up to 600
frames, 64 entities, 240 KiB recording and 30 seconds active execution bound this
reconstruction. A divergent checkpoint fails explicitly. GPU/audio/wall clocks and
arbitrary script random/network sources are outside the guarantee. ReplayRandom
provides seeded C# values; replay spawns receive deterministic IDs. MAIN stays intact.

Diagnostics are newly executed in the replay range with original recording ID and
source revision plus fresh trace IDs. They never replace recorded checkpoint data.
Explicit budget truncation is reported. Export/import keeps exact scope; mismatched
revision/resources are rejected. Live user Play input recording is outside this
bounded plan recorder; UI labels it Record plan, not Record live gameplay.

AI menu exposes the requested six entries. Existing external MCP clients retain
model credentials and chat; the editor never fabricates an integrated connection
or model response. Proposal review moves to AI using the same reviewed workspace
controls. Config master document accepts bounded UTF-8 Markdown/text/JSON, stores
plain text in canonical project editor settings and renders through textarea,
never executable HTML. Assistant instructions and a locally assembled brief
support external AI context export. Integrated chat/provider connection remains
future work, and is explicitly stated in the UI.
