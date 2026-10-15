# ForceMode

Namespace: `Axiom.Gameplay`

## Description

Selects how Rigidbody.AddForce changes velocity: Force divides by mass and integrates over deltaTime; Acceleration omits mass; Impulse divides by mass without a time factor; VelocityChange omits both.

## Use cases

Apply an instantaneous jump or a sustained acceleration.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var body = GetComponent<Rigidbody>();
if (body != null) body.AddForce(Vector3.up * 5, ForceMode.VelocityChange);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public enum ForceMode {Force,Acceleration,Impulse,VelocityChange}
```
