# GameObject

Namespace: `Axiom.Gameplay`

## Description

Create an empty runtime GameObject, retrieve/add compiled components, activate it and query live tags/layers. One script instance per compiled physical path and one built-in storage kind per object are supported. AddComponent supports compiled scripts, box/sphere colliders in 2D/3D, Rigidbody/Rigidbody2D, Camera and AudioListener. Asset-backed AudioSource and Animator require authored configuration and can be cloned. Transform cannot be removed.

## Example

```csharp
var child = new GameObject("Sensor");
child.transform.SetParent(transform, false);
child.transform.localPosition = new Vector3(0, 1, 0);
child.tag = "Sensor";
child.AddComponent<BoxCollider>();
```

## Notes

Object.Instantiate copies the full descendant hierarchy and serialized fields of compiled scripts. Static fields and coroutine state are not duplicated. Runtime edits never persist to the authored project.

## Implemented declarations

```csharp
public sealed partial class GameObject : Object {
 internal Entity Entity {get;}
 internal GameObject(Entity entity){Entity=entity;}
 public string name {get=>Context.Metadata(Entity,"name",Entity.Id);set=>Context.Property(Entity,"name",System.Text.Json.Nodes.JsonValue.Create(value));}
 public Transform transform=>new(Entity);
 public bool activeSelf=>Context.ActiveStates.GetValueOrDefault(Entity.Id,true);public bool activeInHierarchy=>Context.IsActive(Entity.Id);public void SetActive(bool active)=>Context.Activate(Entity,active);
 public static GameObject? Find(string name){foreach(var (id,data) in Context.EntityData)if(Context.IsActive(id)&&data.TryGetProperty("name",out var value)&&value.GetString()==name)return new(new Entity(id,Context.Generation));return null;}
 public T? GetComponent<T>() where T:Component=>GetComponents<T>().FirstOrDefault();

}

public sealed partial class GameObject {
 public GameObject(string name="New GameObject"){if(string.IsNullOrWhiteSpace(name)||name.Length>128)throw new ArgumentException("Invalid object name");Entity=Context.CreateObject(name);}
 public string tag {get=>Context.Metadata(Entity,"runtimeTag","Untagged");set{if(string.IsNullOrWhiteSpace(value)||value.Length>128)throw new ArgumentException("Invalid tag");Context.Property(Entity,"runtimeTag",JsonValue.Create(value));}}
 public int layer {get=>Context.EntityData[Entity.Id].TryGetProperty("runtimeLayer",out var layer)?layer.GetInt32():0;set{if(value<0||value>31)throw new ArgumentOutOfRangeException(nameof(value));Context.Property(Entity,"runtimeLayer",JsonValue.Create(value));if(Context.EntityData[Entity.Id].TryGetProperty("collider",out var c)){var node=JsonNode.Parse(c.GetRawText())!;node["layer"]=1u<<value;Context.Property(Entity,"collider",node);}}}
 public bool CompareTag(string value)=>tag==value;
 public static GameObject[] FindGameObjectsWithTag(string tag)=>Context.Entities.Keys.Where(Context.IsActive).Select(id=>new GameObject(new Entity(id,Context.Generation))).Where(e=>e.tag==tag).ToArray();
 public static GameObject? FindWithTag(string tag)=>FindGameObjectsWithTag(tag).FirstOrDefault();
 public T AddComponent<T>() where T:Component=>Context.AddComponent<T>(Entity);
 public bool TryGetComponent<T>(out T? component) where T:Component {component=GetComponent<T>();return component!=null;}
 public T[] GetComponents<T>() where T:Component {
  _=Context.Read(Entity);var result=new List<Component>{transform};var data=Context.EntityData[Entity.Id];
  var hasCollider=data.TryGetProperty("collider",out var c);var twoD=hasCollider?c.GetProperty("dimension").GetInt32()==2:data.TryGetProperty("runtimePhysicsDimension",out var dim)&&dim.GetInt32()==2;
  if(c.ValueKind==JsonValueKind.Object){var sphere=c.GetProperty("shape").GetString()=="sphere";result.Add(twoD?(sphere?new CircleCollider2D(Entity):new BoxCollider2D(Entity)):(sphere?new SphereCollider(Entity):new BoxCollider(Entity)));}
  if(Context.Bodies.ContainsKey(Entity.Id))result.Add(twoD?new Rigidbody2D(Entity):new Rigidbody(Entity));
  if(Context.Cameras.Contains(Entity.Id))result.Add(new Camera(Entity));if(Context.AudioSources.Contains(Entity.Id))result.Add(new AudioSource(Entity));if(Context.Animators.ContainsKey(Entity.Id))result.Add(new Animator(Entity));if(data.TryGetProperty("audioListener",out _))result.Add(new AudioListener(Entity));
  result.AddRange(Context.LiveScripts.Where(s=>s.Entity.Id==Entity.Id));return result.OfType<T>().ToArray();
 }

 public T? GetComponentInChildren<T>(bool includeInactive=false) where T:Component=>GetComponentsInChildren<T>(includeInactive).FirstOrDefault();
 public T? GetComponentInParent<T>(bool includeInactive=false) where T:Component=>GetComponentsInParent<T>(includeInactive).FirstOrDefault();
 public T[] GetComponentsInChildren<T>(bool includeInactive=false) where T:Component {var found=new List<T>();void Visit(Transform node){if(includeInactive||node.gameObject.activeInHierarchy)found.AddRange(node.GetComponents<T>());for(var i=0;i<node.childCount;i++)Visit(node.GetChild(i));}Visit(transform);return found.ToArray();}
 public T[] GetComponentsInParent<T>(bool includeInactive=false) where T:Component {var found=new List<T>();for(Transform? node=transform;node!=null;node=node.parent)if(includeInactive||node.gameObject.activeInHierarchy)found.AddRange(node.GetComponents<T>());return found.ToArray();}
}
```
