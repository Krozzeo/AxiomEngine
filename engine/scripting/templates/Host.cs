using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;
using System.Text.Json;
using Axiom.Gameplay;
[assembly: SupportedOSPlatform("browser")]
namespace Axiom.ScriptHost;
public static partial class Program {
 private static List<Script> Scripts=>Context.LiveScripts;
 // <compiled-factories>
 private static void Configure(){RuntimeLifecycle.Register<Game.GameScript>("",()=>new Game.GameScript(),(_,_)=>{},(_,w)=>{w.WriteStartObject();w.WriteEndObject();});}
 private static void Attach(JsonElement entity,int generation){var s=new Game.GameScript{Entity=new Entity(entity.GetProperty("id").GetString()!,generation)};Scripts.Add(s);}
 // </compiled-factories>
 private static void Fields(Utf8JsonWriter writer){writer.WriteStartArray("scriptValues");foreach(var script in Scripts){if(!Context.Entities.ContainsKey(script.Entity.Id)||!RuntimeLifecycle.Factories.TryGetValue(script.GetType(),out var f)||f.Path=="")continue;writer.WriteStartObject();writer.WriteString("entityId",script.Entity.Id);writer.WriteString("path",f.Path);writer.WritePropertyName("values");f.Write(script,writer);writer.WriteEndObject();}writer.WriteEndArray();}
 public static void Main() {}
 [JSExport]
 public static string Dispatch(string request) {
  try {
   if(request.Length>4*1024*1024)throw new ArgumentException("Script request too large");
   using var document=JsonDocument.Parse(request);var value=document.RootElement;
   var action=value.GetProperty("action").GetString();var generation=value.GetProperty("generation").GetInt32();
   if(action=="start") {
    if(Scripts.Count!=0)throw new InvalidOperationException("Runtime already started");
    Context.ReplaySeed=value.TryGetProperty("seed",out var seed)?seed.GetUInt32():0;Context.DeterministicSpawn=value.TryGetProperty("replay",out var replay)&&replay.GetBoolean();ReplayRandom.Reset(Context.ReplaySeed);Axiom.Gameplay.Networking.UnityWebRequest.Reset();Axiom.Gameplay.AI.NavMesh.Reset();Application.Running=true;Time.Reset();PhysicsWorld.Reset();Physics.queriesHitTriggers=true;Physics2D.queriesHitTriggers=true;RuntimeLifecycle.Reset();Configure();Context.PreviousContacts.Clear();Context.Generation=generation;Context.Spawned=0;Context.Load(value);PlayerPrefs.Load(value);Resources.Data=value.TryGetProperty("projectData",out var project)?project.GetProperty("resources").Clone():Context.ParseData("[]");Axiom.Gameplay.SceneManagement.SceneManager.Reset(value);
    foreach(var id in value.GetProperty("attachments").EnumerateArray()) {
     var entity=value.GetProperty("entities").EnumerateArray().First(e=>e.GetProperty("id").GetString()==id.GetString());Attach(entity,generation);
     if(Scripts.Count>Limits.Attachments)throw new ArgumentException("Script attachment limit exceeded");
    }
    foreach(var script in Scripts){if(!RuntimeLifecycle.Factories.TryGetValue(script.GetType(),out var factory)||factory.Path=="")continue;var entity=Context.EntityData[script.Entity.Id];if(entity.TryGetProperty("scriptComponents",out var components))foreach(var c in components.EnumerateArray())if(c.GetProperty("path").GetString()==factory.Path)factory.Apply(script,c.GetProperty("values"));}
    RuntimeLifecycle.StartAll();
   } else {
    if(generation!=Context.Generation)throw new InvalidOperationException("Stale runtime generation");
    Context.Load(value);
    if(action=="fields") {foreach(var edit in value.GetProperty("edits").EnumerateArray())foreach(var s in Scripts.ToArray())if(s.Entity.Id==edit.GetProperty("entityId").GetString()&&RuntimeLifecycle.PathOf(s)==edit.GetProperty("path").GetString())RuntimeLifecycle.Factories[s.GetType()].Apply(s,edit.GetProperty("values"));}
    else if(action=="frame"||action=="step") {var delta=value.GetProperty("delta").GetDouble();if(!double.IsFinite(delta)||delta<0||delta>0.25)throw new ArgumentException("Invalid delta");Time.Step(delta);if(action=="step"){Context.DispatchContacts(value);RuntimeLifecycle.Update(Time.deltaTime);RuntimeLifecycle.Late();RuntimeLifecycle.End();}}
    else if(action=="fixed") {Time.fixedTime+=Time.fixedDeltaTime;Time.fixedUnscaledTime+=Time.fixedUnscaledDeltaTime;RuntimeLifecycle.Fixed();}
    else if(action=="physics") {Time.inFixedTimeStep=true;try{Context.DispatchContacts(value);RuntimeLifecycle.Physics();}finally{Time.inFixedTimeStep=false;}}
    else if(action=="update")RuntimeLifecycle.Update(Time.deltaTime);
    else if(action=="late")RuntimeLifecycle.Late();
    else if(action=="end")RuntimeLifecycle.End();
    else if(action=="stop") {Application.Running=false;foreach(var s in Scripts.ToArray())RuntimeLifecycle.Remove(s);Scripts.Clear();RuntimeLifecycle.Reset();}
    else throw new ArgumentException("Unknown runtime action");
   }
   return Context.Output(fields:Fields);
  }catch(Exception error){return Context.Output(error.ToString());}
 }
}
