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
 public Vector3 localScale {get=>Context.Local(Entity).Scale;set=>Context.LocalTransform(Entity,scale:value);}
 public Vector3 localPosition {get=>Context.Local(Entity).Position;set=>Context.LocalTransform(Entity,position:value);}
 public Quaternion localRotation {get=>Context.Local(Entity).Rotation;set=>Context.LocalTransform(Entity,rotation:value);}
 public Vector3 lossyScale=>Entity.Transform.Scale;
 public Vector3 forward=>rotation*Vector3.forward;
 public Vector3 right=>rotation*Vector3.right;
 public Vector3 up=>rotation*Vector3.up;
 public Transform? parent {get=>Context.Parents.GetValueOrDefault(Entity.Id) is string id?new(new Entity(id,Context.Generation)):null;set=>SetParent(value);}
 public void SetParent(Transform? value,bool worldPositionStays=true)=>Context.Parent(Entity,value,worldPositionStays);
 public int childCount=>Context.Parents.Count(p=>p.Value==Entity.Id);
 public Transform GetChild(int index)=>new(new Entity(Context.Parents.Where(p=>p.Value==Entity.Id).ElementAt(index).Key,Context.Generation));
 public Transform? Find(string path){var current=this;foreach(var part in path.Split('/')){Transform? found=null;for(var i=0;i<current.childCount;i++){var child=current.GetChild(i);if(child.gameObject.name==part){found=child;break;}}if(found==null)return null;current=found;}return current;}
 public void Translate(Vector3 translation)=>position+=rotation*translation;
 public void Rotate(double x,double y,double z)=>rotation=rotation*Quaternion.Euler(x,y,z);
 public Vector3 TransformDirection(Vector3 direction)=>rotation*direction;
 public Vector3 InverseTransformDirection(Vector3 direction)=>Quaternion.Inverse(rotation)*direction;
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

public sealed partial class Transform {
 public int GetSiblingIndex(){var siblings=Context.Parents.Where(p=>p.Value==Context.Parents.GetValueOrDefault(Entity.Id)).Select(p=>p.Key).ToList();return siblings.IndexOf(Entity.Id);}
 public void SetSiblingIndex(int index){var parent=Context.Parents.GetValueOrDefault(Entity.Id);var siblings=Context.Parents.Where(p=>p.Value==parent).Select(p=>p.Key).ToList();siblings.Remove(Entity.Id);siblings.Insert(Math.Clamp(index,0,siblings.Count),Entity.Id);var entries=Context.Parents.ToArray();Context.Parents.Clear();var queue=new Queue<string>(siblings);foreach(var entry in entries)if(entry.Value==parent){var id=queue.Dequeue();Context.Parents[id]=parent;}else Context.Parents[entry.Key]=entry.Value;Context.Sibling(Entity,index);}
 public void SetAsFirstSibling()=>SetSiblingIndex(0);
 public void SetAsLastSibling()=>SetSiblingIndex(int.MaxValue);
 public void DetachChildren(){foreach(var id in Context.Parents.Where(p=>p.Value==Entity.Id).Select(p=>p.Key).ToArray())new Transform(new Entity(id,Context.Generation)).SetParent(null);}
}

public sealed partial class Transform : Component {
 public Vector3 Position {get;init;}
 public Quaternion Rotation {get;init;}
 public Vector3 Scale {get;init;}
 public Transform(Vector3 position, Quaternion rotation, Vector3 scale) {Position=position;Rotation=rotation;Scale=scale;}
 internal static Transform Read(JsonElement value)=>new(Vector3.Read(value.GetProperty("position")), Quaternion.Read(value.GetProperty("rotation")), Vector3.Read(value.GetProperty("scale")));
}
```
