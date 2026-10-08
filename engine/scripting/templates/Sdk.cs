using System.Text.Json;
namespace Axiom.Gameplay;

public readonly record struct Vector2(double X, double Y) {
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
public readonly record struct Vector3(double X, double Y, double Z) {
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
 public static Vector3 Up => new(0,1,0);public static Vector3 Right => new(1,0,0);public static Vector3 Forward => new(0,0,-1);
 public static Vector3 Cross(Vector3 a,Vector3 b) => new(a.Y*b.Z-a.Z*b.Y,a.Z*b.X-a.X*b.Z,a.X*b.Y-a.Y*b.X);
 public static implicit operator Vector3(Vec3 v) => new(v.X,v.Y,v.Z);public static implicit operator Vec3(Vector3 v) => new(v.X,v.Y,v.Z);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
public readonly record struct Vector4(double X, double Y, double Z, double W) {
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
public readonly record struct Vector2Int(int X, int Y) {
 public static Vector2Int Zero => new(0,0);
 public static Vector2Int One => new(1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y);
 public static Vector2Int operator +(Vector2Int a,Vector2Int b) => new(a.X+b.X,a.Y+b.Y);
 public static Vector2Int operator -(Vector2Int a,Vector2Int b) => new(a.X-b.X,a.Y-b.Y);
 public static Vector2Int operator *(Vector2Int a,int b) => new(a.X*b,a.Y*b);
 internal static Vector2Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32());
 public static implicit operator Vector2(Vector2Int v) => new(v.X,v.Y);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteEndArray();}
}
public readonly record struct Vector3Int(int X, int Y, int Z) {
 public static Vector3Int Zero => new(0,0,0);
 public static Vector3Int One => new(1,1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y+Z*Z);
 public static Vector3Int operator +(Vector3Int a,Vector3Int b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
 public static Vector3Int operator -(Vector3Int a,Vector3Int b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z);
 public static Vector3Int operator *(Vector3Int a,int b) => new(a.X*b,a.Y*b,a.Z*b);
 internal static Vector3Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32(),e[2].GetInt32());
 public static implicit operator Vector3(Vector3Int v) => new(v.X,v.Y,v.Z);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
public readonly record struct Vector4Int(int X, int Y, int Z, int W) {
 public static Vector4Int Zero => new(0,0,0,0);
 public static Vector4Int One => new(1,1,1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y+Z*Z+W*W);
 public static Vector4Int operator +(Vector4Int a,Vector4Int b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z,a.W+b.W);
 public static Vector4Int operator -(Vector4Int a,Vector4Int b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z,a.W-b.W);
 public static Vector4Int operator *(Vector4Int a,int b) => new(a.X*b,a.Y*b,a.Z*b,a.W*b);
 internal static Vector4Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32(),e[2].GetInt32(),e[3].GetInt32());
 public static implicit operator Vector4(Vector4Int v) => new(v.X,v.Y,v.Z,v.W);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteNumberValue(W);w.WriteEndArray();}
}
public readonly record struct Quaternion(double X,double Y,double Z,double W) {
 public static Quaternion Identity => new(0,0,0,1);
 public static Quaternion Euler(Vector3 degrees) {var x=degrees.X*Math.PI/360;var y=degrees.Y*Math.PI/360;var z=degrees.Z*Math.PI/360;var cx=Math.Cos(x);var sx=Math.Sin(x);var cy=Math.Cos(y);var sy=Math.Sin(y);var cz=Math.Cos(z);var sz=Math.Sin(z);return new(sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz);}
 public static implicit operator Quat(Quaternion q)=>new(q.X,q.Y,q.Z,q.W);public static implicit operator Quaternion(Quat q)=>new(q.X,q.Y,q.Z,q.W);
 internal static Quaternion Read(JsonElement e)=>new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());
}
public readonly record struct Color(double R,double G,double B,double A=1) {public static Color White=>new(1,1,1,1);public static Color Black=>new(0,0,0,1);}
public readonly record struct Color32(byte R,byte G,byte B,byte A=255);
public readonly record struct Rect(double X,double Y,double Width,double Height);
public readonly record struct Bounds(Vector3 Center,Vector3 Size);
public abstract class MonoBehaviour : Script {}
[AttributeUsage(AttributeTargets.Field)] public sealed class SerializeFieldAttribute : Attribute {}
[AttributeUsage(AttributeTargets.Field)] public sealed class HideInInspectorAttribute : Attribute {}
[AttributeUsage(AttributeTargets.Field)] public sealed class ReadOnlyAttribute : Attribute {}
[AttributeUsage(AttributeTargets.Field)] public sealed class TitleAttribute(string text) : Attribute {public string Text {get;}=text;}
[AttributeUsage(AttributeTargets.Field)] public sealed class HeaderAttribute(string text) : Attribute {public string Text {get;}=text;}
[AttributeUsage(AttributeTargets.Field)] public sealed class SpaceAttribute(double height=8) : Attribute {public double Height {get;}=height;}
[AttributeUsage(AttributeTargets.Field)] public sealed class TooltipAttribute(string text) : Attribute {public string Text {get;}=text;}
[AttributeUsage(AttributeTargets.Field)] public sealed class RangeAttribute(double minimum,double maximum) : Attribute {public double Minimum {get;}=minimum;public double Maximum {get;}=maximum;}
public static class Mathf {public const double PI=Math.PI;public const double Deg2Rad=Math.PI/180;public const double Rad2Deg=180/Math.PI;public static double Clamp(double value,double min,double max)=>Math.Clamp(value,min,max);public static double Lerp(double a,double b,double t)=>a+(b-a)*Math.Clamp(t,0,1);}
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
public abstract class Script {
 public Entity Entity {get; internal set;}
 public virtual void OnStart() {}
 public virtual void OnUpdate(double deltaSeconds) {}
 public virtual void OnStop() {}
}
public static class ReplayRandom {
 private static uint state=1;
 internal static void Reset(uint seed) => state=seed;
 public static double NextDouble() {state=unchecked(state*1664525u+1013904223u);return state/4294967296.0;}
}
public static class Input {
 public static bool IsDown(string code) => Context.Keys.Contains(code);
 public static double Axis(string negative, string positive) => (IsDown(positive)?1:0)-(IsDown(negative)?1:0);
}
public static class Log {public static void Info(string message) => Context.Log(message);}
internal readonly record struct Operation(string Kind,string Id,string? Template,Vec3 Position,string? Message,string? Action=null,string? Name=null,double Value=0,double Duration=0);
internal static class Context {
 internal static int Generation;
 internal static bool DeterministicSpawn;
 internal static uint ReplaySeed;
 internal static readonly Dictionary<string,Transform> Entities = new();
 internal static readonly Dictionary<string,RigidBody> Bodies = new();
 internal static readonly Dictionary<string,JsonElement> Animators = new();
 internal static readonly Dictionary<string,JsonElement> AnimationStates = new();
 internal static readonly HashSet<string> AudioSources = new();
 internal static readonly HashSet<string> Keys = new();
 internal static readonly List<Operation> Operations = new();
 internal static int Spawned,Logs;
 internal static Transform Read(Entity entity) {
  if(entity.Generation!=Generation||!Entities.TryGetValue(entity.Id,out var value))throw new InvalidOperationException("AX_SCRIPT_0002: stale entity handle");
  return value;
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
  Add(new("animation",entity.Id,null,default,null,action,name,value,duration));
 }
 internal static void Audio(Entity entity,string action,double value) {
  _=Read(entity);if(!AudioSources.Contains(entity.Id)||!double.IsFinite(value)||value<0||value>1)throw new ArgumentException("AX_AUDIO_0001: invalid source or volume");
  Add(new("audio",entity.Id,null,default,null,action,null,value));
 }
 internal static void Velocity(Entity entity,Vec3 velocity) {
  _=ReadBody(entity);Position(velocity);if(Math.Max(Math.Abs(velocity.X),Math.Max(Math.Abs(velocity.Y),Math.Abs(velocity.Z)))>10000)throw new ArgumentException("AX_PHYSICS_0001: invalid velocity");
  Add(new("velocity",entity.Id,null,velocity,null));Bodies[entity.Id]=new RigidBody(velocity);
 }
 private static void Add(Operation operation) {
  if(Operations.Count>=Limits.Operations)throw new InvalidOperationException("AX_SCRIPT_0003: operation limit exceeded");
  Operations.Add(operation);
 }
 private static void Position(Vec3 value) {
  if(!double.IsFinite(value.X)||!double.IsFinite(value.Y)||!double.IsFinite(value.Z)||Math.Max(Math.Abs(value.X),Math.Max(Math.Abs(value.Y),Math.Abs(value.Z)))>1000000)throw new ArgumentException("AX_SCRIPT_0003: invalid position");
 }
 internal static void Move(Entity entity,Vec3 position) {
  var value=Read(entity);Position(position);Add(new("move",entity.Id,null,position,null));Entities[entity.Id]=value with{Position=position};
 }
 internal static Entity Spawn(Entity template,Vec3 position) {
  var value=Read(template);Position(position);
  if(Spawned>=Limits.Spawns||Entities.Count>=Limits.Entities)throw new InvalidOperationException("AX_SCRIPT_0003: spawn limit exceeded");
  var id="entity://"+(DeterministicSpawn?$"{ReplaySeed:x8}-0000-4000-8000-{Spawned:x12}":Guid.NewGuid().ToString());if(Entities.ContainsKey(id))throw new InvalidOperationException("Deterministic spawn ID collision");Add(new("spawn",id,template.Id,position,null));Spawned++;if(AudioSources.Contains(template.Id))AudioSources.Add(id);Entities.Add(id,value with{Position=position});if(Bodies.TryGetValue(template.Id,out var body))Bodies.Add(id,body);if(Animators.TryGetValue(template.Id,out var animator))Animators.Add(id,animator);if(AnimationStates.TryGetValue(template.Id,out var animationState))AnimationStates.Add(id,animationState);return new(id,Generation);
 }
 internal static void Log(string message) {
  if(message.Length>2048||Logs>=Limits.Logs)throw new InvalidOperationException("AX_SCRIPT_0003: log limit exceeded");
  Add(new("log","",null,default,message));Logs++;
 }
 internal static void Load(JsonElement value) {
  Entities.Clear();Bodies.Clear();AudioSources.Clear();Animators.Clear();AnimationStates.Clear();Keys.Clear();Operations.Clear();Logs=0;
  foreach(var e in value.GetProperty("entities").EnumerateArray()) {
   if(Entities.Count>=Limits.Entities)throw new ArgumentException("Entity limit exceeded");
   if(e.TryGetProperty("audioSource",out _))AudioSources.Add(e.GetProperty("id").GetString()!);
   if(e.TryGetProperty("animator",out var animator))Animators.Add(e.GetProperty("id").GetString()!,animator.Clone());
   if(e.TryGetProperty("animationState",out var animationState))AnimationStates.Add(e.GetProperty("id").GetString()!,animationState.Clone());
   if(e.TryGetProperty("rigidBody",out var body))Bodies.Add(e.GetProperty("id").GetString()!,RigidBody.Read(body));
   Entities.Add(e.GetProperty("id").GetString()!,Transform.Read(e.GetProperty("transform")));
  }
  foreach(var key in value.GetProperty("keys").EnumerateArray()) {if(Keys.Count>=64)throw new ArgumentException("Input limit exceeded");Keys.Add(key.GetString()!);}
 }
 internal static string Output(string? error=null,Action<Utf8JsonWriter>? fields=null) {
  using var stream=new MemoryStream();using(var writer=new Utf8JsonWriter(stream)) {
   writer.WriteStartObject();writer.WriteNumber("generation",Generation);
   if(error!=null)writer.WriteString("error",error.Length>4096?error[..4096]:error);
   writer.WriteStartArray("operations");
   if(error==null)foreach(var op in Operations) {
    writer.WriteStartObject();writer.WriteString("kind",op.Kind);writer.WriteString("id",op.Id);
    if(op.Template!=null)writer.WriteString("template",op.Template);
    if(op.Kind=="animation"||op.Kind=="audio"){writer.WriteString("action",op.Action);if(op.Name!=null)writer.WriteString("name",op.Name);writer.WriteNumber("value",op.Value);writer.WriteNumber("duration",op.Duration);}
    if(op.Kind!="log"&&op.Kind!="animation"&&op.Kind!="audio"){writer.WritePropertyName("position");op.Position.Write(writer);}
    if(op.Message!=null)writer.WriteString("message",op.Message);
    writer.WriteEndObject();
   }
   writer.WriteEndArray();if(error==null)fields?.Invoke(writer);writer.WriteEndObject();
  }
  return System.Text.Encoding.UTF8.GetString(stream.ToArray());
 }
}
