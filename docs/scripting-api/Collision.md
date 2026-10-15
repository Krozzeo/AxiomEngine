# Collision

Namespace: `Axiom.Gameplay`

## Description

Collision belongs to the physics API family. Consult the declarations below for the exact supported surface.

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

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public sealed class Collision {
 public Collider collider {get;}
 public GameObject gameObject=>collider.gameObject;
 public Vector3 normal {get;}
 public Vector3 point {get;}
 internal Collision(Collider collider,Vector3 normal,Vector3 point){this.collider=collider;this.normal=normal;this.point=point;}
}
```
