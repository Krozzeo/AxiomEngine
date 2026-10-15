# Ray

Namespace: `Axiom.Gameplay`

## Description

Origin and direction data for a ray. GetPoint returns a world point at a distance along the normalized direction.

## Use cases

Visualize or reason about a directional probe.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var ray = new Ray(transform.position, Vector3.forward);
Debug.Log(ray.GetPoint(2));
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public readonly record struct Ray(Vector3 origin,Vector3 direction) {public Vector3 GetPoint(double distance)=>origin+direction.normalized*distance;}
```
