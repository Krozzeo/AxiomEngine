# Object

Runtime creation/cloning/destruction and component queries. Instantiate recursively clones descendants and compiled script field values, then invokes the new lifecycle. Destroy(Component) removes that component; Destroy(GameObject) removes the subtree. See the Objects and components section for exact limits.

## Implemented declarations

```csharp
public partial class Object {
 public static GameObject Instantiate(GameObject original)=>Instantiate(original,original.transform.position,original.transform.rotation);
 public static GameObject Instantiate(GameObject original,Vector3 position,Quaternion rotation){var entity=Context.CloneHierarchy(original.Entity,position,rotation);entity.SetRotation(rotation);return new GameObject(entity);}
 public static void Destroy(GameObject target)=>Context.Destroy(target.Entity);
 public static void Destroy(Component target)=>Context.Remove(target);
}

public partial class Object {
 public static void Destroy(GameObject target,double delay)=>RuntimeLifecycle.DestroyAfter(target,delay);
 public static void Destroy(Component target,double delay)=>RuntimeLifecycle.DestroyAfter(target,delay);
 public static GameObject Instantiate(GameObject original,Transform? parent)=>Instantiate(original,parent,true);
 public static GameObject Instantiate(GameObject original,Transform? parent,bool worldPositionStays){var clone=Instantiate(original);var local=Context.Local(original.Entity);clone.transform.SetParent(parent,true);if(!worldPositionStays)Context.LocalTransform(clone.Entity,local.Position,local.Rotation,local.Scale);return clone;}
 public static T[] FindObjectsByType<T>() where T:Component=>Context.Entities.Keys.Where(Context.IsActive).SelectMany(id=>new GameObject(new Entity(id,Context.Generation)).GetComponents<T>()).ToArray();
 public static T? FindFirstObjectByType<T>() where T:Component=>FindObjectsByType<T>().FirstOrDefault();
}

public partial class Object {
 private Entity? Handle=>this is GameObject go?go.Entity:this is Component c?c.Entity:null;
 public int GetInstanceID()=>Handle is Entity e?HashCode.Combine(e.Id,e.Generation,this is Component c?c.GetType():typeof(GameObject)):System.Runtime.CompilerServices.RuntimeHelpers.GetHashCode(this);
 private static bool Exists(Object? value){if(value==null)return false;if(value.Handle is not Entity e)return true;if(e.Generation!=Context.Generation||!Context.Entities.ContainsKey(e.Id))return false;if(value is Script script)return Context.LiveScripts.Contains(script);if(value is Component c&&Context.ComponentKey(c.GetType()) is string key)return Context.EntityData[e.Id].TryGetProperty(key,out _);return true;}
 public static implicit operator bool(Object? value)=>Exists(value);
}

public partial class Object {
 public static GameObject Instantiate(PrefabAsset original)=>Context.ImportResource(original.Path,true).First();
 public static GameObject Instantiate(PrefabAsset original,Vector3 position,Quaternion rotation){var root=Instantiate(original);root.transform.position=position;root.transform.rotation=rotation;return root;}
 public static void DontDestroyOnLoad(GameObject target){_=Context.Read(target.Entity);var root=target.transform;while(root.parent!=null)root=root.parent;SceneManagement.SceneManager.Persistent.Add(root.Entity.Id);}
}
```
