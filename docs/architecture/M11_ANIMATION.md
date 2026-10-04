# M11 — animation contracts

Status: complete; full CI, software WebGPU and Null acceptance verified. Version 0.0.23.

GLB import retains static compatibility. Animated resources admit 128 nodes,
8 skins with 64 joints each, 16 uniquely named clips, 256 channels and 4096
total keyframes. STEP and LINEAR TRS channels are supported; quaternion rotations
use shortest-path spherical interpolation. Cubic curves, morphs, retargeting,
root motion, IK and animation events are explicitly outside this slice.
External resources and required unsupported extensions remain rejected.
Each skin has validated JOINTS_0/WEIGHTS_0 and inverse binds. Vertex weights
are normalized; negative/zero sums and invalid joint indices are rejected.

Animator is an optional mesh component: initial state, speed, autoplay, states,
float parameters and ordered transitions. Up to 8 states, 8 parameters and 16
transitions. Conditions are gt/lt/eq against a named parameter; an empty parameter
means the current nonlooping clip has finished. Crossfade durations 0–5 seconds.
The first matching transition wins; transitions finish before another starts.
Each state references a clip, loop flag and speed. At most 16 animated instances
and 65536 animated expanded vertices per scene. Animator and LOD cannot coexist.

Rust owns clip time, interpolation, skeletal transforms, crossfade and state
machine decisions. The scalar Wasm boundary uploads bounded immutable resources;
WebGPU computes linear blend skinning into vertex buffers consumed by legacy
and HDR passes. Null shares the Rust pose and bounded CPU geometry for bounds,
selection and diagnostics, with zero GPU submissions.
Stopped Game and Scene use the bind pose without ticking. Stop discards transient
state; Play begins from the configured state. Editor camera navigation never
changes animation. Runtime parameters/play/pause/state changes do not author the
project. Canonical Animator authoring uses revisions, Undo/Save and proposals.

Observed state exposes currentAnimation, transition and whyAnimationNotPlaying
with frame/generation provenance; disconnected/stale editors yield unavailable,
not inferred playback. Human controls and AI runtime actions use this same state.
C# Entity provides SetAnimationParameter, PlayAnimation, PauseAnimation,
ResumeAnimation, CurrentAnimation and WhyAnimationNotPlaying through bounded
validated operations; transient state is never written to the project.
The 2D correction selects nearest sampling in Scene whenever pixelPerfect is
enabled; only Game snaps the camera/uses integer scaling. Scene remains free.

Reference: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html

## Shared operations

`scene.animator.set(id, expectedSceneRevision, entityId, value)` authors the full
bounded component and participates in one atomic Undo. Human forms use it too;
agent authoring requires an isolated proposal. `scene.component.remove` removes
Animator, and removing Renderable also removes its dependent Animator.
`animation.query` requires project/revision and optionally entityId. It returns
observed items with frame, trace and generation, or unavailable with a reason.
`animation.control` requires project/revision/entityId and action pause, resume,
state or parameter; name/value/duration supply the bounded action arguments.
Live controls do not author the scene and require an active matching Play lease.

The fixed C# compilation entry point remains `namespace Game; public sealed class
GameScript : Script`. The M11 demo uses this same host contract. The SDK animation
methods emit validated transient intents, and CurrentAnimation/WhyAnimationNotPlaying
read the last observed runtime state sent with the callback. OnStart actions are
applied after runtime world compilation; spawned instances inherit the authored
Animator while retaining independent time/pose state.
