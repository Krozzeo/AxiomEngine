# M15 demos — 0.0.28

Run npm.cmd run demo then npm.cmd run dev. Existing projects are preserved.
C# demonstration requires .NET 10 and wasm-tools; compilation failures are reported.

Open Demo · M15 Seeded Input Replay. Ordinary Play accepts left/right arrows.
Stop; Config → Replay / Diagnostic Replay contains its saved input plan: 120 frames
right, then 120 left. Seed 42 gives a reproducible initial vertical offset through
ReplayRandom. Record plan runs in an isolated simulation; observe checkpoints
0/60/120/180/240. Set From 120, To 240 and Replay range. Verified checkpoints and
frame diagnostics show the actual re-execution. It reconstructs the earlier input
prefix to restore private script state; it does not deserialize the .NET heap.
Export the recording, clear it, import it and repeat. Project revision/resources
must match. Authored scene edits invalidate the recording rather than replay stale
state. Cancel releases runtime/input without publishing a partial new recording.

Collision Diagnostic Replay records 120 real physics frames as a block falls onto
a floor. Animator Checkpoints records 120 frames of the actual Idle animation.
Use ranges 60–120 to compare repeatability. Public replay.control additionally
accepts a diagnostic question/entity pair to re-execute causal investigation.
No GPU or audible output determinism is claimed; Null still runs CPU/Wasm replay.
Record plan records explicit plan inputs, not live keyboard actions during Play.

AI → Connect AI model explains the external MCP client connection. Credentials
remain in that client. AI proposal has the existing review/preview/accept/reject
controls. Config → Project Master Document loads UTF-8 .md/.txt/.json up to 32 KiB.
Config AI assistant saves project instructions; assisted creation builds a local
editable brief template. Talk options explain external chat and context export;
they do not pretend the engine already has an integrated model chat.
