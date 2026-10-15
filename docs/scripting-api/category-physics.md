# Physics

Namespace: `Axiom.Gameplay`

## Description

Closest-hit 3D ray queries over the current script-visible body snapshot. The implementation mirrors the engine sphere/oriented-box query baseline and honors layer masks. It includes triggers.

## Use cases

Check the geometry below an entity before deciding a movement action.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
if (Physics.Raycast(transform.position + Vector3.up, Vector3.down, out var hit, 10)) {
 Debug.Log(hit.collider.gameObject.name);
 Debug.Log(hit.distance);
}
```

## Compatibility and limitations

# Physics

Axiom.Gameplay API reference. Unity naming baseline: Unity 6.3 LTS.

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.
