# ADR 017 — Bounded CAD meshes and physical script components

Date: 2026-10-08. Decision implemented and accepted; CI 185 verifies all 28 jobs.

## Assets

Extend the immutable source/build/dependency pipeline rather than create a separate
CAD document store. OBJ/STL are bounded text/binary parsers. STEP/IGES use pinned
occt-import-js 0.0.23 in the same fixed-module worker: 15-second deadline, 128 MiB
V8 old-generation limit, 256 MiB maximum Wasm linear memory. Sources remain limited
to 8 MiB; output is at most 64 primitives/300,000 vertices. Worker success does not
publish authoring until captured project/revision validation succeeds.

CAD files tessellate in metres; source up-axis and user unitScale apply afterward.
Linear deflection is a bounding-box ratio; angular deflection is radians. Imported
assemblies become a flattened static renderable with multiple primitives. This
milestone imports geometry, not parametric CAD editing, constraints or an assembly
entity hierarchy. OBJ triangulates simple concave polygons, rejects invalid indices
and UVs, and does not fetch MTL or external resources. Normal generation is flat or
position-smoothed; duplicate/degenerate triangles are removed using a tolerance.

Process is an explicit undoable asset job. Center changes the geometry's local
pivot; its entity transform stays at the author-selected position. Generated LODs
cluster vertices at two grid resolutions and remove collapsed triangles; their
ratios are quality targets, not guaranteed triangle percentages. Tiny primitives
fall back to their original geometry so primitive/material correspondence survives.
Variants depend on the source asset's current build key: replacing/processing the
base invalidates dependents. Distance levels use 10 and 25 metres and remain editable.

Generated collision is a **centered axis-aligned bounding box**, not an exact
triangle mesh, convex decomposition, or hollow CAD collision. Enable Center first
when the geometry's bounds are off origin. Existing Collider/RigidBody semantics
apply afterward. Skinned/animated meshes are preserved on ordinary import and are
explicitly rejected by static processing. Dependency cycles/missing bases and
referenced-source deletion are rejected before publication.

Third-party source, licenses, rebuild/replacement instructions and the in-memory
Wasm maximum transformation are in THIRD_PARTY_NOTICES.md.

## Scripts and Inspector

Project C# files are authoritative. A file declares one concrete Script or
MonoBehaviour entry type; helper classes may share the file. Compiler sources stay
separate so using directives and file-scoped namespaces remain valid. Multiple
source classes compile together into one browser-Wasm bundle; an entity may attach
up to eight distinct sources, with 32 script instances per scene. Legacy Script and
Vec3/Quat remain supported; recompiling a legacy single-source project materializes
its file and per-entity attachments. Legacy Inspector cards resolve their physical Project source; the first field edit/removal materializes all old attachments together, preserving the other entities. Recompile once to enable live field snapshots in an older bundle.

Inspector metadata is a bounded declarative source parser, not the C# compiler or
a general reflection service. Supported instance fields are public, or non-public
with SerializeField; HideInInspector hides them. ReadOnly and readonly prevent
manual edits. Title/Header, Space, Tooltip and numeric Range control display.
Auto-properties, arbitrary generic collections, nested serializable classes and
computed initializers are outside this metadata grammar; use IDE for them.
Supported literals, constructors and common vector constants initialize Inspector
values; arbitrary initializers are not evaluated by the Inspector: attachment leaves them unset so the C# constructor retains its value. Before Play their controls show the type default with a tooltip; editing explicitly overrides the initializer. Runtime snapshots show the actual value.

Supported values: bool, string, byte/short/int/uint/long/float/double, enums,
Vector2/3/4, Vector2Int/3Int/4Int, Quaternion, Color/Color32, Rect and Bounds. Vec3/Quat
are compatibility aliases. Transform uses Vector3 and Quaternion in the SDK while
portable scene JSON retains numeric arrays. Values are bounded finite data; vectors
have exact arity, integer vectors exact integers, strings at most 4096 characters.

Attached values serialize independently on each entity. Source moves update their
paths; source edits reconcile unchanged compatible fields, initialize new/changed
fields and discard removed fields in the same undoable transaction. Delete requires
removing attachments first. Typed hydration uses rooted reflection in development
and AOT. Runtime field snapshots update only the runtime world; Inspector shows
readonly live values during Play, and Stop restores authoring values.

Play detects changed source hashes and compiles current Project sources before
starting. A daemon caller with stale/uncompiled physical scripts gets an explicit
compile-required error. Compiler failures preserve the last good build; legacy
explicit source compile supports the established development hot-reload contract.

IDE buffers are independent and never autosave on tab switch. Ctrl+S saves the
current source and project; Save All persists all buffers. Opening a source reopens
a closed IDE at center. Play/proposal flush restrictions preserve authoring authority.
