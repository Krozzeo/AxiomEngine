using System.Text.Json;
using System.Text.Json.Nodes;
namespace Axiom.Gameplay;
[Flags] public enum RigidbodyConstraints {None=0,FreezePositionX=2,FreezePositionY=4,FreezePositionZ=8,FreezeRotationX=16,FreezeRotationY=32,FreezeRotationZ=64,FreezePosition=14,FreezeRotation=112,FreezeAll=126}
[Flags] public enum RigidbodyConstraints2D {None=0,FreezePositionX=1,FreezePositionY=2,FreezeRotation=4,FreezePosition=3,FreezeAll=7}
public enum CollisionDetectionMode {Discrete,Continuous,ContinuousDynamic,ContinuousSpeculative}
public enum CollisionDetectionMode2D {Discrete,Continuous}
internal static class PhysicsWorld {
 private static JsonObject settings=new();
 internal static void Reset(){settings=new();}
 internal static void Publish()=>Context.Add(new("physicsSettings","",null,default,null,Data:settings.ToJsonString()));
 internal static Vector3 Gravity(string key)=>settings[key] is JsonArray a?new(a[0]!.GetValue<double>(),a[1]!.GetValue<double>(),a[2]!.GetValue<double>()):new(0,-9.81,0);
 internal static void Gravity(string key,Vector3 value){PhysicsData.Finite(value);if(Math.Max(Math.Abs(value.X),Math.Max(Math.Abs(value.Y),Math.Abs(value.Z)))>10000)throw new ArgumentOutOfRangeException(nameof(value));var next=new JsonArray(value.X,value.Y,value.Z);if(JsonNode.DeepEquals(settings[key],next))return;settings[key]=next;Publish();}
 internal static void Ignore(string group,string key,bool ignore){var array=settings[group] as JsonArray??new JsonArray();var values=array.Select(n=>n!.GetValue<string>()).ToHashSet();if(values.Contains(key)==ignore)return;if(ignore)values.Add(key);else values.Remove(key);if(values.Count>1024)throw new InvalidOperationException("Collision exclusion capacity exceeded");var result=new JsonArray();foreach(var item in values.Order())result.Add(JsonValue.Create(item));settings[group]=result;Publish();}
 internal static bool Ignored(string group,string key)=>settings[group] is JsonArray a&&a.Any(n=>n!.GetValue<string>()==key);
 internal static string Layers(int a,int b){if(a<0||a>31||b<0||b>31)throw new ArgumentOutOfRangeException();return Math.Min(a,b)+"|"+Math.Max(a,b);}
 internal static string Pair(Collider a,Collider b){_=Context.Read(a.Entity);_=Context.Read(b.Entity);return string.CompareOrdinal(a.Entity.Id,b.Entity.Id)<0?a.Entity.Id+"|"+b.Entity.Id:b.Entity.Id+"|"+a.Entity.Id;}
}
public sealed partial class Rigidbody {
 public double linearDamping {get=>PhysicsData.Number(Entity,"linearDamping");set=>PhysicsData.Number(Entity,"linearDamping",value,0,10000);}
 public double angularDamping {get=>PhysicsData.Number(Entity,"angularDamping");set=>PhysicsData.Number(Entity,"angularDamping",value,0,10000);}
 public double drag {get=>linearDamping;set=>linearDamping=value;}public double angularDrag {get=>angularDamping;set=>angularDamping=value;}
 public RigidbodyConstraints constraints {get=>(RigidbodyConstraints)(int)PhysicsData.Number(Entity,"constraints");set{if(((int)value&~126)!=0)throw new ArgumentException("Invalid constraints");PhysicsData.Number(Entity,"constraints",(int)value,0,126);}}
 public CollisionDetectionMode collisionDetectionMode {get=>PhysicsData.Body(Entity).TryGetProperty("continuous",out var v)&&v.GetBoolean()?CollisionDetectionMode.Continuous:CollisionDetectionMode.Discrete;set{if(value is not CollisionDetectionMode.Discrete and not CollisionDetectionMode.Continuous)throw new NotSupportedException("Only bounded substep Continuous and Discrete are implemented");PhysicsData.Set(Entity,"rigidBody","continuous",JsonValue.Create(value==CollisionDetectionMode.Continuous)!);}}
 public bool IsSleeping()=>PhysicsData.Body(Entity).TryGetProperty("sleeping",out var v)&&v.GetBoolean();
 public void Sleep(){linearVelocity=Vector3.zero;angularVelocity=Vector3.zero;PhysicsData.Set(Entity,"rigidBody","sleeping",JsonValue.Create(true)!);}
 public void WakeUp()=>PhysicsData.Set(Entity,"rigidBody","sleeping",JsonValue.Create(false)!);
}
public sealed partial class Rigidbody2D {
 public double linearDamping {get=>Body.linearDamping;set=>Body.linearDamping=value;}public double angularDamping {get=>Body.angularDamping;set=>Body.angularDamping=value;}
 public double drag {get=>linearDamping;set=>linearDamping=value;}public double angularDrag {get=>angularDamping;set=>angularDamping=value;}
 public bool simulated {get=>!Context.EntityData[Entity.Id].TryGetProperty("runtimeSimulated",out var v)||v.GetBoolean();set=>Context.Property(Entity,"runtimeSimulated",JsonValue.Create(value));}
 public RigidbodyConstraints2D constraints {get{var c=(int)Body.constraints;return (RigidbodyConstraints2D)((c&6)>>1|((c&64)!=0?4:0));}set{if(((int)value&~7)!=0)throw new ArgumentException("Invalid 2D constraints");Body.constraints=(RigidbodyConstraints)(((int)value&3)<<1|(((int)value&4)!=0?64:0));}}
 public CollisionDetectionMode2D collisionDetectionMode {get=>Body.collisionDetectionMode==CollisionDetectionMode.Discrete?CollisionDetectionMode2D.Discrete:CollisionDetectionMode2D.Continuous;set{if(!Enum.IsDefined(value))throw new ArgumentException();Body.collisionDetectionMode=value==CollisionDetectionMode2D.Continuous?CollisionDetectionMode.Continuous:CollisionDetectionMode.Discrete;}}
 public bool IsSleeping()=>Body.IsSleeping();public bool IsAwake()=>!IsSleeping();public void Sleep()=>Body.Sleep();public void WakeUp()=>Body.WakeUp();
}
public static partial class Physics {
 public static Vector3 gravity {get=>PhysicsWorld.Gravity("gravity");set=>PhysicsWorld.Gravity("gravity",value);}
 public static void IgnoreCollision(Collider a,Collider b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredPairs",PhysicsWorld.Pair(a,b),ignore);
 public static bool GetIgnoreCollision(Collider a,Collider b)=>PhysicsWorld.Ignored("ignoredPairs",PhysicsWorld.Pair(a,b));
 public static void IgnoreLayerCollision(int a,int b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredLayers3",PhysicsWorld.Layers(a,b),ignore);
 public static bool GetIgnoreLayerCollision(int a,int b)=>PhysicsWorld.Ignored("ignoredLayers3",PhysicsWorld.Layers(a,b));
}
public static partial class Physics2D {
 public static Vector2 gravity {get{var v=PhysicsWorld.Gravity("gravity2D");return new(v.X,v.Y);}set=>PhysicsWorld.Gravity("gravity2D",new(value.X,value.Y,0));}
 public static void IgnoreCollision(Collider2D a,Collider2D b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredPairs",PhysicsWorld.Pair(a,b),ignore);
 public static bool GetIgnoreCollision(Collider2D a,Collider2D b)=>PhysicsWorld.Ignored("ignoredPairs",PhysicsWorld.Pair(a,b));
 public static void IgnoreLayerCollision(int a,int b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredLayers2",PhysicsWorld.Layers(a,b),ignore);
 public static bool GetIgnoreLayerCollision(int a,int b)=>PhysicsWorld.Ignored("ignoredLayers2",PhysicsWorld.Layers(a,b));
}
public struct ContactFilter2D {
 public bool useTriggers,useLayerMask,useDepth,useOutsideDepth;public int layerMask;public double minDepth,maxDepth;
 public ContactFilter2D NoFilter(){useTriggers=true;useLayerMask=false;useDepth=false;useOutsideDepth=false;return this;}
 public void SetLayerMask(int mask){layerMask=mask;useLayerMask=true;}public void ClearLayerMask()=>useLayerMask=false;
 public void SetDepth(double min,double max){if(!double.IsFinite(min)||!double.IsFinite(max)||min>max)throw new ArgumentException("Invalid depth range");minDepth=min;maxDepth=max;useDepth=true;}public void ClearDepth()=>useDepth=false;
 public bool IsFilteringLayerMask(GameObject target)=>useLayerMask&&(unchecked((uint)layerMask)&(1u<<target.layer))==0;
 public bool IsFilteringDepth(GameObject target){if(!useDepth)return false;var inside=target.transform.position.Z>=minDepth&&target.transform.position.Z<=maxDepth;return useOutsideDepth?inside:!inside;}
 internal bool Allows(Collider2D target)=>(useTriggers||!target.isTrigger)&&!IsFilteringLayerMask(target.gameObject)&&!IsFilteringDepth(target.gameObject);
}
public static partial class Physics2D {
 public static int Raycast(Vector2 origin,Vector2 direction,ContactFilter2D filter,RaycastHit2D[] results,double distance=double.PositiveInfinity){ArgumentNullException.ThrowIfNull(results);var hits=PhysicsQueries.Rays(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),distance,filter.useLayerMask?filter.layerMask:AllLayers,2,filter.useTriggers).Select(PhysicsQueries.Hit2D).Where(h=>filter.Allows(h.collider!)).Take(results.Length).ToArray();Array.Copy(hits,results,hits.Length);return hits.Length;}
 public static int OverlapCircle(Vector2 point,double radius,ContactFilter2D filter,Collider2D[] results){ArgumentNullException.ThrowIfNull(results);var hits=PhysicsQueries.Sphere(new(point.X,point.Y,0),radius,filter.useLayerMask?filter.layerMask:AllLayers,2,filter.useTriggers).Select(c=>new Collider2D(c.Entity)).Where(filter.Allows).OrderBy(c=>c.transform.position.Z).Take(results.Length).ToArray();Array.Copy(hits,results,hits.Length);return hits.Length;}
}
