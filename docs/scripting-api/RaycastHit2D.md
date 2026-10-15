# RaycastHit2D

Namespace: `Axiom.Gameplay`

## Description

2D query result with optional collider, distance, point and normal. A miss has a null collider and converts to false.

## Use cases

Handle a missing ground hit explicitly.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var hit = Physics2D.Raycast(new Vector2(0, 2), Vector2.down, 10);
if (hit) Debug.Log(hit.distance);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public readonly record struct RaycastHit2D(Collider2D? collider,double distance,Vector2 point,Vector2 normal){public static implicit operator bool(RaycastHit2D hit)=>hit.collider!=null;}
```
