# ADR-0021 — editor view state and bounded causal evidence

Status: accepted. Date: 2026-10-03.

Scene navigation is transient editor state. Game uses the authored scene camera;
Play controls isolated simulation. View switches are not commands that start or
stop simulation. Gizmo preview is also transient; its completed edit uses the
same revision-scoped scene.entity.update and undo history as Inspector/agents.
Rust retains runtime instances, authored transforms and physics; JavaScript
editor math derives view matrices and triangle selection from imported geometry.

Causal evidence is captured at the renderer/resource/script/physics boundaries
and queried through one explanation model shared by UI and semantic tools.
Normal mode builds detailed evidence on demand. Deep tracing retains 32 sampled
frames for 30 seconds, with bounded results and explicit missing/expired/stale
states. Submission and absent contact cannot establish pixel visibility or an
unobserved physics cause. The editor lease and project/workspace revision bind
each remote diagnostic response.

Rejected alternatives: starting Play from the Game tab, mutating the game camera
to navigate Scene, one command per drag frame, unlimited frame-world retention,
and heuristic explanations presented as proven causes.

Consequences: live editor availability is required for renderer evidence; the
native M0 adapter does not silently advertise bootstrap M8 semantics. Collider
rotation/scale stays independent from visual gizmos until a later physics decision.
