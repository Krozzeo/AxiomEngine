# Scripting API compatibility — 0.0.48 / SDK 7

The compatibility reference is Unity 6.3 LTS (6000.3). Axiom provides its own implementation under `Axiom.Gameplay`; it does not embed the Unity runtime. The source of truth for executable members is the SDK, the generated type pages and their tests. Start with INDEX.md and BATCHES.md.

All nine areas below have executable coverage. **All nine remain partial compared with their full Unity categories.** Completing this release's acceptance does not complete those categories. There is no defensible whole-Unity compatibility percentage: the retained 5,429-node navigation inventory is not a member-by-member implementation audit.

| Area | Available surface | Remaining work and dependency |
| --- | --- | --- |
| Objects and components | Object/component lookup, supported add/remove, names/tags/layers, active state, world/local transforms, hierarchy cloning with script fields, typed component and asset references | More component families depend on implementing their engine systems. General reflection and broader Unity object/overload compatibility need a separate member audit. |
| Execution and time | Lifecycle, global Update/LateUpdate, solver-aligned FixedUpdate, scaled/unscaled clocks, coroutines/custom yields, waits, Invoke, deferred destruction and completion events | Broader message/signature support, general Task/async-await, configurable fixed step and wait timeouts. These require explicit lifecycle/scheduler contracts and tests. |
| Physics 2D | Box/circle collision, angular impulses, forces/torque, body modes, damping/constraints, explicit sleep/wake, gravity/exclusions, ray/overlap/circle/box casts and supported filters | Capsule/polygon/edge/compound shapes, joints, automatic sleep/interpolation, angular or analytic CCD and full normal-angle filtering require native solver/query extensions. |
| Physics 3D | OBB/sphere contacts, forces/torque, kinematic velocity, damping/constraints, explicit sleep/wake, exclusions, rays/overlaps/sphere/box casts and bounded continuous substeps | Capsule/mesh/terrain/compound shapes, joints, custom centers/inertia, contact modification, automatic sleeping/interpolation and advanced CCD require native systems. |
| Input | Keyboard/mouse, four gamepads, ten touches, named controls, axis/button rebinding and saved overrides, main and detached Game | Haptics/sensors/pen, controller profiles and interactive rebinding UI are separate device/UI work. Unity Input System action assets/package equivalence is not supplied. |
| Scenes, assets and persistence | Editable .scene files, active/multiple authoring scenes, Single/Additive runtime loads, scene events/ownership/persistent roots, prefabs and text resources, asset handles, typed references, PlayerPrefs and limited JsonUtility | Streaming, unloading, Addressables/bundles and binary resource APIs need resource ownership/I/O work. Nested/polymorphic serialization and portable save files remain separate work. |
| Presentation | Runtime material properties, Renderer/SpriteRenderer, light controls, camera projection/FOV/size, supported AudioSource properties and Animator parameter access | Runtime shader/resource construction, render textures, coordinate conversions, audio scheduling, humanoid/IK and a wider UI facade remain. Some extend current facades; others require new rendering/animation/audio systems. |
| Navigation and networking | Explicit XZ grid A*, complete/partial paths, sampling, route following; asynchronous browser HTTP with cancellation and completion | Grid A* is not triangular NavMesh baking. Avoidance/carving/links/area costs require navigation extensions. WebSockets and multiplayer replication/transport are new networking systems. |
| Platform and tools | Actual browser/canvas/platform hints, runtime counters, primitive/vector public-field JSON and independent lockable/dockable Inspectors | Native OS/editor/package APIs, arbitrary filesystem, a full editor extension SDK and arbitrary JsonUtility graphs are not implemented. Browser and daemon capabilities remain explicit. |

## Changes in this release

- .scene authoring is independent from transient runtime loading. New projects have Main Scene; open scenes retain content and cameras across activation/close/reopen. Only the active authoring scene is displayed while stopped.
- Component, custom MonoBehaviour and supported project-file references can be declared as script fields, assigned by compatible drag/drop or picker and resolved in actual C# execution. Inspectors can lock independent targets, duplicate, dock and detach; all tabs expose Close Tab.
- Explicit PlayerPref field bindings display a saved counter outside Play. They do not preserve arbitrary runtime fields or transforms.
- The cumulative 64-creation-per-Play quota is removed. Simultaneous limits remain: 1024 live entities, 256 active physical bodies, 32 script attachments and 128 operations per SDK dispatch. The stress demos distinguish this capacity ceiling from measured FPS.
- Presentation, navigation/HTTP, platform/tooling, execution/time and scene/resource APIs gain the bounded implementations documented in BATCHES.md and the generated pages.

## Migration and measurement boundaries

Unity scripts can still require changes: namespaces differ, some Axiom numeric APIs use double, lifecycle uses public virtual overrides rather than reflection over all private Unity messages, and some types/overloads have no implementation. Lowercase Vector3.forward is +Z; historical PascalCase Forward remains -Z. Axiom cameras look along local -Z.

Collider dimensions are explicit world units rather than automatically scaled visual dimensions. Angular velocity is degrees/second in 2D and radians/second in 3D. Continuous collision uses at most 64 linear substeps, not unrestricted analytic or angular time of impact. LoadAsync over validated resident data is not background streaming. PlayerPrefs is browser/origin/project storage, not portable project source.

The existing MVP estimate (122/130, approximately 94%) measures its historical weighted roadmap. It does not measure this expanded compatibility effort, Unity API completeness or live-model reliability.

## Next compatibility work

For each next scoped batch, enumerate exact types/members/overloads and classify each as implemented and tested, pending and feasible, blocked by a named subsystem, or explicitly excluded with a reason. Close the agreed feasible scope before describing that batch as complete. Preserve this document's distinction between release acceptance and full-category compatibility.

The useful next clusters are scheduler/lifecycle completion, resource ownership/serialization, presentation facade gaps and the larger native physics shape/joint work. Choose a bounded acceptance matrix before implementation; do not silently substitute a few wrappers for a whole Unity category.
