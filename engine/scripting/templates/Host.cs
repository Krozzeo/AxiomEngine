using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using System.Text.Json;
using Axiom.Gameplay;
[assembly: SupportedOSPlatform("browser")]
namespace Axiom.ScriptHost;
public static partial class Program {
 private static readonly List<Script> Scripts = new();
 public static void Main() {}
 [JSExport]
 public static string Dispatch(string request) {
  try {
   if(request.Length>512*1024)throw new ArgumentException("Script request too large");
   using var document=JsonDocument.Parse(request);var value=document.RootElement;
   var action=value.GetProperty("action").GetString();var generation=value.GetProperty("generation").GetInt32();
   if(action=="start") {
    if(Scripts.Count!=0)throw new InvalidOperationException("Runtime already started");
    Context.ReplaySeed=value.TryGetProperty("seed",out var seed)?seed.GetUInt32():0;Context.DeterministicSpawn=value.TryGetProperty("replay",out var replay)&&replay.GetBoolean();ReplayRandom.Reset(Context.ReplaySeed);Context.Generation=generation;Context.Spawned=0;Context.Load(value);
    foreach(var id in value.GetProperty("attachments").EnumerateArray()) {
     if(Scripts.Count>=Limits.Attachments)throw new ArgumentException("Script attachment limit exceeded");
     var script=new Game.GameScript {Entity=new Entity(id.GetString()!,generation)};
     _=script.Entity.Transform;Scripts.Add(script);script.OnStart();
    }
   } else {
    if(generation!=Context.Generation)throw new InvalidOperationException("Stale runtime generation");
    Context.Load(value);
    if(action=="step") {
     var delta=value.GetProperty("delta").GetDouble();if(!double.IsFinite(delta)||delta<0||delta>0.25)throw new ArgumentException("Invalid delta");
     foreach(var script in Scripts)script.OnUpdate(delta);
    } else if(action=="stop") {foreach(var script in Scripts)script.OnStop();Scripts.Clear();}
    else throw new ArgumentException("Unknown runtime action");
   }
   return Context.Output();
  }catch(Exception error){return Context.Output(error.ToString());}
 }
}
