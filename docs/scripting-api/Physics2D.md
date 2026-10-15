# Physics2D

Namespace: `Axiom.Gameplay`

## Description

Closest-hit 2D ray query. Origin/direction use Vector2; the result converts to bool when a collider was found. Only dimension-2 colliders participate.

## Use cases

Probe a 2D scene for walls or ground.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var hit = Physics2D.Raycast(new Vector2(0, 2), Vector2.down, 10);
if (hit) Debug.Log(hit.collider!.gameObject.name);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public static class Physics2D {
 public static RaycastHit2D Raycast(Vector2 origin,Vector2 direction,double distance=1000,int layerMask=-1){if(!Physics.Cast(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),out var hit,distance,layerMask,2))return default;return new(new Collider2D(hit.collider.Entity),hit.distance,new(hit.point.X,hit.point.Y),new(hit.normal.X,hit.normal.Y));}
}
```
