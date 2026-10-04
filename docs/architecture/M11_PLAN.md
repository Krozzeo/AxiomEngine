# M11 — General animation foundation

Status: implementation in progress; acceptance pending. Roadmap weight: 4%. Master specification section 130.
Begin only after M10 full CI and closure. Read the master specification,
M10_2D.md / ADR-0023, M9_RENDERER.md / ADR-0022, asset import contracts,
M6_WORKSPACES.md and current reports before implementation.

Define bounded skeleton/skin/clip resource contracts and extend normal GLB
import, preserving static mesh and PNG compatibility. Rust owns runtime animation
state and transforms; WebGPU skinning and Null consume the same validated plan.
Implement clip playback, bounded blending and basic state machines, shared human
Inspector and AI revision-checked commands, persistence and isolated proposals.
Queries must expose currentAnimation, transition and whyAnimationNotPlaying using
observed diagnostic evidence. Preserve M10 sprite animation independently.

Include editable demonstrations, meaningful real browser pixels/interaction,
Rust/Wasm/protocol/proposal tests, bounded benchmarks, all earlier CI regressions,
image review and complete documentation/handoff/state/changelog closure.
A design document alone does not count as implemented progress.
