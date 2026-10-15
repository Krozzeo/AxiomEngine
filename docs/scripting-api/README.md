# Axiom Scripting API

Baseline: Unity 6.3 LTS (6000.3). Axiom 0.0.45 is a partial compatibility layer, not a Unity runtime.

Start with [INDEX.md](INDEX.md), which contains only ordered titles and hierarchy. Each leaf title maps to its Markdown file. The editor's Help → Scripting API panel presents the same canonical content as the repository mirror. `script.sdk.read {query:"index"}` returns its addressable section index; a type/member query retrieves focused documentation and actual SDK source. Unknown queries explicitly report no matching implementation.

Canonical content: `engine/scripting/reference/catalog.json`. `node scripts/generate-scripting-reference.mjs` adds current declarations from the real SDK and writes the GitHub Markdown mirror. `--check` detects drift. Do not claim member support just because its Unity type is present.

## Audit scope and batches

[unity-6.3-inventory.json](unity-6.3-inventory.json) records all 5,429 navigation nodes in the official baseline TOC, including namespaces, groups and types. It records the source URL and SHA-256. `pending` means unimplemented; `partial` points to an Axiom page whose declarations and limitations define the actual supported surface. This is a complete TOC inventory, **not** a completed audit or implementation of every member page. Documentation prose, examples, layout code and icons in Axiom are original; Unity's navigation taxonomy and API signatures guide compatibility.

1. Current foundation: objects/components/transforms, explicit lifecycle, vector/math helpers, keyboard input, active-camera lookup, rigid bodies, closest-hit 2D/3D queries, contact callbacks, instantiate/destroy/activation, existing audio/animation wrappers, Inspector attributes.
2. Physics follow-up: solver-owned fixed lifecycle, full contact arrays/relative velocity, torque/angular properties, joints, shape casts, Rigidbody2D parity and accurate world bounds. Existing contact reporting is bounded and delivered from the preceding physics snapshot.
3. Runtime follow-up: coroutine scheduling, Invoke, time scale, dynamic component attachment, complete hierarchy cloning with script startup, tags/layers, scene management, Resources/asset loading and persistence APIs.
4. Presentation follow-up: full Camera surface, materials/renderers, lights, animation curves, particles, expanded audio and UI/event APIs.
5. Platform/tooling follow-up: gamepads/touch/action maps, networking, navigation, editor tooling, advanced rendering, platform-specific and package-specific namespaces. Remaining catalog entries remain explicitly pending; prioritize them from validated project needs.

## Important migration boundaries

- Namespace is `Axiom.Gameplay`; numbers remain `double` where the original SDK used doubles. Unity source can require adaptation.
- `Entity.Transform.Position/Rotation/Scale` preserve snapshot access. `transform.position/rotation/localScale` are live runtime properties.
- Lowercase `Vector3.forward` is +Z. Existing PascalCase `Forward` remains -Z; Axiom cameras look along local -Z.
- New lifecycle methods are public virtual overrides. Existing OnStart/OnUpdate/OnStop overrides remain valid; private Unity messages are not reflected.
- Instantiate currently clones one entity and does not start new script instances. Ray queries follow the engine's sphere/box collider baseline, not arbitrary rendered mesh geometry.
- Unsupported members are not success-returning stubs. Consult the exact page before assuming compatibility.
