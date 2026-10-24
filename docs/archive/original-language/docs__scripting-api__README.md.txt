# Plan de expansión vigente

[Roadmap M19–M40](../architecture/ROADMAP_M19_M40.md): auditoría, implementación por familias, conformidad integral y estabilización final. Este documento conserva la descripción de SDK 7; las milestones nuevas siguen planificadas y no amplían por sí mismas su cobertura ejecutable.

# Axiom Scripting API

Baseline: Unity 6.3 LTS (6000.3). Axiom 0.0.48 / SDK 7 is a partial compatibility layer, not a Unity runtime.

Start with [INDEX.md](INDEX.md), which contains only ordered titles and hierarchy. Each leaf has a matching Markdown page; the legacy RigidBody snapshot uses legacy-RigidBody.md to avoid a Windows path collision with Rigidbody.md. The editor's Help → Scripting API panel presents the same canonical content as the repository mirror. `script.sdk.read {query:"index"}` returns its addressable section index; a type/member query retrieves focused documentation and actual SDK source. Unknown queries explicitly report no matching implementation.

Canonical content: `engine/scripting/reference/catalog.json`. `node scripts/generate-scripting-reference.mjs` adds current declarations from the real SDK and writes the GitHub Markdown mirror. `--check` detects drift. Do not claim member support just because its Unity type is present.

## Audit scope and batches

[unity-6.3-inventory.json](unity-6.3-inventory.json) records all 5,429 navigation nodes in the official baseline TOC, including namespaces, groups and types. It records the source URL and SHA-256. `pending` means unimplemented; `partial` points to an Axiom page whose declarations and limitations define the actual supported surface. This is a complete TOC inventory, **not** a completed audit or implementation of every member page. Documentation prose, examples, layout code and icons in Axiom are original; Unity's navigation taxonomy and API signatures guide compatibility.

All nine areas now have executable coverage, including presentation, grid navigation/browser HTTP and platform/tooling. **All nine remain partial compared with their full Unity categories.** See [BATCHES.md](BATCHES.md) for exact scope and [the 0.0.48 status](STATUS_0_0_48.md) for remaining work, dependencies and migration boundaries. Release acceptance is not full-category completion.

## Important migration boundaries

- Namespace is `Axiom.Gameplay`; numbers remain `double` where the original SDK used doubles. Unity source can require adaptation.
- `Entity.Transform.Position/Rotation/Scale` preserve snapshot access. `transform.position/rotation/localScale` are live runtime properties.
- Lowercase `Vector3.forward` is +Z. Existing PascalCase `Forward` remains -Z; Axiom cameras look along local -Z.
- New lifecycle methods are public virtual overrides. Existing OnStart/OnUpdate/OnStop overrides remain valid; private Unity messages are not reflected.
- Instantiate clones descendants and serialized fields of compiled physical scripts, with normal startup for the new instances. Ray queries follow the engine's sphere/box collider baseline, not arbitrary rendered mesh geometry.
- Unsupported members are not success-returning stubs. Consult the exact page before assuming compatibility.
