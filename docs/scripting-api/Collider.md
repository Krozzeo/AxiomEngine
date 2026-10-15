# Collider

Namespace: `Axiom.Gameplay`

## Description

Read facade for an existing 3D collider. isTrigger identifies a sensor; bounds exposes configured extents for inspection. Contact callbacks receive the other collider and its owner.

## Use cases

Identify a touched object or inspect the configured collision volume.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var collider = GetComponent<Collider>();
if (collider != null) Debug.Log(collider.isTrigger);
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds return the solver-aligned world AABB of configured spheres/boxes, including orientation. Collider half-extents are already world units and are not multiplied by visual Transform scale. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public class Collider : Component {
 internal Collider(Entity entity){Entity=entity;}
 internal System.Text.Json.JsonElement Data=>Context.EntityData[Entity.Id].GetProperty("collider");
 public bool isTrigger=>Data.GetProperty("trigger").GetBoolean();
 public Bounds bounds {get{var t=Entity.Transform;var h=Vector3.Read(Data.GetProperty("halfExtents"));var dimension=Data.GetProperty("dimension").GetInt32();Vector3 extents;if(Data.GetProperty("shape").GetString()=="sphere")extents=new(h.X,h.X,dimension==2?0:h.X);else{var x=t.Rotation*Vector3.right;var y=t.Rotation*Vector3.up;var z=t.Rotation*Vector3.forward;extents=new(Math.Abs(x.X)*h.X+Math.Abs(y.X)*h.Y+Math.Abs(z.X)*h.Z,Math.Abs(x.Y)*h.X+Math.Abs(y.Y)*h.Y+Math.Abs(z.Y)*h.Z,dimension==2?0:Math.Abs(x.Z)*h.X+Math.Abs(y.Z)*h.Y+Math.Abs(z.Z)*h.Z);}return new(t.Position,extents*2);}}
}
```
