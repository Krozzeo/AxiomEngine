using System.Text.Json;
using System.Text.Json.Nodes;
namespace Axiom.Gameplay;
public sealed class TextAsset : Object {public string name {get;}public string text {get;}public byte[] bytes=>System.Text.Encoding.UTF8.GetBytes(text);internal TextAsset(string path,string value){name=path.Split('/').Last();text=value;}}
public sealed class PrefabAsset : Object {public string name=>Path.Split('/').Last();internal string Path;internal PrefabAsset(string path){Path=path;}}
public sealed class SceneAsset : Object {public string name=>Path.Split('/').Last();internal string Path;internal SceneAsset(string path){Path=path;}}
public static class Resources {
 internal static JsonElement Data=Context.ParseData("[]");
 internal static JsonElement? Find(string path){var all=Data.EnumerateArray().Where(r=>r.GetProperty("path").GetString()==path||r.GetProperty("path").GetString()=="Assets/Resources/"+path||r.GetProperty("path").GetString()=="Assets/Resources/"+path+".json").ToArray();return all.Length==1?all[0]:null;}
 public static T? Load<T>(string path) where T:Object {var resource=Find(path);if(resource==null)return null;var r=resource.Value;Object? value=typeof(T)==typeof(TextAsset)?new TextAsset(path,r.GetProperty("text").GetString()!):typeof(T)==typeof(PrefabAsset)&&r.GetProperty("type").GetString()=="prefab"?new PrefabAsset(r.GetProperty("path").GetString()!):typeof(T)==typeof(SceneAsset)&&r.GetProperty("type").GetString()=="scene"?new SceneAsset(r.GetProperty("path").GetString()!):null;return value as T;}
 public static T[] LoadAll<T>(string path="") where T:Object=>Data.EnumerateArray().Where(r=>r.GetProperty("path").GetString()!.StartsWith(path,StringComparison.Ordinal)).Select(r=>Load<T>(r.GetProperty("path").GetString()!)).OfType<T>().ToArray();
}
public static class PlayerPrefs {
 private static Dictionary<string,string> values=new(StringComparer.Ordinal);
 internal static void Load(JsonElement value){values=value.TryGetProperty("preferences",out var p)?p.EnumerateObject().ToDictionary(p=>p.Name,p=>p.Value.GetString()!):new(StringComparer.Ordinal);}
 private static void Put(string key,string value){if(string.IsNullOrWhiteSpace(key)||key.Length>128||value.Length>4096||!values.ContainsKey(key)&&values.Count>=256)throw new ArgumentException("PlayerPrefs key/value limit exceeded");values[key]=value;}
 public static bool HasKey(string key)=>values.ContainsKey(key);
 public static void DeleteKey(string key)=>values.Remove(key);
 public static void DeleteAll()=>values.Clear();
 public static string GetString(string key,string defaultValue="")=>values.GetValueOrDefault(key,defaultValue);
 public static void SetString(string key,string value)=>Put(key,value);
 public static int GetInt(string key,int defaultValue=0)=>int.TryParse(GetString(key),System.Globalization.NumberStyles.Integer,System.Globalization.CultureInfo.InvariantCulture,out var value)?value:defaultValue;
 public static void SetInt(string key,int value)=>Put(key,value.ToString(System.Globalization.CultureInfo.InvariantCulture));
 public static double GetFloat(string key,double defaultValue=0)=>double.TryParse(GetString(key),System.Globalization.NumberStyles.Float,System.Globalization.CultureInfo.InvariantCulture,out var value)&&double.IsFinite(value)?value:defaultValue;
 public static void SetFloat(string key,double value){if(!double.IsFinite(value))throw new ArgumentException("Non-finite preference");Put(key,value.ToString("R",System.Globalization.CultureInfo.InvariantCulture));}
 public static void Save(){var obj=new JsonObject();foreach(var (key,value) in values)obj[key]=value;var json=obj.ToJsonString();if(System.Text.Encoding.UTF8.GetByteCount(json)>65536)throw new InvalidOperationException("PlayerPrefs exceeds 64 KiB");Context.Add(new("preferences","",null,default,null,Data:json));}
}
public sealed class AsyncOperation {public bool isDone=>true;public double progress=>1;}
public partial class Object {
 public static GameObject Instantiate(PrefabAsset original)=>Context.ImportResource(original.Path,true).First();
 public static GameObject Instantiate(PrefabAsset original,Vector3 position,Quaternion rotation){var root=Instantiate(original);root.transform.position=position;root.transform.rotation=rotation;return root;}
 public static void DontDestroyOnLoad(GameObject target){_=Context.Read(target.Entity);var root=target.transform;while(root.parent!=null)root=root.parent;SceneManagement.SceneManager.Persistent.Add(root.Entity.Id);}
}
internal static partial class Context {
 internal static GameObject[] ImportResource(string path,bool clone){var r=Resources.Find(path)??throw new ArgumentException("Resource unavailable: "+path);if(!r.TryGetProperty("entities",out var source))throw new ArgumentException("Resource is not a scene or prefab");var data=source.EnumerateArray().ToArray();if(data.Length+Spawned>Limits.Spawns||data.Length+Entities.Count>Limits.Entities)throw new InvalidOperationException("Runtime resource creation budget exceeded");var ids=new Dictionary<string,string>();foreach(var e in data){var next=CreateObject(e.GetProperty("name").GetString()!);ids[e.GetProperty("id").GetString()!]=next.Id;Operations.RemoveAt(Operations.Count-1);}
  var imported=new JsonArray();foreach(var e in data){var node=JsonNode.Parse(e.GetRawText())!.AsObject();var oldId=e.GetProperty("id").GetString()!;var id=ids[oldId];node["id"]=id;var parent=e.TryGetProperty("runtimeParentId",out var p)?p.GetString():e.TryGetProperty("parentId",out p)?p.GetString():null;node.Remove("parentId");node["runtimeParentId"]=parent==null?null:ids[parent];node.Remove("prefab");if(clone&&parent==null)node["name"]=node["name"]!.GetValue<string>()[..Math.Min(node["name"]!.GetValue<string>().Length,120)]+" (clone)";var entity=new Entity(id,Generation);EntityData[id]=ParseData(node.ToJsonString());Entities[id]=Transform.Read(e.GetProperty("transform"));Parents[id]=parent==null?null:ids[parent];Refresh(entity);imported.Add(node);SceneManagement.SceneManager.Owners[id]=SceneManagement.SceneManager.GetActiveScene().name;}
  Add(new("import","",null,default,null,Data:imported.ToJsonString()));foreach(var e in data){var id=ids[e.GetProperty("id").GetString()!];if(e.TryGetProperty("scriptComponents",out var components))foreach(var c in components.EnumerateArray()){var factories=RuntimeLifecycle.Factories.Values.Where(f=>f.Path==c.GetProperty("path").GetString()).ToArray();if(Context.LiveScripts.Count>=Limits.Attachments)throw new InvalidOperationException("Script attachment limit exceeded");if(factories.Length!=1)throw new NotSupportedException("Resource script must be included in this project's compiled bundle");var factory=factories[0];var script=factory.Create();script.Entity=new Entity(id,Generation);LiveScripts.Add(script);ScriptPaths[script]=factory.Path;factory.Apply(script,c.GetProperty("values"));}}RuntimeLifecycle.Initialize();return ids.Values.Where(id=>Parents[id]==null).Select(id=>new GameObject(new Entity(id,Generation))).ToArray();
 }
}
