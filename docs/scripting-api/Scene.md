# Scene

A runtime scene identity (name, physical path, deterministic resource buildIndex), loaded state and root object lookup. Default Scene is invalid. The current editor scene initially has buildIndex -1. Creation and moving root subtrees update ownership; all entities still appear in the editor runtime Hierarchy.

## Implemented declarations

```csharp
public readonly struct Scene {
 public string name {get;}public string path {get;}public int buildIndex {get;}public bool isLoaded {get{var title=name;return SceneManager.Loaded.Any(s=>s.name==title);}}
 internal Scene(string title,string source,int index){name=title;path=source;buildIndex=index;}
 public bool IsValid()=>!string.IsNullOrEmpty(name);
 public GameObject[] GetRootGameObjects(){var title=name;return Context.Entities.Keys.Where(id=>Context.Parents.GetValueOrDefault(id)==null&&SceneManager.Owners.GetValueOrDefault(id,SceneManager.GetActiveScene().name)==title).Select(id=>new GameObject(new Entity(id,Context.Generation))).ToArray();}
 public int rootCount=>GetRootGameObjects().Length;
}

public class AsyncOperation {public virtual bool isDone=>true;public virtual double progress=>1;private event Action<AsyncOperation>? callbacks;public event Action<AsyncOperation> completed {add{if(isDone)value(this);else callbacks+=value;}remove{callbacks-=value;}}internal void Complete(){callbacks?.Invoke(this);callbacks=null;}}
```
