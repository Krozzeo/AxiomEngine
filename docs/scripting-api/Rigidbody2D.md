# Rigidbody2D

Namespace: `Axiom.Gameplay`

## Description

Rigidbody belongs to the physics API family. Consult the declarations below for the exact supported surface.

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
public sealed class Rigidbody2D : Component {
 internal Rigidbody2D(Entity entity){Entity=entity;}
 public Vector2 linearVelocity {get{var v=Entity.RigidBody.Velocity;return new(v.X,v.Y);}set{var v=Entity.RigidBody.Velocity;Entity.SetVelocity(new Vector3(value.X,value.Y,v.Z));}}
 public Vector2 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public Vector2 position {get{var p=transform.position;return new(p.X,p.Y);}set{var p=transform.position;transform.position=new Vector3(value.X,value.Y,p.Z);}}
 public void MovePosition(Vector2 position){this.position=position;}
 public void AddForce(Vector2 force,ForceMode2D mode=ForceMode2D.Force)=>new Rigidbody(Entity).AddForce(new Vector3(force.X,force.Y,0),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);
}
```
