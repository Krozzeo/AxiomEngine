# Object

Namespace: `Axiom.Gameplay`

## Description

Base for the live object/component facade. Instantiate creates one runtime entity from an existing template; Destroy removes an entity subtree. These operations affect Play, not the authored scene.

## Use cases

Spawn a temporary pickup or remove a consumed object.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var original = GameObject.Find("Pickup");
if (original != null) {
 var clone = Instantiate(original, new Vector3(2, 1, 0), Quaternion.identity);
 Destroy(clone);
}
```

## Compatibility and limitations

Transforms use world position/rotation. localScale writes the runtime scale. Legacy Entity.Transform.Position/Rotation/Scale remain snapshots; lowercase transform properties are live. Generic component lookup covers built-in wrappers and already attached scripts. Instantiate clones one entity using the existing spawn contract; it does not yet clone a hierarchy or start new script instances. SetActive controls runtime hierarchy participation; GetComponentInChildren and GetComponentInParent traverse existing components. Dynamic AddComponent, tags and full Unity object identity semantics remain pending.


## Implemented declarations

```csharp
public partial class Object {
 public static GameObject Instantiate(GameObject original)=>Instantiate(original,original.transform.position,original.transform.rotation);
 public static GameObject Instantiate(GameObject original,Vector3 position,Quaternion rotation){var entity=Context.CloneHierarchy(original.Entity,position,rotation);entity.SetRotation(rotation);return new GameObject(entity);}
 public static void Destroy(GameObject target)=>Context.Destroy(target.Entity);
 public static void Destroy(Component target)=>Context.Remove(target);
}

public partial class Object {
 public static GameObject Instantiate(GameObject original,Transform? parent)=>Instantiate(original,parent,true);
 public static GameObject Instantiate(GameObject original,Transform? parent,bool worldPositionStays){var clone=Instantiate(original);var local=Context.Local(original.Entity);clone.transform.SetParent(parent,true);if(!worldPositionStays)Context.LocalTransform(clone.Entity,local.Position,local.Rotation,local.Scale);return clone;}
 public static T[] FindObjectsByType<T>() where T:Component=>Context.Entities.Keys.Where(Context.IsActive).SelectMany(id=>new GameObject(new Entity(id,Context.Generation)).GetComponents<T>()).ToArray();
 public static T? FindFirstObjectByType<T>() where T:Component=>FindObjectsByType<T>().FirstOrDefault();
}

public partial class Object {
 private Entity? Handle=>this is GameObject go?go.Entity:this is Component c?c.Entity:null;
 public int GetInstanceID()=>Handle is Entity e?HashCode.Combine(e.Id,e.Generation,this is Component c?c.GetType():typeof(GameObject)):System.Runtime.CompilerServices.RuntimeHelpers.GetHashCode(this);
 private static bool Exists(Object? value)=>value!=null&&(value.Handle is not Entity e||e.Generation==Context.Generation&&Context.Entities.ContainsKey(e.Id));
 public static implicit operator bool(Object? value)=>Exists(value);
}
```
