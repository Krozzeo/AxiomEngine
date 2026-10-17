# Application and system information

Read canvas dimensions, browser/platform hints, project identity and runtime performance. persistentDataPath is a logical PlayerPrefs URI, not a native filesystem path. No arbitrary filesystem access, window resizing, OS launching or truthful GPU model/refresh-rate measurement is claimed. currentResolution.refreshRate=0 means unknown; dpi=96 is CSS baseline. Network reachability is the browser online hint, not a connectivity test.


## Implemented declarations

```csharp
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

public enum RuntimePlatform {WebGLPlayer}

public enum NetworkReachability {NotReachable,ReachableViaLocalAreaNetwork}

public enum OperatingSystemFamily {Other,MacOSX,Windows,Linux}

public readonly record struct Resolution(int width,int height,double refreshRate);

public static class RuntimeStats {internal static JsonElement Data=Context.ParseData("{}");private static double Read(string key)=>Data.TryGetProperty(key,out var v)&&v.ValueKind==JsonValueKind.Number?v.GetDouble():0;public static double framesPerSecond=>Read("fps");public static int physicsBodies=>(int)Read("bodies");public static int contacts=>(int)Read("contacts");public static double frameMilliseconds=>Read("frameMs");}
```
