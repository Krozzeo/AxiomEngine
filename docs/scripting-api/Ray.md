# Ray

Namespace: `Axiom.Gameplay`

## Description

Ray belongs to the physics API family. Consult the declarations below for the exact supported surface.

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
public readonly record struct Ray(Vector3 origin,Vector3 direction) {public Vector3 GetPoint(double distance)=>origin+direction.normalized*distance;}
```
