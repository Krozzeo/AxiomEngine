using System.Text.Json;
namespace Axiom.Gameplay;

public record struct Vector2(double X, double Y) {
 public double x {get=>X;set=>X=value;}
 public double y {get=>Y;set=>Y=value;}
 public static Vector2 zero=>Zero;public static Vector2 one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>X*X+Y*Y;
 public Vector2 normalized=>Normalized;public void Normalize(){this=Normalized;}public static Vector2 Normalize(Vector2 v)=>v.Normalized;public static double Distance(Vector2 a,Vector2 b)=>(a-b).Magnitude;public static Vector2 operator -(Vector2 v)=>v*(-1);public static Vector2 operator /(Vector2 v,double n)=>v*(1/n);public static Vector2 operator *(double n,Vector2 v)=>v*n;

 public static Vector2 up=>new(0,1);public static Vector2 down=>new(0,-1);public static Vector2 right=>new(1,0);public static Vector2 left=>new(-1,0);
 public static Vector2 Zero => new(0,0);
 public static Vector2 One => new(1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y);
 public static Vector2 operator +(Vector2 a,Vector2 b) => new(a.X+b.X,a.Y+b.Y);
 public static Vector2 operator -(Vector2 a,Vector2 b) => new(a.X-b.X,a.Y-b.Y);
 public static Vector2 operator *(Vector2 a,double b) => new(a.X*b,a.Y*b);
 internal static Vector2 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble());
 public Vector2 Normalized => Magnitude>1e-12?this*(1/Magnitude):Zero;
 public static double Dot(Vector2 a,Vector2 b) => a.X*b.X+a.Y*b.Y;
 public static Vector2 Lerp(Vector2 a,Vector2 b,double t) => a+(b-a)*Math.Clamp(t,0,1);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteEndArray();}
}
public record struct Vector3(double X, double Y, double Z) {
 public double x {get=>X;set=>X=value;}
 public double y {get=>Y;set=>Y=value;}
 public double z {get=>Z;set=>Z=value;}
 public static Vector3 zero=>Zero;public static Vector3 one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>X*X+Y*Y+Z*Z;
 public Vector3 normalized=>Normalized;public void Normalize(){this=Normalized;}public static Vector3 Normalize(Vector3 v)=>v.Normalized;public static double Distance(Vector3 a,Vector3 b)=>(a-b).Magnitude;public static Vector3 operator -(Vector3 v)=>v*(-1);public static Vector3 operator /(Vector3 v,double n)=>v*(1/n);public static Vector3 operator *(double n,Vector3 v)=>v*n;

 public static Vector3 Zero => new(0,0,0);
 public static Vector3 One => new(1,1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y+Z*Z);
 public static Vector3 operator +(Vector3 a,Vector3 b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
 public static Vector3 operator -(Vector3 a,Vector3 b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z);
 public static Vector3 operator *(Vector3 a,double b) => new(a.X*b,a.Y*b,a.Z*b);
 internal static Vector3 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble());
 public Vector3 Normalized => Magnitude>1e-12?this*(1/Magnitude):Zero;
 public static double Dot(Vector3 a,Vector3 b) => a.X*b.X+a.Y*b.Y+a.Z*b.Z;
 public static Vector3 Lerp(Vector3 a,Vector3 b,double t) => a+(b-a)*Math.Clamp(t,0,1);
 public static Vector3 up=>new(0,1,0);public static Vector3 down=>new(0,-1,0);public static Vector3 right=>new(1,0,0);public static Vector3 left=>new(-1,0,0);public static Vector3 forward=>new(0,0,1);public static Vector3 back=>new(0,0,-1);
 public static Vector3 Up => new(0,1,0);public static Vector3 Right => new(1,0,0);public static Vector3 Forward => new(0,0,-1);
 public static Vector3 Cross(Vector3 a,Vector3 b) => new(a.Y*b.Z-a.Z*b.Y,a.Z*b.X-a.X*b.Z,a.X*b.Y-a.Y*b.X);
 public static Vector3 operator +(Vector3 a,Vec3 b)=>a+(Vector3)b;
 public static Vector3 operator +(Vec3 a,Vector3 b)=>(Vector3)a+b;
 public static Vector3 operator -(Vector3 a,Vec3 b)=>a-(Vector3)b;
 public static Vector3 operator -(Vec3 a,Vector3 b)=>(Vector3)a-b;
 public static implicit operator Vector3(Vec3 v) => new(v.X,v.Y,v.Z);public static implicit operator Vec3(Vector3 v) => new(v.X,v.Y,v.Z);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
public record struct Vector4(double X, double Y, double Z, double W) {
 public double x {get=>X;set=>X=value;}
 public double y {get=>Y;set=>Y=value;}
 public double z {get=>Z;set=>Z=value;}
 public double w {get=>W;set=>W=value;}
 public static Vector4 zero=>Zero;public static Vector4 one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>X*X+Y*Y+Z*Z+W*W;
 public Vector4 normalized=>Normalized;public void Normalize(){this=Normalized;}public static Vector4 Normalize(Vector4 v)=>v.Normalized;public static double Distance(Vector4 a,Vector4 b)=>(a-b).Magnitude;public static Vector4 operator -(Vector4 v)=>v*(-1);public static Vector4 operator /(Vector4 v,double n)=>v*(1/n);public static Vector4 operator *(double n,Vector4 v)=>v*n;

 public static Vector4 Zero => new(0,0,0,0);
 public static Vector4 One => new(1,1,1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y+Z*Z+W*W);
 public static Vector4 operator +(Vector4 a,Vector4 b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z,a.W+b.W);
 public static Vector4 operator -(Vector4 a,Vector4 b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z,a.W-b.W);
 public static Vector4 operator *(Vector4 a,double b) => new(a.X*b,a.Y*b,a.Z*b,a.W*b);
 internal static Vector4 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());
 public Vector4 Normalized => Magnitude>1e-12?this*(1/Magnitude):Zero;
 public static double Dot(Vector4 a,Vector4 b) => a.X*b.X+a.Y*b.Y+a.Z*b.Z+a.W*b.W;
 public static Vector4 Lerp(Vector4 a,Vector4 b,double t) => a+(b-a)*Math.Clamp(t,0,1);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteNumberValue(W);w.WriteEndArray();}
}
public record struct Vector2Int(int X, int Y) {
 public int x {get=>X;set=>X=value;}
 public int y {get=>Y;set=>Y=value;}
 public static Vector2Int zero=>Zero;public static Vector2Int one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>(double)X*X+(double)Y*Y;

 public static Vector2Int Zero => new(0,0);
 public static Vector2Int One => new(1,1);
 public double Magnitude => Math.Sqrt((double)X*X+(double)Y*Y);
 public static Vector2Int operator +(Vector2Int a,Vector2Int b) => new(a.X+b.X,a.Y+b.Y);
 public static Vector2Int operator -(Vector2Int a,Vector2Int b) => new(a.X-b.X,a.Y-b.Y);
 public static Vector2Int operator *(Vector2Int a,int b) => new(a.X*b,a.Y*b);
 internal static Vector2Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32());
 public static implicit operator Vector2(Vector2Int v) => new(v.X,v.Y);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteEndArray();}
}
public record struct Vector3Int(int X, int Y, int Z) {
 public int x {get=>X;set=>X=value;}
 public int y {get=>Y;set=>Y=value;}
 public int z {get=>Z;set=>Z=value;}
 public static Vector3Int zero=>Zero;public static Vector3Int one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>(double)X*X+(double)Y*Y+(double)Z*Z;

 public static Vector3Int Zero => new(0,0,0);
 public static Vector3Int One => new(1,1,1);
 public double Magnitude => Math.Sqrt((double)X*X+(double)Y*Y+(double)Z*Z);
 public static Vector3Int operator +(Vector3Int a,Vector3Int b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
 public static Vector3Int operator -(Vector3Int a,Vector3Int b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z);
 public static Vector3Int operator *(Vector3Int a,int b) => new(a.X*b,a.Y*b,a.Z*b);
 internal static Vector3Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32(),e[2].GetInt32());
 public static implicit operator Vector3(Vector3Int v) => new(v.X,v.Y,v.Z);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
public record struct Vector4Int(int X, int Y, int Z, int W) {
 public int x {get=>X;set=>X=value;}
 public int y {get=>Y;set=>Y=value;}
 public int z {get=>Z;set=>Z=value;}
 public int w {get=>W;set=>W=value;}
 public static Vector4Int zero=>Zero;public static Vector4Int one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>(double)X*X+(double)Y*Y+(double)Z*Z+(double)W*W;

 public static Vector4Int Zero => new(0,0,0,0);
 public static Vector4Int One => new(1,1,1,1);
 public double Magnitude => Math.Sqrt((double)X*X+(double)Y*Y+(double)Z*Z+(double)W*W);
 public static Vector4Int operator +(Vector4Int a,Vector4Int b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z,a.W+b.W);
 public static Vector4Int operator -(Vector4Int a,Vector4Int b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z,a.W-b.W);
 public static Vector4Int operator *(Vector4Int a,int b) => new(a.X*b,a.Y*b,a.Z*b,a.W*b);
 internal static Vector4Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32(),e[2].GetInt32(),e[3].GetInt32());
 public static implicit operator Vector4(Vector4Int v) => new(v.X,v.Y,v.Z,v.W);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteNumberValue(W);w.WriteEndArray();}
}
public readonly record struct Quaternion(double X,double Y,double Z,double W) {
 public static Quaternion identity=>Identity;
 public static Quaternion Euler(double x,double y,double z)=>Euler(new Vector3(x,y,z));
 public static Quaternion operator *(Quaternion a,Quaternion b)=>new(a.W*b.X+a.X*b.W+a.Y*b.Z-a.Z*b.Y,a.W*b.Y-a.X*b.Z+a.Y*b.W+a.Z*b.X,a.W*b.Z+a.X*b.Y-a.Y*b.X+a.Z*b.W,a.W*b.W-a.X*b.X-a.Y*b.Y-a.Z*b.Z);
 public static Vector3 operator *(Quaternion q,Vector3 v){var u=new Vector3(q.X,q.Y,q.Z);return v+2*Vector3.Cross(u,Vector3.Cross(u,v)+q.W*v);}
 public static Quaternion Inverse(Quaternion q){var n=q.X*q.X+q.Y*q.Y+q.Z*q.Z+q.W*q.W;if(n<1e-20)throw new ArgumentException("Zero quaternion");return new(-q.X/n,-q.Y/n,-q.Z/n,q.W/n);}
 public static Quaternion AngleAxis(double angle,Vector3 axis){var u=axis.normalized;var a=angle*Math.PI/360;return new(u.X*Math.Sin(a),u.Y*Math.Sin(a),u.Z*Math.Sin(a),Math.Cos(a));}
 public static Quaternion Identity => new(0,0,0,1);
 public static Quaternion Euler(Vector3 degrees) {var x=degrees.X*Math.PI/360;var y=degrees.Y*Math.PI/360;var z=degrees.Z*Math.PI/360;var cx=Math.Cos(x);var sx=Math.Sin(x);var cy=Math.Cos(y);var sy=Math.Sin(y);var cz=Math.Cos(z);var sz=Math.Sin(z);return new(sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz);}
 public static implicit operator Quat(Quaternion q)=>new(q.X,q.Y,q.Z,q.W);public static implicit operator Quaternion(Quat q)=>new(q.X,q.Y,q.Z,q.W);
 internal static Quaternion Read(JsonElement e)=>new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());
}
public readonly record struct Color(double R,double G,double B,double A=1) {public static Color White=>new(1,1,1,1);public static Color Black=>new(0,0,0,1);}
public readonly record struct Color32(byte R,byte G,byte B,byte A=255);
public readonly record struct Rect(double X,double Y,double Width,double Height);
public readonly record struct Bounds(Vector3 Center,Vector3 Size);
public abstract partial class MonoBehaviour : Script {
 public virtual void OnCollisionEnter(Collision collision){}public virtual void OnCollisionStay(Collision collision){}public virtual void OnCollisionExit(Collision collision){}
 public virtual void OnTriggerEnter(Collider other){}public virtual void OnTriggerStay(Collider other){}public virtual void OnTriggerExit(Collider other){}
 public virtual void OnCollisionEnter2D(Collision2D collision){}public virtual void OnCollisionStay2D(Collision2D collision){}public virtual void OnCollisionExit2D(Collision2D collision){}
 public virtual void OnTriggerEnter2D(Collider2D other){}public virtual void OnTriggerStay2D(Collider2D other){}public virtual void OnTriggerExit2D(Collider2D other){}
 public virtual void Awake(){}public virtual void OnEnable(){}public virtual void Start(){}public virtual void Update(){}public virtual void FixedUpdate(){}public virtual void LateUpdate(){}public virtual void OnDisable(){}public virtual void OnDestroy(){}
 public override void OnStart(){}
 public override void OnUpdate(double deltaSeconds){Update();}
 public override void OnStop(){}
}
[AttributeUsage(AttributeTargets.Field)] public sealed class SerializeFieldAttribute : Attribute {}
[AttributeUsage(AttributeTargets.Field)] public sealed class HideInInspectorAttribute : Attribute {}
[AttributeUsage(AttributeTargets.Field)] public sealed class PlayerPrefAttribute(string key) : Attribute {public string Key {get;}=key;}
[AttributeUsage(AttributeTargets.Field)] public sealed class ReadOnlyAttribute : Attribute {}
[AttributeUsage(AttributeTargets.Field)] public sealed class TitleAttribute(string text) : Attribute {public string Text {get;}=text;}
[AttributeUsage(AttributeTargets.Field)] public sealed class HeaderAttribute(string text) : Attribute {public string Text {get;}=text;}
[AttributeUsage(AttributeTargets.Field)] public sealed class SpaceAttribute(double height=8) : Attribute {public double Height {get;}=height;}
[AttributeUsage(AttributeTargets.Field)] public sealed class TooltipAttribute(string text) : Attribute {public string Text {get;}=text;}
[AttributeUsage(AttributeTargets.Field)] public sealed class RangeAttribute(double minimum,double maximum) : Attribute {public double Minimum {get;}=minimum;public double Maximum {get;}=maximum;}
public static partial class Mathf {public const double PI=Math.PI;public const double Deg2Rad=Math.PI/180;public const double Rad2Deg=180/Math.PI;public static double Clamp(double value,double min,double max)=>Math.Clamp(value,min,max);public static double Lerp(double a,double b,double t)=>a+(b-a)*Math.Clamp(t,0,1);}
public readonly record struct Vec3(double X, double Y, double Z) {
 public static Vec3 operator +(Vec3 a, Vec3 b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
 public static Vec3 operator *(Vec3 a, double b) => new(a.X*b,a.Y*b,a.Z*b);
 internal static Vec3 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble());
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
public readonly record struct Quat(double X, double Y, double Z, double W) {
 internal static Quat Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());
}
public readonly record struct Entity(string Id, int Generation) {
 public Transform Transform => Context.Read(this);
 public RigidBody RigidBody => Context.ReadBody(this);
 public void SetVelocity(Vec3 velocity) => Context.Velocity(this,velocity);
 public void Move(Vec3 delta) => SetPosition(Transform.Position+(Vector3)delta);
 public void SetPosition(Vec3 position) => Context.Move(this,position);
 public void SetRotation(Quaternion rotation) => Context.Rotate(this,rotation);
 public bool IsGrounded => Context.Grounded.Contains(Id);
 public Entity FindChildWithCamera() => Context.FindCamera(this);
 public string? CurrentAnimation => Context.AnimationState(this,"currentAnimation");
 public string? WhyAnimationNotPlaying => Context.AnimationState(this,"whyAnimationNotPlaying");
 public void SetAnimationParameter(string name,double value) => Context.Animate(this,"parameter",name,value,0);
 public void PlayAnimation(string state,double crossfadeSeconds=0.3) => Context.Animate(this,"state",state,0,crossfadeSeconds);
 public void PauseAnimation() => Context.Animate(this,"pause",null,0,0);
 public void ResumeAnimation() => Context.Animate(this,"resume",null,0,0);
 public void PlayAudio() => Context.Audio(this,"play",0);
 public void PauseAudio() => Context.Audio(this,"pause",0);
 public void ResumeAudio() => Context.Audio(this,"resume",0);
 public void StopAudio() => Context.Audio(this,"stop",0);
 public void SetAudioVolume(double volume) => Context.Audio(this,"volume",volume);
 public Entity Spawn(Vec3 position) => Context.Spawn(this,position);
}
public abstract class Script : Behaviour {
 public virtual void OnStart() {}
 public virtual void OnUpdate(double deltaSeconds) {}
 public virtual void OnStop() {}
}
public static class ReplayRandom {
 private static uint state=1;
 internal static void Reset(uint seed) => state=seed;
 public static double NextDouble() {state=unchecked(state*1664525u+1013904223u);return state/4294967296.0;}
}
public static partial class Input {
 public static Vector2 MouseDelta => Context.MouseDelta;
 public static bool IsDown(string code) => Context.Keys.Contains(code);
 public static double Axis(string negative, string positive) => (IsDown(positive)?1:0)-(IsDown(negative)?1:0);
}
public static class Debug {
 public static void Log(object? value)=>Axiom.Gameplay.Log.Info(value?.ToString()??"");
 public static void LogWarning(object? value)=>Axiom.Gameplay.Log.Info("Warning: "+value);
 public static void LogError(object? value)=>Axiom.Gameplay.Log.Info("Error: "+value);
}
public static class Log {public static void Info(string message) => Context.Log(message);}
internal readonly record struct Operation(string Kind,string Id,string? Template,Vec3 Position,string? Message,string? Action=null,string? Name=null,double Value=0,double Duration=0,Quaternion? Rotation=null,string? Data=null);
internal static partial class Context {
 internal static readonly List<Script> LiveScripts=new();
 internal static readonly Dictionary<string,bool> ActiveStates=new();
 internal static readonly Dictionary<string,List<JsonElement>> PreviousContacts=new();
 internal static int Generation;
 internal static bool DeterministicSpawn;
 internal static uint ReplaySeed;
 internal static readonly Dictionary<string,Transform> Entities = new();
 internal static readonly Dictionary<string,JsonElement> EntityData=new();
 internal static readonly HashSet<string> PreviousKeys=new();
 internal static readonly Dictionary<string,RigidBody> Bodies = new();
 internal static readonly Dictionary<string,JsonElement> Animators = new();
 internal static readonly Dictionary<string,JsonElement> AnimationStates = new();
 internal static readonly HashSet<string> AudioSources = new();
 internal static readonly HashSet<string> Keys = new();
 internal static readonly HashSet<string> Grounded = new();
 internal static readonly Dictionary<string,string?> Parents = new();
 internal static readonly HashSet<string> Cameras = new();
 internal static Vector2 MouseDelta;
 internal static readonly List<Operation> Operations = new();
 internal static int Spawned,Logs;
 internal static Transform Read(Entity entity) {
  if(entity.Generation!=Generation||!Entities.TryGetValue(entity.Id,out var value))throw new InvalidOperationException("AX_SCRIPT_0002: stale entity handle");
  value.Entity=entity;return value;
 }
 internal static RigidBody ReadBody(Entity entity) {
  _=Read(entity);if(!Bodies.TryGetValue(entity.Id,out var body))throw new InvalidOperationException("AX_PHYSICS_0001: entity has no rigid body");return body;
 }
 internal static string? AnimationState(Entity entity,string field) {
  _=Read(entity);if(!Animators.ContainsKey(entity.Id))throw new InvalidOperationException("AX_ANIMATION_0001: entity has no Animator");
  return AnimationStates.TryGetValue(entity.Id,out var state)&&state.TryGetProperty(field,out var value)&&value.ValueKind==JsonValueKind.String?value.GetString():null;
 }
 internal static void Animate(Entity entity,string action,string? name,double value,double duration) {
  _=Read(entity);if(!Animators.TryGetValue(entity.Id,out var a))throw new InvalidOperationException("AX_ANIMATION_0001: entity has no Animator");
  if(!double.IsFinite(value)||Math.Abs(value)>1000000||!double.IsFinite(duration)||duration<0||duration>5)throw new ArgumentException("AX_ANIMATION_0001: invalid parameter/fade");
  if(action=="state"&&!a.GetProperty("states").EnumerateArray().Any(s=>s.GetProperty("name").GetString()==name)||action=="parameter"&&!a.GetProperty("parameters").EnumerateArray().Any(p=>p.GetProperty("name").GetString()==name))throw new ArgumentException("AX_ANIMATION_0001: unknown state/parameter");
  if(action=="parameter"){var node=System.Text.Json.Nodes.JsonNode.Parse(EntityData[entity.Id].GetRawText())!.AsObject();foreach(var parameter in node["animator"]!["parameters"]!.AsArray())if(parameter!["name"]!.GetValue<string>()==name)parameter["value"]=value;EntityData[entity.Id]=ParseData(node.ToJsonString());Animators[entity.Id]=EntityData[entity.Id].GetProperty("animator");}
  Add(new("animation",entity.Id,null,default,null,action,name,value,duration));
 }
 internal static void Audio(Entity entity,string action,double value) {
  _=Read(entity);if(!AudioSources.Contains(entity.Id)||!double.IsFinite(value)||value<0||value>1)throw new ArgumentException("AX_AUDIO_0001: invalid source or volume");
  if(action=="volume"){var node=System.Text.Json.Nodes.JsonNode.Parse(EntityData[entity.Id].GetRawText())!.AsObject();node["audioSource"]!["volume"]=value;EntityData[entity.Id]=ParseData(node.ToJsonString());}
  Add(new("audio",entity.Id,null,default,null,action,null,value));
 }
 internal static void Velocity(Entity entity,Vec3 velocity) {
  _=ReadBody(entity);Position(velocity);if(Math.Max(Math.Abs(velocity.X),Math.Max(Math.Abs(velocity.Y),Math.Abs(velocity.Z)))>10000)throw new ArgumentException("AX_PHYSICS_0001: invalid velocity");
  if(Context.EntityData[entity.Id].TryGetProperty("runtimeStatic",out var fixedBody)&&fixedBody.GetBoolean()&&(velocity.X!=0||velocity.Y!=0||velocity.Z!=0))return;
  if((velocity.X!=0||velocity.Y!=0||velocity.Z!=0)&&PhysicsData.Body(entity).TryGetProperty("sleeping",out var sleep)&&sleep.GetBoolean())PhysicsData.Set(entity,"rigidBody","sleeping",System.Text.Json.Nodes.JsonValue.Create(false)!);Add(new("velocity",entity.Id,null,velocity,null));Bodies[entity.Id]=new RigidBody(velocity);PhysicsData.VelocityData(entity,velocity);
 }
 internal static void Add(Operation operation) {
  if(Operations.Count>=Limits.Operations)throw new InvalidOperationException("AX_SCRIPT_0003: operation limit exceeded");
  Operations.Add(operation);
 }
 private static void Position(Vec3 value) {
  if(!double.IsFinite(value.X)||!double.IsFinite(value.Y)||!double.IsFinite(value.Z)||Math.Max(Math.Abs(value.X),Math.Max(Math.Abs(value.Y),Math.Abs(value.Z)))>1000000)throw new ArgumentException("AX_SCRIPT_0003: invalid position");
 }
 internal static Entity FindCamera(Entity entity) {
  _=Read(entity);foreach(var id in Cameras){var parent=Parents.GetValueOrDefault(id);for(var depth=0;parent!=null&&depth<32;depth++){if(parent==entity.Id)return new Entity(id,Generation);parent=Parents.GetValueOrDefault(parent);}}throw new InvalidOperationException("AX_SCENE_0001: Player needs a child Camera");
 }
 internal static void Rotate(Entity entity,Quaternion rotation) {
  var value=Read(entity);var length=Math.Sqrt(rotation.X*rotation.X+rotation.Y*rotation.Y+rotation.Z*rotation.Z+rotation.W*rotation.W);if(!double.IsFinite(length)||length<1e-9)throw new ArgumentException("AX_SCRIPT_0003: invalid rotation");var normalized=new Quaternion(rotation.X/length,rotation.Y/length,rotation.Z/length,rotation.W/length);Add(new("rotation",entity.Id,null,default,null,Rotation:normalized));Entities[entity.Id]=new Transform(value.Position,normalized,value.Scale){Entity=entity};FollowChildren(entity,value);
 }
 internal static void Scaling(Entity entity,Vector3 scale){var v=Read(entity);Position(scale);Add(new("scale",entity.Id,null,scale,null));Entities[entity.Id]=new Transform(v.Position,v.Rotation,scale){Entity=entity};FollowChildren(entity,v);}
 internal static void Move(Entity entity,Vec3 position) {
  var value=Read(entity);Position(position);Add(new("move",entity.Id,null,position,null));Entities[entity.Id]=new Transform(position,value.Rotation,value.Scale){Entity=entity};FollowChildren(entity,value);
 }
 internal static Entity Spawn(Entity template,Vec3 position) {
  var value=Read(template);Position(position);
  if(Entities.Count>=Limits.Entities)throw new InvalidOperationException("AX_SCRIPT_0003: spawn limit exceeded");
  var id="entity://"+(DeterministicSpawn?$"{ReplaySeed:x8}-0000-4000-8000-{Spawned:x12}":Guid.NewGuid().ToString());if(Entities.ContainsKey(id))throw new InvalidOperationException("Deterministic spawn ID collision");Add(new("spawn",id,template.Id,position,null));Spawned++;SceneManagement.SceneManager.Owners[id]=SceneManagement.SceneManager.Owners.GetValueOrDefault(template.Id,SceneManagement.SceneManager.GetActiveScene().name);if(AudioSources.Contains(template.Id))AudioSources.Add(id);Entities.Add(id,new Transform(position,value.Rotation,value.Scale){Entity=new Entity(id,Generation)});if(EntityData.TryGetValue(template.Id,out var data))EntityData[id]=data;if(Cameras.Contains(template.Id))Cameras.Add(id);Parents[id]=null;ActiveStates[id]=ActiveStates.GetValueOrDefault(template.Id,true);if(Bodies.TryGetValue(template.Id,out var body))Bodies.Add(id,body);if(Animators.TryGetValue(template.Id,out var animator))Animators.Add(id,animator);if(AnimationStates.TryGetValue(template.Id,out var animationState))AnimationStates.Add(id,animationState);return new(id,Generation);
 }
 internal static void DispatchContacts(JsonElement request){
  var current=new Dictionary<string,List<JsonElement>>();
  string Key(JsonElement c){var a=c.GetProperty("a").GetString()!;var b=c.GetProperty("b").GetString()!;return string.CompareOrdinal(a,b)<0?a+"|"+b:b+"|"+a;}
  if(request.TryGetProperty("contacts",out var contacts))foreach(var c in contacts.EnumerateArray()){var a=c.GetProperty("a").GetString()!;var b=c.GetProperty("b").GetString()!;if(!Entities.ContainsKey(a)||!Entities.ContainsKey(b))continue;var key=Key(c);if(!current.ContainsKey(key))current[key]=new();current[key].Add(c.Clone());}
  void Emit(List<JsonElement> manifold,int phase){var c=manifold[0];var a=c.GetProperty("a").GetString()!;var b=c.GetProperty("b").GetString()!;var trigger=c.GetProperty("trigger").GetBoolean();var normal=Vector3.Read(c.GetProperty("normal"));var point=Vector3.Read(c.GetProperty("point"));
   foreach(var script in LiveScripts.OfType<MonoBehaviour>().ToArray()){if(!Entities.ContainsKey(script.Entity.Id)||!script.isActiveAndEnabled||script.Entity.Id!=a&&script.Entity.Id!=b)continue;var other=script.Entity.Id==a?b:a;if(!EntityData.TryGetValue(other,out var data)||!data.TryGetProperty("collider",out var collider)||!EntityData[script.Entity.Id].TryGetProperty("collider",out _))continue;var e=new Entity(other,Generation);var n=script.Entity.Id==a?-normal:normal;var relative=c.TryGetProperty("relativeVelocity",out var before)?Vector3.Read(before)*(script.Entity.Id==a?1:-1):(Bodies.TryGetValue(script.Entity.Id,out var selfBody)?(Vector3)selfBody.Velocity:Vector3.zero)-(Bodies.TryGetValue(other,out var otherBody)?(Vector3)otherBody.Velocity:Vector3.zero);
    if(collider.GetProperty("dimension").GetInt32()==2){var col=new Collider2D(e);if(trigger){if(phase==0)script.OnTriggerEnter2D(col);else if(phase==1)script.OnTriggerStay2D(col);else script.OnTriggerExit2D(col);}else{var self=new Collider2D(script.Entity);var points=phase==2?Array.Empty<ContactPoint2D>():manifold.Select(m=>{var p=Vector3.Read(m.GetProperty("point"));var normal=Vector3.Read(m.GetProperty("normal"))*(script.Entity.Id==a?-1:1);return new ContactPoint2D(new(p.X,p.Y),new(normal.X,normal.Y),-m.GetProperty("depth").GetDouble(),self,col);}).ToArray();var collision=new Collision2D(col,n,point,points,relative);if(phase==0)script.OnCollisionEnter2D(collision);else if(phase==1)script.OnCollisionStay2D(collision);else script.OnCollisionExit2D(collision);}}
    else{var col=new Collider(e);if(trigger){if(phase==0)script.OnTriggerEnter(col);else if(phase==1)script.OnTriggerStay(col);else script.OnTriggerExit(col);}else{var self=new Collider(script.Entity);var points=phase==2?Array.Empty<ContactPoint>():manifold.Select(m=>new ContactPoint(Vector3.Read(m.GetProperty("point")),Vector3.Read(m.GetProperty("normal"))*(script.Entity.Id==a?-1:1),-m.GetProperty("depth").GetDouble(),self,col)).ToArray();var collision=new Collision(col,n,point,points,relative);if(phase==0)script.OnCollisionEnter(collision);else if(phase==1)script.OnCollisionStay(collision);else script.OnCollisionExit(collision);}}
   }
  }
  foreach(var pair in current)Emit(pair.Value,PreviousContacts.ContainsKey(pair.Key)?1:0);foreach(var pair in PreviousContacts)if(!current.ContainsKey(pair.Key))Emit(pair.Value,2);PreviousContacts.Clear();foreach(var pair in current)PreviousContacts.Add(pair.Key,pair.Value);
 }
 internal static bool IsActive(string id){for(var depth=0;id!=null&&depth<64;depth++){if(!ActiveStates.GetValueOrDefault(id,true))return false;id=Parents.GetValueOrDefault(id)!;}return true;}
 internal static void Activate(Entity entity,bool active){_=Read(entity);ActiveStates[entity.Id]=active;Add(new("active",entity.Id,null,default,null,active?"true":"false"));RuntimeLifecycle.Activation();}
 internal static void Destroy(Entity entity){_=Read(entity);var ids=new HashSet<string>{entity.Id};bool changed=true;while(changed){changed=false;foreach(var pair in Parents)if(pair.Value!=null&&ids.Contains(pair.Value)&&ids.Add(pair.Key))changed=true;}Add(new("destroy",entity.Id,null,default,null));foreach(var script in LiveScripts.Where(script=>ids.Contains(script.Entity.Id)).ToArray()){RuntimeLifecycle.Remove(script);LiveScripts.Remove(script);ScriptPaths.Remove(script);}foreach(var id in ids){Entities.Remove(id);EntityData.Remove(id);Parents.Remove(id);ActiveStates.Remove(id);Bodies.Remove(id);Cameras.Remove(id);AudioSources.Remove(id);Animators.Remove(id);AnimationStates.Remove(id);Grounded.Remove(id);SceneManagement.SceneManager.Owners.Remove(id);SceneManagement.SceneManager.Persistent.Remove(id);AI.NavMeshAgent.Agents.Remove(id);}}
 internal static void Log(string message) {
  if(message.Length>2048||Logs>=Limits.Logs)throw new InvalidOperationException("AX_SCRIPT_0003: log limit exceeded");
  Add(new("log","",null,default,message));Logs++;
 }
 internal static void Load(JsonElement value) {
  Networking.UnityWebRequest.Load(value);if(value.TryGetProperty("runtimeMetrics",out var metrics))RuntimeStats.Data=metrics.Clone();if(value.TryGetProperty("platform",out var platform))Application.Data=platform.Clone();
  Input.Load(value,value.GetProperty("action").GetString() is "start" or "frame" or "step");
  if(value.GetProperty("action").GetString() is "frame" or "step" or "start"){PreviousKeys.Clear();PreviousKeys.UnionWith(Keys);}Entities.Clear();EntityData.Clear();ActiveStates.Clear();Bodies.Clear();AudioSources.Clear();Animators.Clear();AnimationStates.Clear();Keys.Clear();Grounded.Clear();Parents.Clear();Cameras.Clear();MouseDelta=new(0,0);Operations.Clear();Logs=0;
  foreach(var e in value.GetProperty("entities").EnumerateArray()) {
   if(Entities.Count>=Limits.Entities)throw new ArgumentException("Entity limit exceeded");
   if(e.TryGetProperty("grounded",out var grounded)&&grounded.ValueKind==JsonValueKind.True)Grounded.Add(e.GetProperty("id").GetString()!);
   EntityData[e.GetProperty("id").GetString()!]=e.Clone();ActiveStates[e.GetProperty("id").GetString()!]=!e.TryGetProperty("runtimeActive",out var active)||active.GetBoolean();
   Parents[e.GetProperty("id").GetString()!]=e.TryGetProperty("parentId",out var parent)?parent.GetString():null;
   if(e.TryGetProperty("camera",out _))Cameras.Add(e.GetProperty("id").GetString()!);
   if(e.TryGetProperty("audioSource",out _))AudioSources.Add(e.GetProperty("id").GetString()!);
   if(e.TryGetProperty("animator",out var animator))Animators.Add(e.GetProperty("id").GetString()!,animator.Clone());
   if(e.TryGetProperty("animationState",out var animationState))AnimationStates.Add(e.GetProperty("id").GetString()!,animationState.Clone());
   if(e.TryGetProperty("rigidBody",out var body))Bodies.Add(e.GetProperty("id").GetString()!,RigidBody.Read(body));
   Entities.Add(e.GetProperty("id").GetString()!,Transform.Read(e.GetProperty("transform")));
  }
  if(value.TryGetProperty("mouseDelta",out var mouse)){var x=mouse[0].GetDouble();var y=mouse[1].GetDouble();if(!double.IsFinite(x)||!double.IsFinite(y)||Math.Abs(x)>10000||Math.Abs(y)>10000)throw new ArgumentException("Invalid mouse delta");MouseDelta=new(x,y);}
  foreach(var key in value.GetProperty("keys").EnumerateArray()) {if(Keys.Count>=64)throw new ArgumentException("Input limit exceeded");Keys.Add(key.GetString()!);}
 }
 internal static string Output(string? error=null,Action<Utf8JsonWriter>? fields=null) {
  using var stream=new MemoryStream();using(var writer=new Utf8JsonWriter(stream)) {
   writer.WriteStartObject();writer.WriteNumber("generation",Generation);writer.WriteStartObject("time");writer.WriteNumber("scale",Time.timeScale);writer.WriteNumber("delta",Time.deltaTime);writer.WriteNumber("unscaledDelta",Time.unscaledDeltaTime);writer.WriteEndObject();
   if(error!=null)writer.WriteString("error",error.Length>4096?error[..4096]:error);
   writer.WriteStartArray("operations");
   if(error==null)foreach(var op in Operations) {
    writer.WriteStartObject();writer.WriteString("kind",op.Kind);writer.WriteString("id",op.Id);
    if(op.Template!=null)writer.WriteString("template",op.Template);
    if(op.Kind=="active")writer.WriteBoolean("active",op.Action=="true");
    if(op.Kind=="animation"||op.Kind=="audio"){writer.WriteString("action",op.Action);if(op.Name!=null)writer.WriteString("name",op.Name);writer.WriteNumber("value",op.Value);writer.WriteNumber("duration",op.Duration);}
    if(op.Rotation is Quaternion rotation){writer.WritePropertyName("rotation");writer.WriteStartArray();writer.WriteNumberValue(rotation.X);writer.WriteNumberValue(rotation.Y);writer.WriteNumberValue(rotation.Z);writer.WriteNumberValue(rotation.W);writer.WriteEndArray();}
    if(op.Kind!="rotation"&&op.Kind!="log"&&op.Kind!="animation"&&op.Kind!="audio"){writer.WritePropertyName("position");op.Position.Write(writer);}
    if(op.Kind=="sibling")writer.WriteNumber("index",op.Value);
    if(op.Name!=null&&op.Kind!="animation"&&op.Kind!="audio")writer.WriteString("name",op.Name);
    if(op.Data!=null){writer.WritePropertyName("data");using var data=JsonDocument.Parse(op.Data);data.RootElement.WriteTo(writer);}
    if(op.Message!=null)writer.WriteString("message",op.Message);
    writer.WriteEndObject();
   }
   writer.WriteEndArray();if(error==null)fields?.Invoke(writer);writer.WriteEndObject();
  }
  return System.Text.Encoding.UTF8.GetString(stream.ToArray());
 }
}
