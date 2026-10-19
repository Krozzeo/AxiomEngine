# Collider

Collider trigger/enabled controls, world AABB bounds, closest point, own-shape ray query and attachedRigidbody. One collider per entity; parent-body compound aggregation and center offsets are pending.

## Implemented declarations

```csharp
public class Collider : Component {
 internal Collider(Entity entity){Entity=entity;}
 internal JsonElement Data=>Context.EntityData[Entity.Id].GetProperty("collider");
 public bool isTrigger {get=>Data.GetProperty("trigger").GetBoolean();set=>PhysicsData.Set(Entity,"collider","trigger",JsonValue.Create(value)!);}
 public bool enabled {get=>ComponentActivation.Read(Entity,"collider")&&(!Context.EntityData[Entity.Id].TryGetProperty("runtimeColliderEnabled",out var v)||v.GetBoolean());set{ComponentActivation.Write(Entity,"collider",value);Context.Property(Entity,"runtimeColliderEnabled",JsonValue.Create(value));}}
 public Rigidbody? attachedRigidbody=>gameObject.GetComponent<Rigidbody>();
 public Bounds bounds {get{var t=Entity.Transform;var h=PhysicsData.Half(Entity);var dim=Data.GetProperty("dimension").GetInt32();Vector3 extents;if(Data.GetProperty("shape").GetString()=="sphere")extents=new(h.X,h.X,dim==2?0:h.X);else{var x=t.Rotation*Vector3.right;var y=t.Rotation*Vector3.up;var z=t.Rotation*Vector3.forward;extents=new(Math.Abs(x.X)*h.X+Math.Abs(y.X)*h.Y+Math.Abs(z.X)*h.Z,Math.Abs(x.Y)*h.X+Math.Abs(y.Y)*h.Y+Math.Abs(z.Y)*h.Z,dim==2?0:Math.Abs(x.Z)*h.X+Math.Abs(y.Z)*h.Y+Math.Abs(z.Z)*h.Z);}return new(t.Position,extents*2);}}
 public Vector3 ClosestPoint(Vector3 position)=>PhysicsQueries.Closest(this,position);
 public bool Raycast(Ray ray,out RaycastHit hit,double maxDistance)=>PhysicsQueries.Ray(this,ray.origin,ray.direction,maxDistance,out hit);
}
```
