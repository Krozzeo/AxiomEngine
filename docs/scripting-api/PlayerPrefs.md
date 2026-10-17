# PlayerPrefs

Typed string/int/double key-value preferences for the current project and browser origin. Set/Delete change memory; Save explicitly commits a validated snapshot to localStorage. Data survives Stop/Play and browser refresh but is not part of the portable project document, not encrypted and not a save-game file format. Storage denial/quota errors surface as script errors. Up to 256 keys (128 characters/key, 4096 characters/value), 64 KiB total. Invalid stored data is safely treated as empty. Values use invariant numeric culture.

```csharp
var score = PlayerPrefs.GetInt("score", 0) + 1;
PlayerPrefs.SetInt("score", score);
PlayerPrefs.Save();
```

Applications should explicitly save at checkpoints; no implicit save on application close is promised. Test with Input & Persistence API Lab. Data is scoped by project ID, not shared among projects.

## Implemented declarations

```csharp
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
```
