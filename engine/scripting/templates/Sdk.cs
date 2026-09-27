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
 public void Move(Vec3 delta) => SetPosition(Transform.Position+delta);
 public void SetPosition(Vec3 position) => Context.Move(this,position);
 public Entity Spawn(Vec3 position) => Context.Spawn(this,position);
}
public abstract class Script {
 public Entity Entity {get; internal set;}
 public virtual void OnStart() {}
 public virtual void OnUpdate(double deltaSeconds) {}
 public virtual void OnStop() {}
}
public static class Input {
 public static bool IsDown(string code) => Context.Keys.Contains(code);
 public static double Axis(string negative, string positive) => (IsDown(positive)?1:0)-(IsDown(negative)?1:0);
}
public static class Log {public static void Info(string message) => Context.Log(message);}
internal readonly record struct Operation(string Kind,string Id,string? Template,Vec3 Position,string? Message);
internal static class Context {
 internal static int Generation;
 internal static readonly Dictionary<string,Transform> Entities = new();
 internal static readonly HashSet<string> Keys = new();
 internal static readonly List<Operation> Operations = new();
 internal static int Spawned,Logs;
 internal static Transform Read(Entity entity) {
  if(entity.Generation!=Generation||!Entities.TryGetValue(entity.Id,out var value))throw new InvalidOperationException("AX_SCRIPT_0002: stale entity handle");
  return value;
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
  var id="entity://"+Guid.NewGuid();Add(new("spawn",id,template.Id,position,null));Spawned++;Entities.Add(id,value with{Position=position});return new(id,Generation);
 }
 internal static void Log(string message) {
  if(message.Length>2048||Logs>=Limits.Logs)throw new InvalidOperationException("AX_SCRIPT_0003: log limit exceeded");
  Add(new("log","",null,default,message));Logs++;
 }
 internal static void Load(JsonElement value) {
  Entities.Clear();Keys.Clear();Operations.Clear();Logs=0;
  foreach(var e in value.GetProperty("entities").EnumerateArray()) {
   if(Entities.Count>=Limits.Entities)throw new ArgumentException("Entity limit exceeded");
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
    if(op.Kind!="log"){writer.WritePropertyName("position");op.Position.Write(writer);}
    if(op.Message!=null)writer.WriteString("message",op.Message);
    writer.WriteEndObject();
   }
   writer.WriteEndArray();writer.WriteEndObject();
  }
  return System.Text.Encoding.UTF8.GetString(stream.ToArray());
 }
}
