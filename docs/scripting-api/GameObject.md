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
public sealed partial class GameObject : Object {
 internal Entity Entity {get;}
 internal GameObject(Entity entity){Entity=entity;}
 public string name {get=>Context.Metadata(Entity,"name",Entity.Id);set=>Context.Property(Entity,"name",System.Text.Json.Nodes.JsonValue.Create(value));}
 public Transform transform=>new(Entity);
 public bool activeSelf=>Context.ActiveStates.GetValueOrDefault(Entity.Id,true);public bool activeInHierarchy=>Context.IsActive(Entity.Id);public void SetActive(bool active)=>Context.Activate(Entity,active);
 public static GameObject? Find(string name){foreach(var (id,data) in Context.EntityData)if(Context.IsActive(id)&&data.TryGetProperty("name",out var value)&&value.GetString()==name)return new(new Entity(id,Context.Generation));return null;}
 public T? GetComponent<T>() where T:Component {
  _=Context.Read(Entity);Component? component=null;
  if(typeof(T)==typeof(AudioListener)&&Context.EntityData[Entity.Id].TryGetProperty("audioListener",out _))component=new AudioListener(Entity);
  else if(typeof(T)==typeof(BoxCollider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var bc)&&bc.GetProperty("dimension").GetInt32()==3&&bc.GetProperty("shape").GetString()=="box")component=new BoxCollider(Entity);
  else if(typeof(T)==typeof(SphereCollider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var sc)&&sc.GetProperty("dimension").GetInt32()==3&&sc.GetProperty("shape").GetString()=="sphere")component=new SphereCollider(Entity);
  else if(typeof(T)==typeof(BoxCollider2D)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var bc2)&&bc2.GetProperty("dimension").GetInt32()==2&&bc2.GetProperty("shape").GetString()=="box")component=new BoxCollider2D(Entity);
  else if(typeof(T)==typeof(CircleCollider2D)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var cc2)&&cc2.GetProperty("dimension").GetInt32()==2&&cc2.GetProperty("shape").GetString()=="sphere")component=new CircleCollider2D(Entity);
  else if(typeof(T)==typeof(Collider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out _))component=new Collider(Entity);
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
```
