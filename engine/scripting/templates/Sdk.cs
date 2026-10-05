using System.Text.Json;
namespace Axiom.Gameplay;

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
 public void Move(Vec3 delta) => SetPosition(Transform.Position+delta);
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
 internal static string Output(string? error=null) {
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
   writer.WriteEndArray();writer.WriteEndObject();
  }
  return System.Text.Encoding.UTF8.GetString(stream.ToArray());
 }
}
