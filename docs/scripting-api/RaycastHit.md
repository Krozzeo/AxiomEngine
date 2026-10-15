# RaycastHit

Namespace: `Axiom.Gameplay`

## Description

A successful 3D ray result: collider, distance, world point, normal and target transform. Use only when Physics.Raycast returned true.

## Use cases

Identify the hit entity and measure distance.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
if (Physics.Raycast(transform.position, Vector3.down, out var hit, 10)) Debug.Log(hit.point);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public readonly record struct RaycastHit(Collider collider,double distance,Vector3 point,Vector3 normal) {public Transform transform=>collider.transform;}
```
