# GameObject

Namespace: `Axiom.Gameplay`

## Description

Named runtime entity facade for lookup, transform access and component retrieval.

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
public sealed class GameObject : Object {
 internal Entity Entity {get;}
 internal GameObject(Entity entity){Entity=entity;}
 public string name=>Context.EntityData.TryGetValue(Entity.Id,out var data)&&data.TryGetProperty("name",out var value)?value.GetString()??Entity.Id:Entity.Id;
 public Transform transform=>new(Entity);
 public bool activeSelf=>Context.ActiveStates.GetValueOrDefault(Entity.Id,true);public bool activeInHierarchy=>Context.IsActive(Entity.Id);public void SetActive(bool active)=>Context.Activate(Entity,active);
 public static GameObject? Find(string name){foreach(var (id,data) in Context.EntityData)if(Context.IsActive(id)&&data.TryGetProperty("name",out var value)&&value.GetString()==name)return new(new Entity(id,Context.Generation));return null;}
 public T? GetComponent<T>() where T:Component {
  _=Context.Read(Entity);Component? component=null;
  if(typeof(T)==typeof(Collider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out _))component=new Collider(Entity);
  else if(typeof(T)==typeof(Collider2D)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var collider)&&collider.GetProperty("dimension").GetInt32()==2)component=new Collider2D(Entity);
  else if(typeof(T)==typeof(Transform))component=transform;
  else if(typeof(T)==typeof(Rigidbody2D)&&Context.Bodies.ContainsKey(Entity.Id)&&Context.EntityData[Entity.Id].GetProperty("collider").GetProperty("dimension").GetInt32()==2)component=new Rigidbody2D(Entity);
  else if(typeof(T)==typeof(Rigidbody)&&Context.Bodies.ContainsKey(Entity.Id))component=new Rigidbody(Entity);
  else if(typeof(T)==typeof(Camera)&&Context.Cameras.Contains(Entity.Id))component=new Camera(Entity);
  else if(typeof(T)==typeof(AudioSource)&&Context.AudioSources.Contains(Entity.Id))component=new AudioSource(Entity);
  else if(typeof(T)==typeof(Animator)&&Context.Animators.ContainsKey(Entity.Id))component=new Animator(Entity);
  return component as T??Context.LiveScripts.OfType<T>().FirstOrDefault(script=>script.Entity.Id==Entity.Id);
 }
}
```
