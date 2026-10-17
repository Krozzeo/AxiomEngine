# SceneManager

Namespace Axiom.Gameplay.SceneManagement. Scenes are physical project JSON files ending .scene.json with {"format":"axiom-scene","version":1,"entities":[...]}. Their authored local hierarchy is converted to world transforms and imported with remapped identities. Scene resources share already prepared project assets and compiled scripts; they do not open a different editor project. Name-only paths must be unambiguous. At most 16 runtime scenes, 64 runtime creations per Play generation, 1024 entities and 32 live scripts; repeated loads consume the creation budget. No disk authoring changes occur during Play.

LoadScene Single destroys nonpersistent root objects and descendants; Additive preserves existing objects. DontDestroyOnLoad marks a root subtree. CreateScene, GetActiveScene, SetActiveScene, MoveGameObjectToScene, unload and root queries track ownership. An existing scene cannot be loaded twice additively. LoadSceneAsync returns a completed operation because resource data is already resident; rendering applies the validated packet at the next host boundary. Streaming, background I/O, scene lighting settings, asset bundles and Addressables are pending. Persistent roots retain their old owner; this version does not display a dedicated DontDestroyOnLoad scene group.

```csharp
using Axiom.Gameplay.SceneManagement;
SceneManager.LoadScene("Arena", LoadSceneMode.Additive);
var arena = SceneManager.GetSceneByName("Arena");
Debug.Log(arena.rootCount);
SceneManager.UnloadSceneAsync("Arena");
```

Use Scenes & Resources API Lab. Scene source scripts must belong to the current compiled project bundle.

## Implemented declarations

```csharp
public static class SceneManager {
 internal static readonly List<Scene> Loaded=new();internal static readonly Dictionary<string,string> Owners=new();internal static readonly HashSet<string> Persistent=new();private static Scene active;
 internal static void Reset(JsonElement request){Loaded.Clear();Owners.Clear();Persistent.Clear();var name=request.TryGetProperty("projectData",out var p)?p.GetProperty("name").GetString()!:"Scene";active=new(name,"",-1);Loaded.Add(active);foreach(var id in Context.Entities.Keys)Owners[id]=name;}
 public static int sceneCount=>Loaded.Count;public static int loadedSceneCount=>sceneCount;
 private static JsonElement[] Assets=>Resources.Data.EnumerateArray().Where(r=>r.GetProperty("type").GetString()=="scene").ToArray();
 public static int sceneCountInBuildSettings=>Assets.Length;
 public static Scene GetActiveScene()=>active;
 public static Scene GetSceneAt(int index)=>Loaded[index];
 public static Scene GetSceneByName(string name)=>Loaded.FirstOrDefault(s=>s.name==name);
 public static Scene GetSceneByPath(string path)=>Loaded.FirstOrDefault(s=>s.path==path);
 public static Scene GetSceneByBuildIndex(int index){if(index<0||index>=Assets.Length)return default;var path=Assets[index].GetProperty("path").GetString()!;return new(Title(path),path,index);}
 private static string Title(string path)=>path.Split('/').Last().Replace(".scene.json","");
 public static Scene CreateScene(string name){if(string.IsNullOrWhiteSpace(name)||name.Length>128||Loaded.Any(s=>s.name==name)||Loaded.Count>=16)throw new ArgumentException("Invalid/duplicate scene or scene capacity exceeded");var s=new Scene(name,"",-1);Loaded.Add(s);return s;}
 public static bool SetActiveScene(Scene scene){if(!scene.isLoaded)return false;active=scene;return true;}
 public static void MoveGameObjectToScene(GameObject gameObject,Scene scene){if(!scene.isLoaded||gameObject.transform.parent!=null)throw new ArgumentException("Move a root object to a loaded scene");void Move(Transform t){Owners[t.Entity.Id]=scene.name;for(var i=0;i<t.childCount;i++)Move(t.GetChild(i));}Move(gameObject.transform);}
 public static void LoadScene(int index,LoadSceneMode mode=LoadSceneMode.Single){var s=GetSceneByBuildIndex(index);if(!s.IsValid())throw new ArgumentOutOfRangeException(nameof(index));LoadScene(s.path,mode);}
 public static void LoadScene(string name,LoadSceneMode mode=LoadSceneMode.Single){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid load mode");var matches=Assets.Where(r=>r.GetProperty("path").GetString()==name||Title(r.GetProperty("path").GetString()!)==name).ToArray();if(matches.Length!=1)throw new ArgumentException("Scene missing or ambiguous: "+name);var path=matches[0].GetProperty("path").GetString()!;if(mode==LoadSceneMode.Additive&&Loaded.Any(s=>s.path==path))throw new NotSupportedException("Loading the same scene twice additively is not supported");if(mode==LoadSceneMode.Single){foreach(var id in Context.Entities.Keys.Where(id=>Context.Parents.GetValueOrDefault(id)==null&&!Persistent.Contains(id)).ToArray())if(Context.Entities.ContainsKey(id))Context.Destroy(new Entity(id,Context.Generation));Loaded.Clear();}var scene=new Scene(Title(path),path,Array.FindIndex(Assets,r=>r.GetProperty("path").GetString()==path));Loaded.Add(scene);var previous=active;active=scene;Context.ImportResource(path,false);if(mode==LoadSceneMode.Additive)active=previous;}
 public static AsyncOperation LoadSceneAsync(string name,LoadSceneMode mode=LoadSceneMode.Single){LoadScene(name,mode);return new();}
 public static AsyncOperation LoadSceneAsync(int index,LoadSceneMode mode=LoadSceneMode.Single){LoadScene(index,mode);return new();}
 public static AsyncOperation UnloadSceneAsync(string name){var scene=GetSceneByName(name);if(!scene.IsValid()||Loaded.Count<=1)throw new ArgumentException("Cannot unload the last or an unknown scene");foreach(var root in scene.GetRootGameObjects())if(!Persistent.Contains(root.Entity.Id))Context.Destroy(root.Entity);Loaded.RemoveAll(s=>s.name==name);if(active.name==name)active=Loaded[0];return new();}
}

public enum LoadSceneMode {Single,Additive}
```
