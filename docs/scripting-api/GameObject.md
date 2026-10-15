# GameObject

Namespace: `Axiom.Gameplay`

## Description

Named runtime entity facade. Find searches active entities by exact name. transform accesses a live Transform; GetComponent retrieves existing built-ins or attached script instances. SetActive controls the entity and its descendants.

## Use cases

Locate a named scene object, inspect its components or toggle its runtime participation.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var target = GameObject.Find("Workshop Cube");
if (target != null) {
 target.transform.position = new Vector3(2, 1, 0);
 target.SetActive(false);
 target.SetActive(true);
}
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
