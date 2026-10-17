# Resources

Load<T> / LoadAll<T> resolve bounded, immutable physical JSON files from the open project, with exact paths or Assets/Resources aliases. TextAsset exposes JSON text/UTF-8 bytes; PrefabAsset is a blueprint for Object.Instantiate; SceneAsset identifies a .scene.json resource. C# source and account credentials are not resources. Missing or mismatched types return null. Ambiguous paths return null. Source asset files must satisfy the project 64 KiB text budget; scene/prefab templates contain at most 64 validated entities and use project-local asset IDs. Prefabs instantiate unlocked runtime copies with root suffix ` (clone)`; child names remain unchanged. Import validates the complete host packet before touching the world.

```csharp
var config = Resources.Load<TextAsset>("Assets/Settings.json");
var crate = Object.Instantiate(Resources.Load<PrefabAsset>("Assets/Crate.prefab.json")!);
```

PrefabAsset is an explicit Axiom resource type, rather than Unity's asset-backed GameObject handle. Texture/binary loading, asset unloading and arbitrary external paths remain pending.

## Implemented declarations

```csharp
public static class Resources {
 public static ResourceRequest LoadAsync<T>(string path) where T:Object=>new(Load<T>(path));
 internal static JsonElement Data=Context.ParseData("[]");
 internal static JsonElement? Find(string path){var all=Data.EnumerateArray().Where(r=>r.GetProperty("path").GetString()==path||r.GetProperty("path").GetString()=="Assets/Resources/"+path||r.GetProperty("path").GetString()=="Assets/Resources/"+path+".json").ToArray();return all.Length==1?all[0]:null;}
 private static Object? Asset(Type type,JsonElement r){var path=r.GetProperty("path").GetString()!;var kind=r.GetProperty("type").GetString();var id=r.TryGetProperty("assetId",out var asset)?asset.GetString()!:"";return type==typeof(Texture2D)&&kind=="texture"?new Texture2D(path,id):type==typeof(AudioClip)&&kind=="audio"?new AudioClip(path,id):type==typeof(Mesh)&&kind=="mesh"?new Mesh(path,id):null;}
 public static T? Load<T>(string path) where T:Object {var resource=Find(path);if(resource==null)return null;var r=resource.Value;Object? value=typeof(T)==typeof(TextAsset)?(r.TryGetProperty("text",out var text)?new TextAsset(path,text.GetString()!):null):typeof(T)==typeof(PrefabAsset)&&r.GetProperty("type").GetString()=="prefab"?new PrefabAsset(r.GetProperty("path").GetString()!):typeof(T)==typeof(SceneAsset)&&r.GetProperty("type").GetString()=="scene"?new SceneAsset(r.GetProperty("path").GetString()!):Asset(typeof(T),r);return value as T;}
 public static T[] LoadAll<T>(string path="") where T:Object=>Data.EnumerateArray().Where(r=>r.GetProperty("path").GetString()!.StartsWith(path,StringComparison.Ordinal)).Select(r=>Load<T>(r.GetProperty("path").GetString()!)).OfType<T>().ToArray();
}

public sealed class TextAsset : Object {internal string Path;public string name {get;}public string text {get;}public byte[] bytes=>System.Text.Encoding.UTF8.GetBytes(text);internal TextAsset(string path,string value){Path=path;name=path.Split('/').Last();text=value;}}

public sealed class PrefabAsset : Object {public string path=>Path;public string name=>Path.Split('/').Last();internal string Path;internal PrefabAsset(string path){Path=path;}}

public sealed class SceneAsset : Object {public string path=>Path;public string name=>Path.Split('/').Last();internal string Path;internal SceneAsset(string path){Path=path;}}
```
