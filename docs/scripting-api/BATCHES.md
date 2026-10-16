# Scripting API implementation batches

The original 0.0.45 release supplied a foundation. The first two additional batches are implemented in 0.0.46 for the current engine model; this does not mean every Unity overload or subsystem exists.

| Batch | Current implementation | Explicit remaining compatibility limits |
|---|---|---|
| 1 · Objects and components | Empty runtime GameObject creation; lookup/query, tags and numeric layers; local/world transforms, points/vectors/directions, parenting/detaching/sibling order; recursive cloning with compiled script fields and startup; activation; dynamic supported component/script add/remove | One built-in storage kind and one compiled script type per entity; asset-backed AudioSource/Animator need authored assets; no Unity asset database, arbitrary component types, missing shape solvers, Unity-null equality, or shear transforms. Runtime tags/layers are not a new authoring Tag Manager. |
| 2 · Execution and time | Global Awake/OnEnable/Start and Update/LateUpdate phases; enabled/deactivated/destroyed callbacks; solver-owned FixedUpdate/contact phases; scaled/unscaled time and pause; coroutine scheduling/cancellation, nested enumerators, built-in waits; Invoke/InvokeRepeating/cancellation | Fixed period 1/60, eight-step catch-up; explicit public overrides; no private Unity message dispatch, custom PlayerLoop/order attributes, string coroutine overloads, arbitrary async resource yields or process-lifetime uptime clock. |
| 3 · Physics expansion | Existing 2D/3D box/sphere native solver and queries | Additional shapes, complete contact arrays/relative velocities, joints, shape casts, further angular body access. |
| 4 · Input | Existing keyboard/mouse and axis aliases | Action maps, gamepad/touch, rebinding. |
| 5 · Scene/assets | Existing project/assets editor contracts | Runtime scene management, Resources/Addressables, PlayerPrefs/persistence. |
| 6 · Presentation | Existing renderer, light, camera and audio/animation authoring | Complete runtime renderer/material/light/animation/audio/UI facade. |
| 7 · Navigation/network | No implementation claimed | Navigation, networking and associated packages. |
| 8 · Platform/tooling | Existing editor and diagnostics APIs | Broad editor, low-level, platform-specific and package APIs. |

The full baseline inventory remains `unity-6.3-inventory.json`. Entries are partial or pending rather than falsely marked fully compatible. Per-type pages list actual declarations. The engine API index and PMD index use the same addressable section hierarchy.
