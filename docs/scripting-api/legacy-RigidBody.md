# RigidBody

Namespace: `Axiom.Gameplay`

## Description

Legacy immutable velocity snapshot. Reading it does not provide a writable component; use Entity.SetVelocity or the live Rigidbody/Rigidbody2D facade to mutate the body.

## Use cases

Preserve vertical speed in existing Axiom controllers.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var velocity = Entity.RigidBody.Velocity;
Entity.SetVelocity(new Vector3(2, velocity.Y, velocity.Z));
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public readonly record struct RigidBody(Vector3 Velocity) {
 internal static RigidBody Read(JsonElement value) => new(Vector3.Read(value.GetProperty("velocity")));
}
```
