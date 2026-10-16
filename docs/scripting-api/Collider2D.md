# Collider2D

Namespace: `Axiom.Gameplay`

## Description

2D collider wrapper used by component lookup and 2D trigger/collision callbacks. The underlying collider must have dimension 2.

## Use cases

Inspect a platformer collision sensor.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var collider = GetComponent<Collider2D>();
if (collider != null) Debug.Log(collider.gameObject.name);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public class Collider2D : Collider {internal Collider2D(Entity entity):base(entity){}}
```
