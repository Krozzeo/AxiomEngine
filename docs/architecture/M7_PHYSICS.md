# M7 — Physics foundation

See ADR-0020 for solver scope and numerical limits. Canonical project entities
can carry `collider` and `rigidBody` components. Collider requires dimension (2/3),
shape (box/sphere), positive halfExtents, trigger, layer and mask. RigidBody
requires positive mass, velocity, restitution, friction and gravityScale.
Collider without RigidBody is static. Removing Collider removes RigidBody too.
Project validation limits worlds to 256 colliders and rejects invalid booleans,
mask bounds and orphan rigid bodies.

`scene.collider.set` and `scene.rigidBody.set` are revision-checked authoring
commands. Agents must provide workspaceId, preserving M6 proposal isolation.
`scene.component.remove`, entity queries and API introspection include the new
components. Save/undo/redo use existing scene transactions.

The Physics Inspector edits collider type, dimensionality, motion, trigger,
half extents, mass and layer/mask. Additional material/velocity properties are
available through semantic commands. Dimensions are world units; visual scale
and rotation do not rotate or resize the collider. This is a translational
foundation, not a full rigid-body angular solver.

During Play, Rust integrates at 60 Hz with an eight-step catch-up cap. Scripts
run before physics. `Entity.RigidBody.Velocity` reads the last runtime velocity;
`Entity.SetVelocity(Vec3)` emits a validated change. Teleports use existing
SetPosition. Spawn preserves existing body velocities and initializes the new
body; the compiler rebuilds stable body indices. Contact diagnostics and backend
reason are available in Frame Diagnostics; runtime.status carries bounded counts.

The Wasm host exposes configurePhysics, physicsSnapshot, stepPhysics(count),
setVelocities and raycast. Raycast returns the closest entity and distance,
includes triggers, applies the query layer mask and filters 2D/3D dimensions.
Explicit stepPhysics is deterministic test mode; normal Play uses the kernel
fixed clock. Tests use the actual Rust/Wasm module, never a JS solver fallback.

Run `node scripts/benchmarks/physics.mjs` after a build for 16/64/256-body costs.
The report includes scalar snapshot overhead and separated-body broad-phase
counts; it is not a dense-contact or GPU benchmark. Golden tests check falls,
contacts, filters, impulse response, raycasts and repeatability.
