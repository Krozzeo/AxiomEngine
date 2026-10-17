using System.Text.Json;
using System.Text.Json.Nodes;
namespace Axiom.Gameplay;

internal static class PhysicsData {
 internal static void VelocityData(Entity e,Vector3 velocity){var node=JsonNode.Parse(Context.EntityData[e.Id].GetRawText())!.AsObject();node["rigidBody"]!["velocity"]=new JsonArray(velocity.X,velocity.Y,velocity.Z);Context.EntityData[e.Id]=Context.ParseData(node.ToJsonString());}
 internal static JsonElement Body(Entity e){_=Context.Read(e);return Context.EntityData[e.Id].GetProperty("rigidBody");}
 internal static double Number(Entity e,string key,double fallback=0)=>Body(e).TryGetProperty(key,out var v)?v.GetDouble():fallback;
 internal static bool Kinematic(Entity e)=>Context.EntityData[e.Id].TryGetProperty("runtimeKinematic",out var v)&&v.GetBoolean();
 internal static void Set(Entity e,string component,string key,JsonNode value){var data=JsonNode.Parse(Context.EntityData[e.Id].GetProperty(component).GetRawText())!.AsObject();if(JsonNode.DeepEquals(data[key],value))return;data[key]=value;Context.Property(e,component,data);}
 internal static void Number(Entity e,string key,double value,double min,double max){if(!double.IsFinite(value)||value<min||value>max)throw new ArgumentOutOfRangeException(key);Set(e,"rigidBody",key,JsonValue.Create(value)!);}
 internal static Vector3 Half(Entity e)=>Vector3.Read(Context.EntityData[e.Id].GetProperty("collider").GetProperty("halfExtents"));
 internal static void Half(Entity e,Vector3 value){Finite(value);if(value.X<=0||value.Y<=0||value.Z<=0||Math.Max(value.X,Math.Max(value.Y,value.Z))>10000)throw new ArgumentOutOfRangeException(nameof(value));Set(e,"collider","halfExtents",new JsonArray(value.X,value.Y,value.Z));}
 internal static void Finite(Vector3 v){if(!double.IsFinite(v.X)||!double.IsFinite(v.Y)||!double.IsFinite(v.Z))throw new ArgumentException("Physics vector must be finite");}
 internal static bool CanForce(Entity e){if(!Context.IsActive(e.Id)||Context.EntityData[e.Id].TryGetProperty("runtimeSimulated",out var sim)&&!sim.GetBoolean()||Kinematic(e)||Context.EntityData[e.Id].TryGetProperty("runtimeStatic",out var s)&&s.GetBoolean())return false;if(Body(e).TryGetProperty("sleeping",out var sleep)&&sleep.GetBoolean())Set(e,"rigidBody","sleeping",JsonValue.Create(false)!);return true;}
 internal static Vector3 Angular(Entity e)=>Body(e).TryGetProperty("angularVelocity",out var v)?Vector3.Read(v):Vector3.zero;
 internal static void Angular(Entity e,Vector3 v){Finite(v);if(Context.EntityData[e.Id].TryGetProperty("runtimeStatic",out var fixedBody)&&fixedBody.GetBoolean()&&v.sqrMagnitude>0)return;if(v.sqrMagnitude>0&&Body(e).TryGetProperty("sleeping",out var sleep)&&sleep.GetBoolean())Set(e,"rigidBody","sleeping",JsonValue.Create(false)!);if(Math.Max(Math.Abs(v.X),Math.Max(Math.Abs(v.Y),Math.Abs(v.Z)))>10000)throw new ArgumentOutOfRangeException(nameof(v));var data=JsonNode.Parse(Body(e).GetRawText())!.AsObject();data["angularVelocity"]=new JsonArray(v.X,v.Y,v.Z);var node=JsonNode.Parse(Context.EntityData[e.Id].GetRawText())!.AsObject();node["rigidBody"]=data;Context.EntityData[e.Id]=Context.ParseData(node.ToJsonString());Context.Add(new("angularVelocity",e.Id,null,v,null));}
 internal static Vector3 InverseInertia(Entity e,Vector3 torque){var data=Body(e);if(data.TryGetProperty("freezeRotation",out var frozen)&&frozen.GetBoolean())return Vector3.zero;var activeCollider=!Context.EntityData[e.Id].TryGetProperty("runtimeColliderEnabled",out var enabled)||enabled.GetBoolean();var h=activeCollider&&Context.EntityData[e.Id].TryGetProperty("collider",out _)?Half(e):new Vector3(.5,.5,.5);var collider=activeCollider&&Context.EntityData[e.Id].TryGetProperty("collider",out var c)?c:default;var twoD=collider.ValueKind==JsonValueKind.Object?collider.GetProperty("dimension").GetInt32()==2:Context.EntityData[e.Id].TryGetProperty("runtimePhysicsDimension",out var dim)&&dim.GetInt32()==2;var sphere=collider.ValueKind==JsonValueKind.Object&&collider.GetProperty("shape").GetString()=="sphere";var mass=Number(e,"mass",1);var r=e.Transform.Rotation;var local=Quaternion.Inverse(r)*torque;Vector3 inverse;if(twoD)inverse=new(0,0,sphere?2/(mass*h.X*h.X):3/(mass*(h.X*h.X+h.Y*h.Y)));else if(sphere)inverse=Vector3.one*(2.5/(mass*h.X*h.X));else inverse=new(3/(mass*(h.Y*h.Y+h.Z*h.Z)),3/(mass*(h.X*h.X+h.Z*h.Z)),3/(mass*(h.X*h.X+h.Y*h.Y)));return r*new Vector3(local.X*inverse.X,local.Y*inverse.Y,local.Z*inverse.Z);}
}
public sealed partial class Rigidbody : Component {
 internal Rigidbody(Entity entity){Entity=entity;}
 public Vector3 linearVelocity {get=>Entity.RigidBody.Velocity;set=>Entity.SetVelocity(value);}
 public Vector3 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public Vector3 angularVelocity {get=>PhysicsData.Angular(Entity);set=>PhysicsData.Angular(Entity,value);}
 public double mass {get=>PhysicsData.Number(Entity,"mass",1);set=>PhysicsData.Number(Entity,"mass",value,.001,1000000);}
 public bool useGravity {get=>PhysicsData.Number(Entity,"gravityScale",1)!=0;set=>PhysicsData.Number(Entity,"gravityScale",value?1:0,-100,100);}
 public bool isKinematic {get=>PhysicsData.Kinematic(Entity);set=>Context.Property(Entity,"runtimeKinematic",JsonValue.Create(value));}
 public bool freezeRotation {get=>PhysicsData.Body(Entity).TryGetProperty("freezeRotation",out var v)&&v.GetBoolean();set=>PhysicsData.Set(Entity,"rigidBody","freezeRotation",JsonValue.Create(value)!);}
 public Vector3 position {get=>transform.position;set=>transform.position=value;}
 public Quaternion rotation {get=>transform.rotation;set=>transform.rotation=value;}
 public Vector3 worldCenterOfMass=>position;
 public void MovePosition(Vector3 value)=>position=value;
 public void MoveRotation(Quaternion value)=>rotation=value;
 public Vector3 GetPointVelocity(Vector3 worldPoint)=>linearVelocity+Vector3.Cross(angularVelocity,worldPoint-position);
 public Vector3 GetRelativePointVelocity(Vector3 localPoint)=>GetPointVelocity(transform.TransformPoint(localPoint));
 public void AddForce(Vector3 force,ForceMode mode=ForceMode.Force){PhysicsData.Finite(force);if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");if(!PhysicsData.CanForce(Entity))return;var change=mode is ForceMode.Acceleration or ForceMode.VelocityChange?force:force/mass;linearVelocity+=change*(mode is ForceMode.Impulse or ForceMode.VelocityChange?1:Time.fixedDeltaTime);}
 public void AddForce(double x,double y,double z,ForceMode mode=ForceMode.Force)=>AddForce(new(x,y,z),mode);
 public void AddRelativeForce(Vector3 force,ForceMode mode=ForceMode.Force)=>AddForce(rotation*force,mode);
 public void AddTorque(Vector3 torque,ForceMode mode=ForceMode.Force){PhysicsData.Finite(torque);if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");if(!PhysicsData.CanForce(Entity)||freezeRotation)return;var change=mode is ForceMode.Acceleration or ForceMode.VelocityChange?torque:PhysicsData.InverseInertia(Entity,torque);angularVelocity+=change*(mode is ForceMode.Impulse or ForceMode.VelocityChange?1:Time.fixedDeltaTime);}
 public void AddRelativeTorque(Vector3 torque,ForceMode mode=ForceMode.Force)=>AddTorque(rotation*torque,mode);
 public void AddForceAtPosition(Vector3 force,Vector3 position,ForceMode mode=ForceMode.Force){PhysicsData.Finite(position);AddForce(force,mode);AddTorque(Vector3.Cross(position-this.position,force),mode);}
}
public enum ForceMode2D {Force,Impulse}
public enum RigidbodyType2D {Dynamic,Kinematic,Static}
public sealed partial class Rigidbody2D : Component {
 internal Rigidbody2D(Entity entity){Entity=entity;}
 private Rigidbody Body=>new(Entity);
 public Vector2 linearVelocity {get{var v=Body.linearVelocity;return new(v.X,v.Y);}set=>Body.linearVelocity=new(value.X,value.Y,0);}
 public Vector2 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public double angularVelocity {get=>Body.angularVelocity.Z*180/Math.PI;set=>Body.angularVelocity=new(0,0,value*Math.PI/180);}
 public double mass {get=>Body.mass;set=>Body.mass=value;}
 public double gravityScale {get=>PhysicsData.Number(Entity,"gravityScale",1);set=>PhysicsData.Number(Entity,"gravityScale",value,-100,100);}
 public bool freezeRotation {get=>Body.freezeRotation;set=>Body.freezeRotation=value;}
 public RigidbodyType2D bodyType {get=>Context.EntityData[Entity.Id].TryGetProperty("runtimeStatic",out var s)&&s.GetBoolean()?RigidbodyType2D.Static:Body.isKinematic?RigidbodyType2D.Kinematic:RigidbodyType2D.Dynamic;set{if(!Enum.IsDefined(value))throw new ArgumentException("Invalid body type");Context.Property(Entity,"runtimeStatic",JsonValue.Create(value==RigidbodyType2D.Static));Body.isKinematic=value==RigidbodyType2D.Kinematic;if(value==RigidbodyType2D.Static){Body.linearVelocity=Vector3.zero;Body.angularVelocity=Vector3.zero;}}}
 public bool isKinematic {get=>Body.isKinematic;set=>bodyType=value?RigidbodyType2D.Kinematic:RigidbodyType2D.Dynamic;}
 public Vector2 position {get{var p=transform.position;return new(p.X,p.Y);}set=>transform.position=new(value.X,value.Y,transform.position.Z);}
 public double rotation {get{var q=transform.rotation;return 2*Math.Atan2(q.Z,q.W)*180/Math.PI;}set=>transform.rotation=Quaternion.Euler(0,0,value);}
 public void MovePosition(Vector2 value)=>position=value;
 public void MoveRotation(double angle)=>rotation=angle;
 public Vector2 GetPointVelocity(Vector2 point){var v=Body.GetPointVelocity(new(point.X,point.Y,transform.position.Z));return new(v.X,v.Y);}
 public void AddForce(Vector2 force,ForceMode2D mode=ForceMode2D.Force){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");Body.AddForce(new(force.X,force.Y,0),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);}
 public void AddRelativeForce(Vector2 force,ForceMode2D mode=ForceMode2D.Force){var v=transform.rotation*new Vector3(force.X,force.Y,0);AddForce(new(v.X,v.Y),mode);}
 public void AddTorque(double torque,ForceMode2D mode=ForceMode2D.Force){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");Body.AddTorque(new(0,0,torque),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);}
 public void AddForceAtPosition(Vector2 force,Vector2 position,ForceMode2D mode=ForceMode2D.Force){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");Body.AddForceAtPosition(new(force.X,force.Y,0),new(position.X,position.Y,transform.position.Z),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);}
}
public class Collider : Component {
 internal Collider(Entity entity){Entity=entity;}
 internal JsonElement Data=>Context.EntityData[Entity.Id].GetProperty("collider");
 public bool isTrigger {get=>Data.GetProperty("trigger").GetBoolean();set=>PhysicsData.Set(Entity,"collider","trigger",JsonValue.Create(value)!);}
 public bool enabled {get=>!Context.EntityData[Entity.Id].TryGetProperty("runtimeColliderEnabled",out var v)||v.GetBoolean();set=>Context.Property(Entity,"runtimeColliderEnabled",JsonValue.Create(value));}
 public Rigidbody? attachedRigidbody=>gameObject.GetComponent<Rigidbody>();
 public Bounds bounds {get{var t=Entity.Transform;var h=PhysicsData.Half(Entity);var dim=Data.GetProperty("dimension").GetInt32();Vector3 extents;if(Data.GetProperty("shape").GetString()=="sphere")extents=new(h.X,h.X,dim==2?0:h.X);else{var x=t.Rotation*Vector3.right;var y=t.Rotation*Vector3.up;var z=t.Rotation*Vector3.forward;extents=new(Math.Abs(x.X)*h.X+Math.Abs(y.X)*h.Y+Math.Abs(z.X)*h.Z,Math.Abs(x.Y)*h.X+Math.Abs(y.Y)*h.Y+Math.Abs(z.Y)*h.Z,dim==2?0:Math.Abs(x.Z)*h.X+Math.Abs(y.Z)*h.Y+Math.Abs(z.Z)*h.Z);}return new(t.Position,extents*2);}}
 public Vector3 ClosestPoint(Vector3 position)=>PhysicsQueries.Closest(this,position);
 public bool Raycast(Ray ray,out RaycastHit hit,double maxDistance)=>PhysicsQueries.Ray(this,ray.origin,ray.direction,maxDistance,out hit);
}
public class Collider2D : Collider {internal Collider2D(Entity entity):base(entity){} public new Rigidbody2D? attachedRigidbody=>gameObject.GetComponent<Rigidbody2D>();public Vector2 ClosestPoint(Vector2 position){var p=base.ClosestPoint(new(position.X,position.Y,transform.position.Z));return new(p.X,p.Y);}}
public readonly record struct ContactPoint(Vector3 point,Vector3 normal,double separation,Collider thisCollider,Collider otherCollider);
public readonly record struct ContactPoint2D(Vector2 point,Vector2 normal,double separation,Collider2D collider,Collider2D otherCollider);
public sealed class Collision {
 public Collider collider {get;}public GameObject gameObject=>collider.gameObject;public Transform transform=>collider.transform;public Rigidbody? rigidbody=>collider.attachedRigidbody;
 public Vector3 normal {get;}public Vector3 point {get;}public Vector3 relativeVelocity {get;}
 public ContactPoint[] contacts {get;}public int contactCount=>contacts.Length;
 public ContactPoint GetContact(int index)=>contacts[index];public int GetContacts(ContactPoint[] buffer){var count=Math.Min(buffer.Length,contacts.Length);Array.Copy(contacts,buffer,count);return count;}
 internal Collision(Collider collider,Vector3 normal,Vector3 point,ContactPoint[] contacts,Vector3 relativeVelocity){this.collider=collider;this.normal=normal;this.point=point;this.contacts=contacts;this.relativeVelocity=relativeVelocity;}
}
public sealed class Collision2D {
 public Collider2D collider {get;}public GameObject gameObject=>collider.gameObject;public Transform transform=>collider.transform;public Rigidbody2D? rigidbody=>collider.attachedRigidbody;
 public Vector2 normal {get;}public Vector2 point {get;}public Vector2 relativeVelocity {get;}
 public ContactPoint2D[] contacts {get;}public int contactCount=>contacts.Length;
 public ContactPoint2D GetContact(int index)=>contacts[index];public int GetContacts(ContactPoint2D[] buffer){var count=Math.Min(buffer.Length,contacts.Length);Array.Copy(contacts,buffer,count);return count;}
 internal Collision2D(Collider2D collider,Vector3 normal,Vector3 point,ContactPoint2D[] contacts,Vector3 relativeVelocity){this.collider=collider;this.normal=new(normal.X,normal.Y);this.point=new(point.X,point.Y);this.contacts=contacts;this.relativeVelocity=new(relativeVelocity.X,relativeVelocity.Y);}
}
public readonly record struct Ray(Vector3 origin,Vector3 direction) {public Vector3 GetPoint(double distance)=>origin+direction.normalized*distance;}
public readonly record struct RaycastHit(Collider collider,double distance,Vector3 point,Vector3 normal) {public Transform transform=>collider.transform;public Rigidbody? rigidbody=>collider.attachedRigidbody;}
public readonly record struct RaycastHit2D(Collider2D? collider,double distance,Vector2 point,Vector2 normal){public static implicit operator bool(RaycastHit2D hit)=>hit.collider!=null;public Transform? transform=>collider?.transform;public Rigidbody2D? rigidbody=>collider?.attachedRigidbody;}
public enum QueryTriggerInteraction {UseGlobal,Ignore,Collide}
internal static class PhysicsQueries {
 internal static Collider[] Candidates(int dimension,int mask,bool triggers)=>Context.EntityData.OrderBy(p=>p.Key,StringComparer.Ordinal).Where(p=>Context.IsActive(p.Key)&&(!p.Value.TryGetProperty("runtimeSimulated",out var simulated)||simulated.GetBoolean())&&p.Value.TryGetProperty("collider",out var c)&&c.GetProperty("dimension").GetInt32()==dimension&&(c.GetProperty("layer").GetUInt32()&unchecked((uint)mask))!=0&&(triggers||!c.GetProperty("trigger").GetBoolean())&&(!p.Value.TryGetProperty("runtimeColliderEnabled",out var on)||on.GetBoolean())).Select(p=>new GameObject(new Entity(p.Key,Context.Generation)).GetComponent<Collider>()!).ToArray();
 internal static bool Triggers(QueryTriggerInteraction value)=>value switch {QueryTriggerInteraction.UseGlobal=>Physics.queriesHitTriggers,QueryTriggerInteraction.Ignore=>false,QueryTriggerInteraction.Collide=>true,_=>throw new ArgumentException("Invalid trigger policy")};
 internal static Vector3 Closest(Collider c,Vector3 point){PhysicsData.Finite(point);var t=c.Entity.Transform;var half=PhysicsData.Half(c.Entity);var offset=point-t.Position;var dim=c.Data.GetProperty("dimension").GetInt32();if(dim==2)offset.Z=0;if(c.Data.GetProperty("shape").GetString()=="sphere"){var length=offset.magnitude;return t.Position+(length<=half.X?offset:offset*(half.X/length));}var p=Quaternion.Inverse(t.Rotation)*offset;return t.Position+t.Rotation*new Vector3(Math.Clamp(p.X,-half.X,half.X),Math.Clamp(p.Y,-half.Y,half.Y),dim==2?0:Math.Clamp(p.Z,-half.Z,half.Z));}
 internal static double Distance(double value){if(double.IsPositiveInfinity(value))return 4000000;if(!double.IsFinite(value)||value<0)throw new ArgumentException("Invalid query distance");return value;}
 internal static bool Ray(Collider c,Vector3 origin,Vector3 direction,double maxDistance,out RaycastHit hit){hit=default;PhysicsData.Finite(origin);PhysicsData.Finite(direction);maxDistance=Distance(maxDistance);if(!c.enabled||!c.gameObject.activeInHierarchy)return false;var dimension=c.Data.GetProperty("dimension").GetInt32();if(dimension==2)direction.Z=0;if(direction.sqrMagnitude<1e-24)return false;direction=direction.normalized;var t=c.Entity.Transform;var half=PhysicsData.Half(c.Entity);var relative=origin-t.Position;double distance;Vector3 normal;
  if(c.Data.GetProperty("shape").GetString()=="sphere"){if(dimension==2)relative.Z=0;var squared=relative.sqrMagnitude-half.X*half.X;var q=Vector3.Dot(relative,direction);var discriminant=q*q-squared;if(squared<=0){distance=0;normal=-direction;}else{if(discriminant<0)return false;distance=-q-Math.Sqrt(discriminant);if(distance<0)return false;var delta=relative+direction*distance;normal=delta.normalized;}}
  else{var inverse=Quaternion.Inverse(t.Rotation);var o=inverse*relative;var d=inverse*direction;var a=new[]{o.X,o.Y,o.Z};var b=new[]{d.X,d.Y,d.Z};var h=new[]{half.X,half.Y,half.Z};var near=0.0;var far=maxDistance;var localNormal=inverse*(-direction);for(var axis=0;axis<dimension;axis++){if(Math.Abs(b[axis])<1e-12){if(Math.Abs(a[axis])>h[axis])return false;}else{var x=(-h[axis]-a[axis])/b[axis];var y=(h[axis]-a[axis])/b[axis];var lower=Math.Min(x,y);if(lower>near){near=lower;localNormal=axis==0?new(-Math.Sign(b[axis]),0,0):axis==1?new(0,-Math.Sign(b[axis]),0):new(0,0,-Math.Sign(b[axis]));}far=Math.Min(far,Math.Max(x,y));}}if(near>far)return false;distance=near;normal=t.Rotation*localNormal;}
  if(distance>maxDistance)return false;hit=new(c,distance,origin+direction*distance,normal);return true;
 }
 internal static RaycastHit[] Rays(Vector3 origin,Vector3 direction,double max,int mask,int dimension,bool triggers){PhysicsData.Finite(origin);PhysicsData.Finite(direction);max=Distance(max);var hits=new List<RaycastHit>();foreach(var c in Candidates(dimension,mask,triggers))if(Ray(c,origin,direction,max,out var hit))hits.Add(hit);return hits.OrderBy(h=>h.distance).ThenBy(h=>h.collider.Entity.Id,StringComparer.Ordinal).ToArray();}
 internal static Collider[] Sphere(Vector3 center,double radius,int mask,int dimension,bool triggers){PhysicsData.Finite(center);if(!double.IsFinite(radius)||radius<0)throw new ArgumentException("Invalid query radius");return Candidates(dimension,mask,triggers).Where(c=>{var p=Closest(c,center)-center;if(dimension==2)p.Z=0;return p.sqrMagnitude<=radius*radius+1e-12;}).ToArray();}
 internal static bool Boxes(Vector3 a,Vector3 ah,Quaternion ar,Vector3 b,Vector3 bh,Quaternion br,int dimension){var aa=new[]{ar*Vector3.right,ar*Vector3.up,ar*Vector3.forward};var ba=new[]{br*Vector3.right,br*Vector3.up,br*Vector3.forward};var axes=new List<Vector3>();axes.AddRange(aa.Take(dimension));axes.AddRange(ba.Take(dimension));if(dimension==3)foreach(var x in aa)foreach(var y in ba){var n=Vector3.Cross(x,y);if(n.sqrMagnitude>1e-12)axes.Add(n.normalized);}var h=new[]{ah.X,ah.Y,ah.Z};var k=new[]{bh.X,bh.Y,bh.Z};foreach(var n in axes){var ra=0.0;var rb=0.0;for(var i=0;i<dimension;i++){ra+=h[i]*Math.Abs(Vector3.Dot(aa[i],n));rb+=k[i]*Math.Abs(Vector3.Dot(ba[i],n));}if(Math.Abs(Vector3.Dot(b-a,n))>ra+rb+1e-10)return false;}return true;}
 internal static Collider[] Box(Vector3 center,Vector3 half,Quaternion rotation,int mask,int dimension,bool triggers){PhysicsData.Finite(center);PhysicsData.Finite(half);var norm=rotation.X*rotation.X+rotation.Y*rotation.Y+rotation.Z*rotation.Z+rotation.W*rotation.W;if(half.X<0||half.Y<0||half.Z<0||!double.IsFinite(norm)||norm<1e-12)throw new ArgumentException("Invalid query box");var length=Math.Sqrt(norm);rotation=new(rotation.X/length,rotation.Y/length,rotation.Z/length,rotation.W/length);return Candidates(dimension,mask,triggers).Where(c=>{var t=c.Entity.Transform;var h=PhysicsData.Half(c.Entity);if(c.Data.GetProperty("shape").GetString()!="sphere")return Boxes(center,half,rotation,t.Position,h,t.Rotation,dimension);var p=Quaternion.Inverse(rotation)*(t.Position-center);var d=p-new Vector3(Math.Clamp(p.X,-half.X,half.X),Math.Clamp(p.Y,-half.Y,half.Y),dimension==2?p.Z:Math.Clamp(p.Z,-half.Z,half.Z));return d.sqrMagnitude<=h.X*h.X+1e-12;}).ToArray();}
 internal static int Fill<T>(T[] source,T[] buffer){ArgumentNullException.ThrowIfNull(buffer);var count=Math.Min(source.Length,buffer.Length);Array.Copy(source,buffer,count);return count;}
 internal static RaycastHit2D Hit2D(RaycastHit hit)=>new(new Collider2D(hit.collider.Entity),hit.distance,new(hit.point.X,hit.point.Y),new(hit.normal.X,hit.normal.Y));
}
public static partial class Physics {
 public const int AllLayers=-1;public const int IgnoreRaycastLayer=4;public const int DefaultRaycastLayers=~IgnoreRaycastLayer;
 public static bool queriesHitTriggers {get;set;}=true;
 public static bool Raycast(Vector3 origin,Vector3 direction,out RaycastHit hit,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal){var all=RaycastAll(origin,direction,maxDistance,layerMask,queryTriggerInteraction);hit=all.FirstOrDefault();return all.Length>0;}
 public static bool Raycast(Vector3 origin,Vector3 direction,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(origin,direction,out _,maxDistance,layerMask,queryTriggerInteraction);
 public static bool Raycast(Ray ray,out RaycastHit hit,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(ray.origin,ray.direction,out hit,maxDistance,layerMask,queryTriggerInteraction);
 public static bool Raycast(Ray ray,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(ray,out _,maxDistance,layerMask,queryTriggerInteraction);
 public static RaycastHit[] RaycastAll(Vector3 origin,Vector3 direction,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Rays(origin,direction,maxDistance,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static int RaycastNonAlloc(Vector3 origin,Vector3 direction,RaycastHit[] results,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(RaycastAll(origin,direction,maxDistance,layerMask,queryTriggerInteraction),results);
 public static bool Linecast(Vector3 start,Vector3 end,out RaycastHit hit,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(start,end-start,out hit,(end-start).magnitude,layerMask,queryTriggerInteraction);
 public static bool Linecast(Vector3 start,Vector3 end,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Linecast(start,end,out _,layerMask,queryTriggerInteraction);
 public static Collider[] OverlapSphere(Vector3 position,double radius,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Sphere(position,radius,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static int OverlapSphereNonAlloc(Vector3 position,double radius,Collider[] results,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(OverlapSphere(position,radius,layerMask,queryTriggerInteraction),results);
 public static bool CheckSphere(Vector3 position,double radius,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>OverlapSphere(position,radius,layerMask,queryTriggerInteraction).Length>0;
 public static Collider[] OverlapBox(Vector3 center,Vector3 halfExtents,Quaternion orientation=default,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Box(center,halfExtents,orientation==default?Quaternion.identity:orientation,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static int OverlapBoxNonAlloc(Vector3 center,Vector3 halfExtents,Collider[] results,Quaternion orientation=default,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(OverlapBox(center,halfExtents,orientation,layerMask,queryTriggerInteraction),results);
 public static bool CheckBox(Vector3 center,Vector3 halfExtents,Quaternion orientation=default,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>OverlapBox(center,halfExtents,orientation,layerMask,queryTriggerInteraction).Length>0;
}
public static partial class Physics2D {
 public const int AllLayers=-1;public const int DefaultRaycastLayers=Physics.DefaultRaycastLayers;public static bool queriesHitTriggers {get;set;}=true;
 public static RaycastHit2D Raycast(Vector2 origin,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>RaycastAll(origin,direction,distance,layerMask).FirstOrDefault();
 public static RaycastHit2D[] RaycastAll(Vector2 origin,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>PhysicsQueries.Rays(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),distance,layerMask,2,queriesHitTriggers).Select(PhysicsQueries.Hit2D).ToArray();
 public static int RaycastNonAlloc(Vector2 origin,Vector2 direction,RaycastHit2D[] results,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>PhysicsQueries.Fill(RaycastAll(origin,direction,distance,layerMask),results);
 public static RaycastHit2D Linecast(Vector2 start,Vector2 end,int layerMask=DefaultRaycastLayers)=>Raycast(start,end-start,(end-start).magnitude,layerMask);
 public static Collider2D[] OverlapCircleAll(Vector2 point,double radius,int layerMask=AllLayers)=>PhysicsQueries.Sphere(new(point.X,point.Y,0),radius,layerMask,2,queriesHitTriggers).Select(c=>new Collider2D(c.Entity)).OrderBy(c=>c.transform.position.Z).ToArray();
 public static Collider2D? OverlapCircle(Vector2 point,double radius,int layerMask=AllLayers)=>OverlapCircleAll(point,radius,layerMask).FirstOrDefault();
 public static int OverlapCircleNonAlloc(Vector2 point,double radius,Collider2D[] results,int layerMask=AllLayers)=>PhysicsQueries.Fill(OverlapCircleAll(point,radius,layerMask),results);
 public static Collider2D[] OverlapBoxAll(Vector2 point,Vector2 size,double angle,int layerMask=AllLayers)=>PhysicsQueries.Box(new(point.X,point.Y,0),new(size.X/2,size.Y/2,0),Quaternion.Euler(0,0,angle),layerMask,2,queriesHitTriggers).Select(c=>new Collider2D(c.Entity)).OrderBy(c=>c.transform.position.Z).ToArray();
 public static Collider2D? OverlapBox(Vector2 point,Vector2 size,double angle,int layerMask=AllLayers)=>OverlapBoxAll(point,size,angle,layerMask).FirstOrDefault();
 public static int OverlapBoxNonAlloc(Vector2 point,Vector2 size,double angle,Collider2D[] results,int layerMask=AllLayers)=>PhysicsQueries.Fill(OverlapBoxAll(point,size,angle,layerMask),results);
 public static Collider2D? OverlapPoint(Vector2 point,int layerMask=AllLayers)=>OverlapCircle(point,0,layerMask);
 public static Collider2D[] OverlapPointAll(Vector2 point,int layerMask=AllLayers)=>OverlapCircleAll(point,0,layerMask);
}
