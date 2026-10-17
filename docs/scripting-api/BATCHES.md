# Scripting API batches — 0.0.47 / SDK 6

Coverage means executable Axiom behavior, not complete Unity compatibility. Start with [INDEX.md](INDEX.md); per-type pages contain actual declarations, examples and limits.

| Batch | Implemented baseline | Remaining extensions |
|---|---|---|
| 1 · Objects and components | Runtime objects, supported component add/remove/query, tags/layers, world/local TRS, hierarchy, cloning compiled script fields, naming and live editor selection | Additional component families, unlimited creation, broader reflection |
| 2 · Execution and time | Lifecycle, fixed/variable time, scaled/unscaled clocks, coroutines, waits, Invoke and deferred destruction | Broader Unity message/signature compatibility and general async operations |
| 3 · Physics 2D | Native box/circle collision and angular dynamics; forces/torque; dynamic/kinematic/static; velocity integration, damping, constraints, explicit sleep/wake, simulated; gravity and collision exclusions; ray/overlap/circle/box casts; trigger/layer/depth filtering; pre-solver contact velocity | Capsule/polygon/edge/compound geometry, joints, automatic sleeping, interpolation, angular/analytic CCD, full ContactFilter2D normal-angle API |
| 4 · Physics 3D | Native OBB/sphere solver, manifolds and angular impulses; mass, gravity, force modes, torque/off-center force; kinematic velocity, damping, constraints, explicit sleep/wake; collision exclusions; sphere/box casts, rays and overlaps; bounded continuous substeps | Capsule/mesh/compound/terrain shapes, joints, custom centers/inertia, automatic sleep/interpolation, contact modification and advanced solver settings |
| 5 · Input | Keyboard letters/digits/function/modifier keys; mouse buttons/position/wheel; four gamepads with dead zones; ten pointer touches; named actions, axis/button remapping and serializable overrides; main/detached Game input | Unity Input System package/action assets, haptics, pen, sensors, interactive binding UI and full controller mapping profiles |
| 6 · Scenes, assets and persistence | Scene ownership/create/move, Single/Additive load/unload from physical project .scene.json files; persistent roots; TextAsset/PrefabAsset/SceneAsset resource lookup, prefab instantiation; project-scoped PlayerPrefs with explicit durable Save | Streaming/background I/O, Addressables/asset bundles, binary resource APIs, asset unloading, general save-file serialization and platform-specific persistent paths |
| 7 · Presentation | Existing editor rendering, lights, cameras, audio, animation and UI contracts | Broader runtime material/light/rendering/audio/animation/UI facade |
| 8 · Navigation and networking | No complete runtime batch claimed | Navigation, pathfinding, networking and associated packages |
| 9 · Platform and tooling | Existing editor/diagnostics contracts | Broader platform, editor extensibility, low-level and package APIs |

Three main batches remain: **7, 8 and 9**, plus the explicit extensions above. No percentage of the entire Unity API is claimed: the original Unity 6.3 TOC inventory has 5429 nodes and is an inventory, not a member-by-member audit.

Physics units: 3D radians/second, 2D degrees/second; collider dimensions are explicit world units and do not inherit Transform scale. MovePosition/MoveRotation set poses immediately. NonAlloc wrappers bound caller writes but still allocate temporary arrays. Query contact publication is bounded to 128 points, up to four per pair. Collision relativeVelocity now uses native pre-solver point velocities. Normal impulse is retained in native diagnostic contact evidence.

Continuous collision mode subdivides the fixed step based on linear travel/smallest extent with a hard maximum of 64 samples. It prevents tested fast-body tunneling within that budget; it is not unrestricted analytic time-of-impact or angular CCD. Sphere/circle casts use bounded conservative advancement (128 iterations, 1e-7 tolerance); highly grazing casts may exhaust that budget. Box casts use swept SAT against boxes and reverse sphere casts against spheres. Unsupported ContinuousDynamic/Speculative modes throw rather than silently substituting another solver.

Runtime scenes share the compiled project bundle and loaded project assets. LoadSceneAsync is immediately completed because its validated resource is already resident; no streaming is implied. Scene lighting/rendering settings are not switched. Runtime scene/prefab imports share the 64-creation-per-Play bound; scene templates are at most 64 entities. PrefabAsset is an Axiom blueprint type rather than Unity's asset-backed GameObject API.

PlayerPrefs uses browser localStorage keyed by project ID and origin, with explicit Save. It survives Stop/Play and refresh but is not embedded in the portable project document, encrypted or suitable for secrets. Browser storage denial/quota failures are visible. Input binding overrides can be persisted using PlayerPrefs.

Primary naming references: [Input](https://docs.unity3d.com/ScriptReference/Input.html), [SceneManager](https://docs.unity3d.com/ScriptReference/SceneManagement.SceneManager.html), [PlayerPrefs](https://docs.unity3d.com/ScriptReference/PlayerPrefs.html), [BoxCast](https://docs.unity3d.com/ScriptReference/Physics.BoxCast.html). Axiom implementations and explicit bounds are documented separately above.
