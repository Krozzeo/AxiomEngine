# Transform

Namespace: `Axiom.Gameplay`

## Description

Live spatial component for world position, quaternion rotation and scale. Lowercase properties read current runtime state and enqueue validated writes. Uppercase Position/Rotation/Scale preserve legacy snapshot access.

## Use cases

Position a spawned entity, orient a character, or derive movement axes.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
transform.position = new Vector3(2, 1, 0);
transform.rotation = Quaternion.Euler(0, 90, 0);
transform.localScale = Vector3.one * 2;
var facing = transform.forward;
Debug.Log(facing);
```

## Compatibility and limitations

Transforms use world position/rotation. localScale writes the runtime scale. Legacy Entity.Transform.Position/Rotation/Scale remain snapshots; lowercase transform properties are live. Generic component lookup covers built-in wrappers and already attached scripts. Instantiate clones one entity using the existing spawn contract; it does not yet clone a hierarchy or start new script instances. SetActive controls runtime hierarchy participation; GetComponentInChildren and GetComponentInParent traverse existing components. Dynamic AddComponent, tags and full Unity object identity semantics remain pending.


## Implemented declarations

```csharp
public sealed partial class Transform {
 internal Transform(Entity entity){Entity=entity;var v=Context.Read(entity);Position=v.Position;Rotation=v.Rotation;Scale=v.Scale;}
 public Vector3 position {get=>Entity.Transform.Position;set=>Entity.SetPosition(value);}
 public Quaternion rotation {get=>Entity.Transform.Rotation;set=>Entity.SetRotation(value);}
 public Vector3 localScale {get=>Entity.Transform.Scale;set=>Context.Scaling(Entity,value);}
 public Vector3 forward=>rotation*Vector3.forward;
 public Vector3 right=>rotation*Vector3.right;
 public Vector3 up=>rotation*Vector3.up;
 public Transform? parent=>Context.Parents.GetValueOrDefault(Entity.Id) is string id?new(new Entity(id,Context.Generation)):null;
 public int childCount=>Context.Parents.Count(p=>p.Value==Entity.Id);
 public Transform GetChild(int index)=>new(new Entity(Context.Parents.Where(p=>p.Value==Entity.Id).ElementAt(index).Key,Context.Generation));
 public Transform? Find(string path){var current=this;foreach(var part in path.Split('/')){Transform? found=null;for(var i=0;i<current.childCount;i++){var child=current.GetChild(i);if(child.gameObject.name==part){found=child;break;}}if(found==null)return null;current=found;}return current;}
 public void Translate(Vector3 translation)=>position+=rotation*translation;
 public void Rotate(double x,double y,double z)=>rotation=rotation*Quaternion.Euler(x,y,z);
 public Vector3 TransformDirection(Vector3 direction)=>rotation*direction;
 public Vector3 InverseTransformDirection(Vector3 direction)=>Quaternion.Inverse(rotation)*direction;
}

public sealed partial class Transform : Component {
 public Vector3 Position {get;init;}
 public Quaternion Rotation {get;init;}
 public Vector3 Scale {get;init;}
 public Transform(Vector3 position, Quaternion rotation, Vector3 scale) {Position=position;Rotation=rotation;Scale=scale;}
 internal static Transform Read(JsonElement value)=>new(Vector3.Read(value.GetProperty("position")), Quaternion.Read(value.GetProperty("rotation")), Vector3.Read(value.GetProperty("scale")));
}
```
