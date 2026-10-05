# M15 — Replay, diagnostic replay and entity cameras

The public `replay.control` tool and human Config → Replay / Diagnostic Replay
operate on the same isolated runtime as M14 game tests. A project must be open,
stopped and at the requested project/workspace revision. Only one test or replay
session owns the kernel, script worker and input at a time.

Actions: record (validated plan and uint32 seed), query, cancel, clear, export,
import (bounded recording JSON), replay (From/To and optional diagnostic question).
Record plan runs authored input blocks at fixed 1/60, captures state at frame zero,
every 60 frames and the last frame, then restores the authored scene. The supported
observable state includes transforms, rigid bodies/contacts/velocities, animator
state/time and the 2D clock. Private C# lifecycle fields are reconstructed by
re-running the earlier input prefix from initial state, verifying all checkpoints.
No raw .NET heap checkpoint restoration or instantaneous seek is claimed.

ReplayRandom provides the seeded C# generator. Replay spawns use deterministic IDs;
ordinary Play retains ordinary UUID entity creation and authored particle seeds.
Arbitrary System.Random, network, wall clocks, GPU pixels and audio timing are
outside the deterministic guarantee. New diagnostics retain recording ID and
original scene revision alongside their newly executed frame/trace identity.
Divergence and unsupported pixel evidence fail explicitly rather than passing.

Budgets: 600 frames, 64 checkpoint entities, at most 11 checkpoints, 30 seconds
active execution, 240,000 UTF-8 bytes per imported recording, at most 32 diagnostic
samples and 196,000 characters of diagnostic payload. Recordings identify imported
asset IDs/build keys and C# bundle identity. Revision/resource mismatch rejects
import and replay; there is no authored scene mutation or stale state overwrite.
Cancellation/disposal/external snapshots release runtime and input. Video/live
Play keyboard recording and arbitrary heap snapshots are not implemented.

Camera is a modular entity component with projection, FOV, orthographic height
and active state in Inspector. Transform and hierarchy determine its pose; Create
Camera includes Audio Listener. Scene navigation remains independent; Game and
detached Game use the active Camera while stopped or playing. Missing active Camera
shows an empty Game view after opting into entity-camera mode. No File Game Camera
or nested Primitives menu remains. Human new 2D/3D templates include their camera,
explicit light and basic object. The fixed legacy shader sunlight is removed.
Old scene-level camera projects retain compatibility until opting in; see ADR-0030.

AI menu and Config Project Master Document provide external MCP setup, bounded
project instructions/brief, context export and existing proposal review. Chat and
credentials remain in the external model client; the engine does not fabricate a
provider connection or assistant reply. ADR-0029 defines the six menu entries and
honest limits. Master documents are plain UTF-8 Markdown/text/JSON up to 32 KiB.

Editable examples and exact interaction instructions: demos/M15_GUIDE.md.
