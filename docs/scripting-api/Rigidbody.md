# Rigidbody

Namespace: `Axiom.Gameplay`

## Description

Rigidbody belongs to the physics API family. Consult the declarations below for the exact supported surface.

## Use cases

Destroy a pickup on trigger contact.

## Example

```csharp
using Axiom.Gameplay;
public override void OnTriggerEnter(Collider other) {
 if (other.gameObject.name == "Player") Destroy(gameObject);
}
// For a 2D scene use OnTriggerEnter2D(Collider2D other).
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds are conservative local half-extents with scale and do not yet expose a rotated world AABB. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


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
