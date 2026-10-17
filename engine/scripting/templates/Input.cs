using System.Text.Json;
using System.Text.Json.Nodes;
namespace Axiom.Gameplay;
public enum TouchPhase {Began,Moved,Stationary,Ended,Canceled}
public readonly record struct Touch(int fingerId,Vector2 position,Vector2 deltaPosition,TouchPhase phase,double pressure);
public static partial class Input {
 private static JsonElement devices=Context.ParseData("{}"),previous=Context.ParseData("{}");
 private static readonly Dictionary<string,string[]> bindings=new(StringComparer.Ordinal);
 private static readonly Dictionary<string,(string Negative,string Positive)> axes=new(StringComparer.Ordinal);
 internal static void Load(JsonElement value,bool advance){if(advance)previous=devices;devices=value.TryGetProperty("input",out var d)?d.Clone():Context.ParseData("{}");if(advance&&value.GetProperty("action").GetString()=="start"){previous=Context.ParseData("{}");bindings.Clear();axes.Clear();}}
 private static JsonElement Array(JsonElement root,string key)=>root.TryGetProperty(key,out var v)&&v.ValueKind==JsonValueKind.Array?v:Context.ParseData("[]");
 private static bool Held(string binding,bool old=false){var state=old?previous:devices;if(binding.StartsWith("Mouse"))return Array(state,"buttons").EnumerateArray().Any(v=>v.GetString()==binding);if(binding.StartsWith("Gamepad")){var parts=binding.Split('/');if(parts.Length!=2||!int.TryParse(parts[0][7..],out var pad)||!parts[1].StartsWith("Button")||!int.TryParse(parts[1][6..],out var button))return false;return Array(state,"gamepads").EnumerateArray().Any(p=>p.GetProperty("index").GetInt32()==pad&&button>=0&&button<p.GetProperty("buttons").GetArrayLength()&&p.GetProperty("buttons")[button].GetDouble()>.5);}return (old?Context.PreviousKeys:Context.Keys).Contains(binding);}
 private static Vector2 Pair(string key){var v=Array(devices,key);return v.GetArrayLength()==2?new(v[0].GetDouble(),v[1].GetDouble()):Vector2.zero;}
 public static bool GetKey(string code)=>Held(code);public static bool GetKeyDown(string code)=>Held(code)&&!Held(code,true);public static bool GetKeyUp(string code)=>!Held(code)&&Held(code,true);
 public static Vector3 mousePosition {get{var p=Pair("mousePosition");return new(p.X,p.Y,0);}}
 public static Vector2 mouseScrollDelta=>Pair("mouseScrollDelta");
 public static bool anyKey=>Context.Keys.Count>0||Array(devices,"buttons").GetArrayLength()>0;
 public static bool anyKeyDown=>Context.Keys.Any(k=>!Context.PreviousKeys.Contains(k))||Array(devices,"buttons").EnumerateArray().Any(k=>!Held(k.GetString()!,true));
 public static bool GetMouseButton(int button)=>Held("Mouse"+MouseButton(button));
 public static bool GetMouseButtonDown(int button)=>GetMouseButton(button)&&!Held("Mouse"+button,true);
 public static bool GetMouseButtonUp(int button)=>!GetMouseButton(button)&&Held("Mouse"+button,true);
 private static int MouseButton(int i)=>i is >=0 and <=4?i:throw new ArgumentOutOfRangeException(nameof(i));
 public static int touchCount=>Array(devices,"touches").GetArrayLength();
 public static Touch GetTouch(int index){var a=Array(devices,"touches");if(index<0||index>=a.GetArrayLength())throw new ArgumentOutOfRangeException(nameof(index));var t=a[index];var p=t.GetProperty("position");var d=t.GetProperty("deltaPosition");return new(t.GetProperty("fingerId").GetInt32(),new(p[0].GetDouble(),p[1].GetDouble()),new(d[0].GetDouble(),d[1].GetDouble()),Enum.Parse<TouchPhase>(t.GetProperty("phase").GetString()!),t.GetProperty("pressure").GetDouble());}
 public static Touch[] touches=>Enumerable.Range(0,touchCount).Select(GetTouch).ToArray();
 public static string[] GetJoystickNames()=>Array(devices,"gamepads").EnumerateArray().OrderBy(p=>p.GetProperty("index").GetInt32()).Select(p=>p.GetProperty("name").GetString()!).ToArray();
 public static double GetGamepadAxis(int gamepad,int axis,double deadZone=.15){if(gamepad<0||axis<0||axis>=16||deadZone<0||deadZone>=1)throw new ArgumentOutOfRangeException();foreach(var p in Array(devices,"gamepads").EnumerateArray())if(p.GetProperty("index").GetInt32()==gamepad&&axis<p.GetProperty("axes").GetArrayLength()){var v=p.GetProperty("axes")[axis].GetDouble();return Math.Abs(v)<=deadZone?0:Math.Sign(v)*(Math.Abs(v)-deadZone)/(1-deadZone);}return 0;}
 public static bool GetGamepadButton(int gamepad,int button)=>Held($"Gamepad{gamepad}/Button{button}");
 private static string[] Bindings(string name)=>bindings.TryGetValue(name,out var value)?value:name switch {"Jump"=>new[]{"Space","Gamepad0/Button0"},"Fire1"=>new[]{"Mouse0","Gamepad0/Button7"},"Submit"=>new[]{"Enter","Gamepad0/Button0"},"Cancel"=>new[]{"Escape","Gamepad0/Button1"},_=>throw new ArgumentException("Unknown input action "+name)};
 public static bool GetButton(string name)=>Bindings(name).Any(b=>Held(b));
 public static bool GetButtonDown(string name)=>GetButton(name)&&!Bindings(name).Any(b=>Held(b,true));
 public static bool GetButtonUp(string name)=>!GetButton(name)&&Bindings(name).Any(b=>Held(b,true));
 public static void RebindButton(string name,params string[] controls){if(string.IsNullOrWhiteSpace(name)||name.Length>64||controls.Length is <1 or >8||controls.Any(c=>c.Length>64||string.IsNullOrWhiteSpace(c))||!bindings.ContainsKey(name)&&bindings.Count>=64)throw new ArgumentException("Invalid action binding");bindings[name]=controls.ToArray();}
 public static void RebindAxis(string name,string negative,string positive){if(string.IsNullOrWhiteSpace(name)||name.Length>64||negative.Length>64||positive.Length>64||!axes.ContainsKey(name)&&axes.Count>=32)throw new ArgumentException("Invalid axis binding");axes[name]=(negative,positive);}
 public static string SaveBindingOverridesAsJson(){var b=new JsonObject();foreach(var (name,controls) in bindings){var array=new JsonArray();foreach(var control in controls)array.Add(control);b[name]=array;}var a=new JsonObject();foreach(var (name,pair) in axes)a[name]=new JsonArray(pair.Negative,pair.Positive);return new JsonObject{["buttons"]=b,["axes"]=a}.ToJsonString();}
 public static void LoadBindingOverridesFromJson(string json){if(json.Length>16384)throw new ArgumentException("Bindings too large");using var d=JsonDocument.Parse(json);foreach(var p in d.RootElement.GetProperty("buttons").EnumerateObject())RebindButton(p.Name,p.Value.EnumerateArray().Select(v=>v.GetString()!).ToArray());foreach(var p in d.RootElement.GetProperty("axes").EnumerateObject())RebindAxis(p.Name,p.Value[0].GetString()!,p.Value[1].GetString()!);}
 internal static double NamedAxis(string axis){if(axes.TryGetValue(axis,out var binding))return (Held(binding.Positive)?1:0)-(Held(binding.Negative)?1:0);return axis switch {"Horizontal"=>Math.Clamp(Axis("KeyA","KeyD")+Axis("ArrowLeft","ArrowRight")+GetGamepadAxis(0,0),-1,1),"Vertical"=>Math.Clamp(Axis("KeyS","KeyW")+Axis("ArrowDown","ArrowUp")-GetGamepadAxis(0,1),-1,1),"Mouse X"=>MouseDelta.X,"Mouse Y"=>MouseDelta.Y,"Mouse ScrollWheel"=>mouseScrollDelta.Y,_=>throw new ArgumentException("Unknown input axis "+axis)};}
}
