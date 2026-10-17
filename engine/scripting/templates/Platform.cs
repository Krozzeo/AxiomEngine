using System.Text.Json;
namespace Axiom.Gameplay;
public enum RuntimePlatform {WebGLPlayer}
public enum NetworkReachability {NotReachable,ReachableViaLocalAreaNetwork}
public enum OperatingSystemFamily {Other,MacOSX,Windows,Linux}
public readonly record struct Resolution(int width,int height,double refreshRate);
public static class Application {
 internal static JsonElement Data=Context.ParseData("{}");
 internal static string Text(string name,string fallback="")=>Data.TryGetProperty(name,out var v)?v.GetString()??fallback:fallback;
 internal static int Number(string name,int fallback=0)=>Data.TryGetProperty(name,out var v)?v.GetInt32():fallback;
 public static bool isEditor=>true;internal static bool Running;public static bool isPlaying=>Running;
 public static RuntimePlatform platform=>RuntimePlatform.WebGLPlayer;
 public static string version=>Text("version","0.0.48");public static string unityVersion=>throw new NotSupportedException("Use Application.axiomVersion");public static string axiomVersion=>version;
 public static string productName=>Text("productName","Axiom Project");public static string identifier=>Text("projectId");
 public static string absoluteURL=>Text("absoluteURL");public static string persistentDataPath=>"playerprefs://"+identifier;
 public static NetworkReachability internetReachability=>Data.TryGetProperty("online",out var online)&&!online.GetBoolean()?NetworkReachability.NotReachable:NetworkReachability.ReachableViaLocalAreaNetwork;
 public static string dataPath=>"project://"+identifier;
}
public static class Screen {
 public static int width=>Application.Number("width",960);public static int height=>Application.Number("height",540);
 public static double dpi=>Application.Number("dpi",96);public static Resolution currentResolution=>new(width,height,0);
 public static Rect safeArea=>new(0,0,width,height);
}
public static class SystemInfo {
 public static string operatingSystem=>Application.Text("operatingSystem","Browser");
 public static OperatingSystemFamily operatingSystemFamily=>operatingSystem.Contains("Windows")?OperatingSystemFamily.Windows:operatingSystem.Contains("Mac")?OperatingSystemFamily.MacOSX:operatingSystem.Contains("Linux")?OperatingSystemFamily.Linux:OperatingSystemFamily.Other;
 public static int processorCount=>Application.Number("processorCount",1);public static string graphicsDeviceType=>Application.Text("graphicsDeviceType","unknown");public static bool supportsComputeShaders=>graphicsDeviceType=="webgpu";
}
public static class JsonUtility {
 // Explicit public-field serializer. Reflection roots are preserved for compiled script classes.
 public static string ToJson<[System.Diagnostics.CodeAnalysis.DynamicallyAccessedMembers(System.Diagnostics.CodeAnalysis.DynamicallyAccessedMemberTypes.PublicFields)]T>(T value,bool prettyPrint=false){using var stream=new MemoryStream();using(var writer=new Utf8JsonWriter(stream,new JsonWriterOptions{Indented=prettyPrint})){writer.WriteStartObject();foreach(var f in typeof(T).GetFields(System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.Public)){writer.WritePropertyName(f.Name);Write(writer,f.GetValue(value));}writer.WriteEndObject();}return System.Text.Encoding.UTF8.GetString(stream.ToArray());}
 private static void Write(Utf8JsonWriter w,object? v){switch(v){case null:w.WriteNullValue();break;case string s:w.WriteStringValue(s);break;case bool b:w.WriteBooleanValue(b);break;case int n:w.WriteNumberValue(n);break;case double n:w.WriteNumberValue(n);break;case float n:w.WriteNumberValue(n);break;case long n:w.WriteNumberValue(n);break;case Vector2 p:w.WriteStartObject();w.WriteNumber("x",p.X);w.WriteNumber("y",p.Y);w.WriteEndObject();break;case Vector3 p:w.WriteStartObject();w.WriteNumber("x",p.X);w.WriteNumber("y",p.Y);w.WriteNumber("z",p.Z);w.WriteEndObject();break;default:throw new NotSupportedException("JsonUtility supports primitive public fields and Vector2/Vector3; unsupported value "+v.GetType().Name);}}
 public static T FromJson<[System.Diagnostics.CodeAnalysis.DynamicallyAccessedMembers(System.Diagnostics.CodeAnalysis.DynamicallyAccessedMemberTypes.PublicFields|System.Diagnostics.CodeAnalysis.DynamicallyAccessedMemberTypes.PublicParameterlessConstructor)]T>(string json) where T:new(){var value=new T();FromJsonOverwrite(json,value);return value;}
 public static void FromJsonOverwrite<[System.Diagnostics.CodeAnalysis.DynamicallyAccessedMembers(System.Diagnostics.CodeAnalysis.DynamicallyAccessedMemberTypes.PublicFields)]T>(string json,T target){using var doc=JsonDocument.Parse(json);foreach(var f in typeof(T).GetFields(System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.Public)){if(f.IsInitOnly||!doc.RootElement.TryGetProperty(f.Name,out var v))continue;object? parsed=f.FieldType==typeof(string)?v.GetString():f.FieldType==typeof(bool)?v.GetBoolean():f.FieldType==typeof(int)?v.GetInt32():f.FieldType==typeof(double)?v.GetDouble():f.FieldType==typeof(float)?v.GetSingle():f.FieldType==typeof(long)?v.GetInt64():f.FieldType==typeof(Vector2)?new Vector2(v.GetProperty("x").GetDouble(),v.GetProperty("y").GetDouble()):f.FieldType==typeof(Vector3)?new Vector3(v.GetProperty("x").GetDouble(),v.GetProperty("y").GetDouble(),v.GetProperty("z").GetDouble()):throw new NotSupportedException("Unsupported JSON field "+f.Name);f.SetValue(target,parsed);}}
}

public static class RuntimeStats {internal static JsonElement Data=Context.ParseData("{}");private static double Read(string key)=>Data.TryGetProperty(key,out var v)&&v.ValueKind==JsonValueKind.Number?v.GetDouble():0;public static double framesPerSecond=>Read("fps");public static int physicsBodies=>(int)Read("bodies");public static int contacts=>(int)Read("contacts");public static double frameMilliseconds=>Read("frameMs");}
