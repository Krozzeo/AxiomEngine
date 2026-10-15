# Physics2D

Namespace: `Axiom.Gameplay`

## Description

2D closest-hit queries against current script-visible physics geometry.

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
public static class Physics2D {
 public static RaycastHit2D Raycast(Vector2 origin,Vector2 direction,double distance=1000,int layerMask=-1){if(!Physics.Cast(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),out var hit,distance,layerMask,2))return default;return new(new Collider2D(hit.collider.Entity),hit.distance,new(hit.point.X,hit.point.Y),new(hit.normal.X,hit.normal.Y));}
}
```
