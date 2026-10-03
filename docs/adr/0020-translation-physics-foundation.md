# ADR-0020 — Translational CPU/Wasm physics foundation

Status: accepted. Extends ADR-0009; master specification section 126.

Implement an owned Rust solver in axiom-core, shared by native tests and scalar
Wasm exports. Use 60 Hz fixed steps, stable x-axis sweep ordering and insertion
index tie breaks, exact sphere/sphere, sphere/AABB and AABB/AABB narrow phases,
linear impulses, Coulomb friction and penetration correction. 2D uses XY and
ignores Z for collision; 2D/3D bodies never interact. Both layer/mask directions
must allow contact. Triggers report contact without resolving it.

This foundation deliberately supports translational bodies only. Boxes are
world-axis aligned and collider half extents are explicit world units, independent
of visual rotation/scale. Circle/sphere radius uses halfExtents[0]. A missing
RigidBody makes a collider static. Constraints, angular dynamics, rotated boxes,
continuous collision detection, character-controller guarantees and GPU kernels
are later extensions, not claimed here. Fast bodies can tunnel through thin
geometry; demos use bounded speeds and thick obstacles.

Deterministic testing means explicit fixed-step counts, stable entity ID order
and repeatable results for identical inputs on a given backend. Cross-platform
bit-identical floating point is not promised. Native and Wasm golden scenes use
identical physical expectations. Real-time catch-up remains capped at eight steps.

Play owns a private runtime. C# may read velocity and emit validated velocity or
position changes; Rust integrates physics after each script update. Authoring,
proposal acceptance and Save never capture transient simulation positions.
Generated RigidBody bindings preserve the existing replaceable runtime boundary.

Bound the world to 256 bodies and expose at most 128 contacts per diagnostic
snapshot, including omitted counts. Benchmark reports identify host/bridge costs.
No GPU migration is justified by the present separated-body baseline.
