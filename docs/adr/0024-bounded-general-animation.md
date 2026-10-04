# ADR-0024 — Bounded general animation

Status: accepted; full CI and software WebGPU/Null acceptance verified.

M11 imports ordinary embedded GLB skeletons, inverse binds, normalized joint
influences and named STEP/LINEAR TRS clips. It preserves static meshes and PNG
assets. Invalid hierarchy, noninvertible transforms, joint references, weights,
clip references and numeric budgets fail before publishing a project/resource.
Derived import version 4 rebuilds old caches without changing immutable sources.
An optional Animator mesh component stores states, float parameters and ordered
conditional transitions. Animator and LOD are mutually exclusive in this slice.
The exact budgets are in M11_ANIMATION.md and the canonical project schema.

Rust owns elapsed clip time, shortest-path quaternion interpolation, hierarchy
poses, ordered state decisions and crossfades. A transition completes before the
next decision; an empty condition parameter means a nonlooping clip has finished.
Pause and zero speed freeze advancement. Scalar Wasm exports remain additive to
ABI 1. Independent instances do not merge geometry batches across different poses.
WebGPU compute skinning feeds both legacy and HDR passes. Bounded CPU reference
skinning supplies matching deformed geometry for bounds/picking and Null; this
cost is measured explicitly and is not advertised as GPU-only skinning performance.
No renderer-owned state machine or sample-specific runtime is introduced.

Play creates transient animation state; stopped Scene/Game render bind poses.
Stop discards parameters, time and poses. Script-driven topology recompilation
preserves valid live instances, and device/world disposal frees skinning resources.
C# animation operations validate the complete packet before any intent is applied.
Animation readbacks are observed runtime state, not authoring assumptions.

Canonical Animator authoring shares revisions, Undo, persistence and reviewed
M6 proposals. AI cannot author MAIN directly. Runtime controls require Play and
an updated editor lease; query responses include frame/generation/revision
provenance or explicit unavailable state. Invalid/stale controls fail. No runtime
control changes the stored scene or creates an authoring history entry.

Pixel-perfect texture filtering and Game camera snapping are separate policies.
Scene uses nearest filtering for those sprites while retaining its free camera;
Game alone uses snapped translation and integer reference scaling. This removes
texture-color diffusion without promising undistorted shapes at arbitrary zoom.

CUBICSPLINE, morphs, IK, retargeting, root motion, clip events and animated LOD
are explicit future work. CPU reference geometry is bounded to 65536 expanded
animated vertices and 16 instances; physical GPU/full-frame performance still
requires later profiling rather than an inference from software CI.
