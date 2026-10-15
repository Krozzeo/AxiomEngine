# Transform

Namespace: `Axiom.Gameplay`

## Description

Live component facade for positioning and orienting an entity. Uppercase properties preserve the original snapshot access.

## Use cases

Move an entity with live transform access.

## Example

```csharp
using Axiom.Gameplay;
var target = GameObject.Find("Workshop Cube");
if (target != null) target.transform.position = new Vector3(2, 1, 0);
var body = GetComponent<Rigidbody>();
if (body != null) body.linearVelocity = Vector3.up * 3;
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
