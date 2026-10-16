using System.Text.Json;
using System.Text.Json.Nodes;
namespace Axiom.Gameplay;
public class Behaviour : Component {
 private bool active=true;
 public bool enabled {get=>active;set{if(active==value)return;var before=isActiveAndEnabled;active=value;if(this is MonoBehaviour)RuntimeLifecycle.Activation();}}
 public bool isActiveAndEnabled=>active&&Context.Entities.ContainsKey(Entity.Id)&&Context.IsActive(Entity.Id);
}
public enum Space {World,Self}
public class BoxCollider : Collider {internal BoxCollider(Entity entity):base(entity){}}
public sealed class SphereCollider : Collider {internal SphereCollider(Entity entity):base(entity){}}
public sealed class BoxCollider2D : Collider2D {internal BoxCollider2D(Entity entity):base(entity){}}
public sealed class CircleCollider2D : Collider2D {internal CircleCollider2D(Entity entity):base(entity){}}
public sealed class AudioListener : Component {internal AudioListener(Entity entity){Entity=entity;}}
internal static partial class Context {
 internal static readonly Dictionary<Script,string> ScriptPaths=new();
 internal static Action<Script>? CopyScript;
 internal static Func<Type,Entity,Script>? AddCompiledScript;
 internal static Action? StartPending;
 internal static JsonElement ParseData(string json){using var d=JsonDocument.Parse(json);return d.RootElement.Clone();}
 internal static string Metadata(Entity entity,string key,string fallback){_=Read(entity);return EntityData[entity.Id].TryGetProperty(key,out var v)?v.GetString()??fallback:fallback;}
 internal static void Property(Entity entity,string key,JsonNode? value){_=Read(entity);var node=JsonNode.Parse(EntityData[entity.Id].GetRawText())!.AsObject();if(value==null)node.Remove(key);else node[key]=value.DeepClone();EntityData[entity.Id]=ParseData(node.ToJsonString());Add(new("property",entity.Id,null,default,null,Name:key,Data:value?.ToJsonString()??"null"));Refresh(entity);}
 internal static void Refresh(Entity entity){var e=EntityData[entity.Id];Bodies.Remove(entity.Id);if(e.TryGetProperty("rigidBody",out var body))Bodies[entity.Id]=RigidBody.Read(body);if(e.TryGetProperty("camera",out _))Cameras.Add(entity.Id);else Cameras.Remove(entity.Id);if(e.TryGetProperty("audioSource",out _))AudioSources.Add(entity.Id);else AudioSources.Remove(entity.Id);if(e.TryGetProperty("animator",out var a))Animators[entity.Id]=a;else Animators.Remove(entity.Id);}
 internal static Entity CreateObject(string name){if(Entities.Count>=Limits.Entities||Spawned>=Limits.Spawns)throw new InvalidOperationException("Runtime creation limit exceeded");var id="entity://"+(DeterministicSpawn?$"{ReplaySeed:x8}-0000-4000-8000-{Spawned:x12}":Guid.NewGuid().ToString());var e=new Entity(id,Generation);Spawned++;Entities.Add(id,new Transform(Vector3.zero,Quaternion.identity,Vector3.one){Entity=e});Parents[id]=null;ActiveStates[id]=true;EntityData[id]=ParseData("{\"id\":"+JsonValue.Create(id)!.ToJsonString()+",\"name\":"+JsonValue.Create(name)!.ToJsonString()+",\"transform\":{\"position\":[0,0,0],\"rotation\":[0,0,0,1],\"scale\":[1,1,1]}}");Add(new("create",id,null,default,null,Name:name));return e;}
 internal static Transform Local(Entity entity){var t=Read(entity);var id=Parents.GetValueOrDefault(entity.Id);if(id==null)return t;var p=Read(new(id,Generation));var scale=p.Scale;if(Math.Abs(scale.X*scale.Y*scale.Z)<1e-20)throw new InvalidOperationException("Cannot invert zero parent scale");var position=Quaternion.Inverse(p.Rotation)*(t.Position-p.Position);return new(new(position.X/scale.X,position.Y/scale.Y,position.Z/scale.Z),Quaternion.Inverse(p.Rotation)*t.Rotation,new(t.Scale.X/scale.X,t.Scale.Y/scale.Y,t.Scale.Z/scale.Z));}
 internal static void LocalTransform(Entity entity,Vector3? position=null,Quaternion? rotation=null,Vector3? scale=null){var local=Local(entity);var p=position??local.Position;var r=rotation??local.Rotation;var s=scale??local.Scale;var parent=Parents.GetValueOrDefault(entity.Id);if(parent!=null){var t=Read(new(parent,Generation));p=t.Position+t.Rotation*new Vector3(p.X*t.Scale.X,p.Y*t.Scale.Y,p.Z*t.Scale.Z);r=t.Rotation*r;s=new(s.X*t.Scale.X,s.Y*t.Scale.Y,s.Z*t.Scale.Z);}Move(entity,p);Rotate(entity,r);Scaling(entity,s);}
 internal static void Parent(Entity entity,Transform? parent,bool worldPositionStays){_=Read(entity);if(parent!=null)_=Read(parent.Entity);var id=parent?.Entity.Id;for(var current=id;current!=null;current=Parents.GetValueOrDefault(current))if(current==entity.Id)throw new ArgumentException("Hierarchy cycle");var local=Local(entity);Parents[entity.Id]=id;Add(new("parent",entity.Id,null,default,null,Name:id));if(!worldPositionStays)LocalTransform(entity,local.Position,local.Rotation,local.Scale);}
 internal static string? ComponentKey(Type type)=>type==typeof(Transform)?"transform":typeof(Collider).IsAssignableFrom(type)?"collider":type==typeof(Rigidbody)||type==typeof(Rigidbody2D)?"rigidBody":type==typeof(Camera)?"camera":type==typeof(AudioSource)?"audioSource":type==typeof(AudioListener)?"audioListener":type==typeof(Animator)?"animator":null;
 internal static T AddComponent<T>(Entity entity) where T:Component {
  _=Read(entity);var type=typeof(T);if(typeof(Script).IsAssignableFrom(type)){if(AddCompiledScript==null)throw new InvalidOperationException("Runtime script factory unavailable");return (T)(Component)AddCompiledScript(type,entity);}
  var key=ComponentKey(type)??throw new NotSupportedException("Component is not implemented: "+type.Name);if(EntityData[entity.Id].TryGetProperty(key,out _))throw new InvalidOperationException("Only one "+key+" is supported per entity");
  string data;if(key=="collider"){var dimension=typeof(Collider2D).IsAssignableFrom(type)?2:3;var shape=type==typeof(SphereCollider)||type==typeof(CircleCollider2D)?"sphere":"box";data="{\"dimension\":"+dimension+",\"shape\":\""+shape+"\",\"halfExtents\":[0.5,0.5,0.5],\"trigger\":false,\"layer\":1,\"mask\":4294967295}";}
  else data=key switch {"rigidBody"=>"{\"mass\":1,\"velocity\":[0,0,0],\"restitution\":0,\"friction\":0.5,\"gravityScale\":1}","camera"=>"{\"active\":false,\"projection\":\"perspective\",\"fov\":60,\"orthoHeight\":6}","audioListener"=>"{\"enabled\":true}",_=>throw new NotSupportedException("Adding "+key+" requires an authored asset/configuration; clone an authored object instead")};
  Property(entity,key,JsonNode.Parse(data));return new GameObject(entity).GetComponent<T>()!;
 }
 internal static void Remove(Component component){_=Read(component.Entity);if(component is Transform)throw new InvalidOperationException("Transform cannot be removed");if(component is Script script){var path=RuntimeLifecycle.PathOf(script);RuntimeLifecycle.Remove(script);LiveScripts.Remove(script);ScriptPaths.Remove(script);var components=JsonNode.Parse(EntityData[component.Entity.Id].GetRawText())!["scriptComponents"]!.AsArray();for(var i=components.Count-1;i>=0;i--)if(components[i]!["path"]!.GetValue<string>()==path)components.RemoveAt(i);Property(component.Entity,"scriptComponents",components.DeepClone());return;}var key=ComponentKey(component.GetType())??throw new NotSupportedException("Unknown component");Property(component.Entity,key,null);}
 internal static Entity CloneHierarchy(Entity original,Vector3 position,Quaternion rotation){_=Read(original);var root=Read(original);var ids=new List<string>{original.Id};for(var i=0;i<ids.Count;i++)ids.AddRange(Parents.Where(p=>p.Value==ids[i]).Select(p=>p.Key).ToArray());if(ids.Count+Spawned>Limits.Spawns||ids.Count+Entities.Count>Limits.Entities)throw new InvalidOperationException("Clone hierarchy exceeds runtime limits");var map=new Dictionary<string,Entity>();var delta=rotation*Quaternion.Inverse(root.Rotation);
  foreach(var id in ids){var old=new Entity(id,Generation);var t=Read(old);var next=Spawn(old,position+delta*(t.Position-root.Position));map[id]=next;Rotate(next,delta*t.Rotation);if(id!=original.Id)Parent(next,new Transform(map[Parents[id]!]),true);}
  foreach(var id in ids)foreach(var script in LiveScripts.Where(s=>s.Entity.Id==id).ToArray())RuntimeLifecycle.Clone(script,map[id]);RuntimeLifecycle.Initialize();return map[original.Id];
 }
}
public partial class Object {
 public static GameObject Instantiate(GameObject original,Transform? parent)=>Instantiate(original,parent,true);
 public static GameObject Instantiate(GameObject original,Transform? parent,bool worldPositionStays){var clone=Instantiate(original);clone.transform.SetParent(parent,worldPositionStays);return clone;}
 public static T[] FindObjectsByType<T>() where T:Component=>Context.Entities.Keys.Where(Context.IsActive).SelectMany(id=>new GameObject(new(id,Context.Generation)).GetComponents<T>()).ToArray();
 public static T? FindFirstObjectByType<T>() where T:Component=>FindObjectsByType<T>().FirstOrDefault();
}
public partial class Component {
 public string name {get=>gameObject.name;set=>gameObject.name=value;}
 public string tag {get=>gameObject.tag;set=>gameObject.tag=value;}
 public bool CompareTag(string value)=>gameObject.CompareTag(value);
 public T[] GetComponents<T>() where T:Component=>gameObject.GetComponents<T>();
 public T[] GetComponentsInChildren<T>(bool includeInactive=false) where T:Component=>gameObject.GetComponentsInChildren<T>(includeInactive);
 public T[] GetComponentsInParent<T>(bool includeInactive=false) where T:Component=>gameObject.GetComponentsInParent<T>(includeInactive);
}
public sealed partial class GameObject {
 public GameObject(string name="New GameObject"){if(string.IsNullOrWhiteSpace(name)||name.Length>128)throw new ArgumentException("Invalid object name");Entity=Context.CreateObject(name);}
 public string tag {get=>Context.Metadata(Entity,"runtimeTag","Untagged");set{if(string.IsNullOrWhiteSpace(value)||value.Length>128)throw new ArgumentException("Invalid tag");Context.Property(Entity,"runtimeTag",JsonValue.Create(value));}}
 public int layer {get=>Context.EntityData[Entity.Id].TryGetProperty("runtimeLayer",out var layer)?layer.GetInt32():0;set{if(value<0||value>31)throw new ArgumentOutOfRangeException(nameof(value));Context.Property(Entity,"runtimeLayer",JsonValue.Create(value));if(Context.EntityData[Entity.Id].TryGetProperty("collider",out var c)){var node=JsonNode.Parse(c.GetRawText())!;node["layer"]=1u<<value;Context.Property(Entity,"collider",node);}}}
 public bool CompareTag(string value)=>tag==value;
 public static GameObject[] FindGameObjectsWithTag(string tag)=>Context.Entities.Keys.Where(Context.IsActive).Select(id=>new GameObject(new(id,Context.Generation))).Where(e=>e.tag==tag).ToArray();
 public static GameObject? FindWithTag(string tag)=>FindGameObjectsWithTag(tag).FirstOrDefault();
 public T AddComponent<T>() where T:Component=>Context.AddComponent<T>(Entity);
 public bool TryGetComponent<T>(out T? component) where T:Component {component=GetComponent<T>();return component!=null;}
 public T[] GetComponents<T>() where T:Component {var result=Context.LiveScripts.Where(s=>s.Entity.Id==Entity.Id).OfType<T>().ToList();var own=GetComponent<T>();if(own!=null&&!result.Contains(own))result.Insert(0,own);return result.ToArray();}
 public T? GetComponentInChildren<T>(bool includeInactive=false) where T:Component=>GetComponentsInChildren<T>(includeInactive).FirstOrDefault();
 public T? GetComponentInParent<T>(bool includeInactive=false) where T:Component=>GetComponentsInParent<T>(includeInactive).FirstOrDefault();
 public T[] GetComponentsInChildren<T>(bool includeInactive=false) where T:Component {var found=new List<T>();void Visit(Transform node){if(includeInactive||node.gameObject.activeInHierarchy)found.AddRange(node.GetComponents<T>());for(var i=0;i<node.childCount;i++)Visit(node.GetChild(i));}Visit(transform);return found.ToArray();}
 public T[] GetComponentsInParent<T>(bool includeInactive=false) where T:Component {var found=new List<T>();for(Transform? node=transform;node!=null;node=node.parent)if(includeInactive||node.gameObject.activeInHierarchy)found.AddRange(node.GetComponents<T>());return found.ToArray();}
}
public sealed partial class Transform {
 public Transform root {get{var current=this;while(current.parent!=null)current=current.parent;return current;}}
 public bool IsChildOf(Transform other){for(Transform? t=this;t!=null;t=t.parent)if(t.Entity==other.Entity)return true;return false;}
 public Vector3 TransformPoint(Vector3 point)=>position+rotation*new Vector3(point.X*lossyScale.X,point.Y*lossyScale.Y,point.Z*lossyScale.Z);
 public Vector3 InverseTransformPoint(Vector3 point){var p=Quaternion.Inverse(rotation)*(point-position);var s=lossyScale;if(Math.Abs(s.X*s.Y*s.Z)<1e-20)throw new InvalidOperationException("Cannot invert zero scale");return new(p.X/s.X,p.Y/s.Y,p.Z/s.Z);}
 public Vector3 TransformVector(Vector3 vector)=>rotation*new Vector3(vector.X*lossyScale.X,vector.Y*lossyScale.Y,vector.Z*lossyScale.Z);
 public Vector3 InverseTransformVector(Vector3 vector){var p=Quaternion.Inverse(rotation)*vector;var s=lossyScale;return new(p.X/s.X,p.Y/s.Y,p.Z/s.Z);}
 public void SetPositionAndRotation(Vector3 position,Quaternion rotation){this.position=position;this.rotation=rotation;}
 public void SetLocalPositionAndRotation(Vector3 position,Quaternion rotation)=>Context.LocalTransform(Entity,position,rotation);
 public void Translate(Vector3 translation,Space relativeTo){if(relativeTo==Space.World)position+=translation;else Translate(translation);}
 public void Rotate(Vector3 eulers,Space relativeTo=Space.Self){var q=Quaternion.Euler(eulers);rotation=relativeTo==Space.Self?rotation*q:q*rotation;}
}

internal static partial class Context {
 internal static void FollowChildren(Entity parent,Transform old){var now=Read(parent);foreach(var id in Parents.Where(p=>p.Value==parent.Id).Select(p=>p.Key).ToArray()){if(!Entities.TryGetValue(id,out var child))continue;var local=Quaternion.Inverse(old.Rotation)*(child.Position-old.Position);if(Math.Abs(old.Scale.X*old.Scale.Y*old.Scale.Z)<1e-20)throw new InvalidOperationException("Cannot transform a child through zero scale");local=new(local.X/old.Scale.X,local.Y/old.Scale.Y,local.Z/old.Scale.Z);var position=now.Position+now.Rotation*new Vector3(local.X*now.Scale.X,local.Y*now.Scale.Y,local.Z*now.Scale.Z);var rotation=now.Rotation*Quaternion.Inverse(old.Rotation)*child.Rotation;var scale=new Vector3(child.Scale.X/old.Scale.X*now.Scale.X,child.Scale.Y/old.Scale.Y*now.Scale.Y,child.Scale.Z/old.Scale.Z*now.Scale.Z);var entity=new Entity(id,Generation);Entities[id]=new Transform(position,rotation,scale){Entity=entity};FollowChildren(entity,child);}}
}
