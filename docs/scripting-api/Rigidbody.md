# Rigidbody

Namespace: `Axiom.Gameplay`

## Description

Live 3D body facade over an existing entity Rigidbody. Velocity writes, MovePosition/MoveRotation and AddForce enqueue validated runtime operations. AddForce supports force, acceleration, impulse and direct velocity change.

## Use cases

Move a physical character or apply a jump impulse.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var body = GetComponent<Rigidbody>();
if (body != null) body.AddForce(Vector3.up * 3, ForceMode.Impulse);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public sealed class Rigidbody : Component {
 internal Rigidbody(Entity entity){Entity=entity;}
 public Vector3 linearVelocity {get=>Entity.RigidBody.Velocity;set=>Entity.SetVelocity(value);}
 public Vector3 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public Vector3 position {get=>Entity.Transform.Position;set=>Entity.SetPosition(value);}
 public void MovePosition(Vector3 position)=>Entity.SetPosition(position);
 public void MoveRotation(Quaternion rotation)=>Entity.SetRotation(rotation);
 public void AddForce(Vector3 force,ForceMode mode=ForceMode.Force){var data=Context.EntityData[Entity.Id].GetProperty("rigidBody");var mass=data.TryGetProperty("mass",out var m)?m.GetDouble():1;var acceleration=mode is ForceMode.Acceleration or ForceMode.VelocityChange?force:force/mass;linearVelocity+=acceleration*(mode is ForceMode.Impulse or ForceMode.VelocityChange?1:Time.deltaTime);}
}
```
