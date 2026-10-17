using System.Collections;
using System.Reflection;
namespace Axiom.Gameplay;
public sealed class WaitForSeconds {internal double Duration;public WaitForSeconds(double seconds){if(!double.IsFinite(seconds)||seconds<0)throw new ArgumentException("Invalid wait");Duration=seconds;}}
public sealed class WaitForSecondsRealtime {public double waitTime;public WaitForSecondsRealtime(double seconds){if(!double.IsFinite(seconds)||seconds<0)throw new ArgumentException("Invalid wait");waitTime=seconds;}}
public sealed class WaitUntil {internal Func<bool> Test;public WaitUntil(Func<bool> predicate){Test=predicate??throw new ArgumentNullException(nameof(predicate));}}
public sealed class WaitWhile {internal Func<bool> Test;public WaitWhile(Func<bool> predicate){Test=predicate??throw new ArgumentNullException(nameof(predicate));}}
public sealed class WaitForFixedUpdate {}
public sealed class WaitForEndOfFrame {}
public sealed class Coroutine {
 internal readonly MonoBehaviour Owner;internal readonly IEnumerator Routine;internal readonly Stack<IEnumerator> Stack=new();internal object? Waiting;internal double Until;internal int Frame;internal bool Done;
 internal Coroutine(MonoBehaviour owner,IEnumerator routine){Owner=owner;Routine=routine;Stack.Push(routine);}
}
internal static class RuntimeLifecycle {
 private static readonly HashSet<Script> Awakened=new(),Enabled=new(),Started=new();
 internal static readonly Dictionary<Type,(Func<Script> Create,string Path,Action<Script,System.Text.Json.JsonElement> Apply,Action<Script,System.Text.Json.Utf8JsonWriter> Write)> Factories=new();
 private static readonly List<Coroutine> Routines=new();
 private sealed record Invocation(MonoBehaviour Owner,string Name,Action Callback,double Due,double Repeat);
 private static readonly List<Invocation> Invocations=new();
 private static readonly List<(Object Target,double Due)> Destructions=new();
 internal static void DestroyAfter(Object target,double delay){if(!double.IsFinite(delay)||delay<0||Destructions.Count>=256)throw new ArgumentException("Invalid delayed destruction or scheduling limit");Destructions.Add((target,Time.time+delay));}
 internal static void Reset(){Awakened.Clear();Enabled.Clear();Started.Clear();foreach(var c in Routines.ToArray())Stop(c);Invocations.Clear();Destructions.Clear();Context.ScriptPaths.Clear();Context.AddCompiledScript=Add;}
 internal static string PathOf(Script script)=>Context.ScriptPaths.GetValueOrDefault(script,"");
 internal static void Register<[System.Diagnostics.CodeAnalysis.DynamicallyAccessedMembers(System.Diagnostics.CodeAnalysis.DynamicallyAccessedMemberTypes.All)]T>(string path,Func<Script> create,Action<Script,System.Text.Json.JsonElement> apply,Action<Script,System.Text.Json.Utf8JsonWriter> write) where T:Script=>Factories[typeof(T)]=(create,path,apply,write);
 internal static void Initialize(){
  foreach(var s in Context.LiveScripts.ToArray())if(!Awakened.Contains(s)&&Context.Entities.ContainsKey(s.Entity.Id)&&Context.IsActive(s.Entity.Id)){Awakened.Add(s);if(s is MonoBehaviour m)m.Awake();}
  foreach(var s in Context.LiveScripts.ToArray())if(Awakened.Contains(s)&&!Enabled.Contains(s)&&s.isActiveAndEnabled){Enabled.Add(s);if(s is MonoBehaviour m)m.OnEnable();}
 }
 internal static void StartAll(){Initialize();foreach(var s in Context.LiveScripts.ToArray())if(s.isActiveAndEnabled&&Started.Add(s)){if(s is MonoBehaviour m)m.Start();s.OnStart();}}
 internal static void Update(double delta){StartAll();foreach(var s in Context.LiveScripts.ToArray())if(s.isActiveAndEnabled)s.OnUpdate(delta);Tick("update");}
 internal static void Fixed(){StartAll();Time.inFixedTimeStep=true;try{foreach(var s in Context.LiveScripts.OfType<MonoBehaviour>().ToArray())if(s.isActiveAndEnabled)s.FixedUpdate();}finally{Time.inFixedTimeStep=false;}}
 internal static void Physics(){Tick("fixed");}
 internal static void Late(){foreach(var s in Context.LiveScripts.OfType<MonoBehaviour>().ToArray())if(s.isActiveAndEnabled)s.LateUpdate();}
 internal static void End(){Tick("end");}
 internal static void Activation(){foreach(var s in Context.LiveScripts.ToArray()){var active=s.isActiveAndEnabled;if(active&&!Enabled.Contains(s)){Initialize();}else if(!active&&Enabled.Remove(s)){if(s is MonoBehaviour m)m.OnDisable();if(!Context.IsActive(s.Entity.Id))StopAll(s as MonoBehaviour);}}}
 internal static void Remove(Script s){if(Enabled.Remove(s)&&s is MonoBehaviour m)m.OnDisable();StopAll(s as MonoBehaviour);Invocations.RemoveAll(i=>i.Owner==s);s.OnStop();if(Awakened.Remove(s)&&s is MonoBehaviour mono)mono.OnDestroy();Started.Remove(s);}
 internal static Script Add(Type type,Entity entity){if(!Factories.TryGetValue(type,out var factory))throw new NotSupportedException("Script type is not compiled: "+type.Name);if(Context.LiveScripts.Count>=Limits.Attachments||Context.LiveScripts.Count(s=>s.Entity.Id==entity.Id)>=8||Context.LiveScripts.Any(s=>s.Entity.Id==entity.Id&&s.GetType()==type))throw new InvalidOperationException("Duplicate script or attachment limit");var s=factory.Create();s.Entity=entity;Context.LiveScripts.Add(s);Context.ScriptPaths[s]=factory.Path;PublishComponents(entity);Initialize();return s;}
 internal static void PublishComponents(Entity entity){var list=new System.Text.Json.Nodes.JsonArray();foreach(var s in Context.LiveScripts.Where(s=>s.Entity.Id==entity.Id)){if(!Factories.TryGetValue(s.GetType(),out var f))continue;using var stream=new MemoryStream();using(var w=new System.Text.Json.Utf8JsonWriter(stream))f.Write(s,w);var component=new System.Text.Json.Nodes.JsonObject{["path"]=f.Path,["values"]=System.Text.Json.Nodes.JsonNode.Parse(stream.ToArray())};list.Add(component);}Context.Property(entity,"scriptComponents",list);}
 internal static void Clone(Script original,Entity entity){if(!Factories.TryGetValue(original.GetType(),out var f))throw new NotSupportedException("Cloning requires a compiled physical script");if(Context.LiveScripts.Count>=Limits.Attachments)throw new InvalidOperationException("Script attachment limit");var s=f.Create();s.Entity=entity;s.enabled=original.enabled;ScriptValues.Copy(original.GetType(),original,s);using var stream=new MemoryStream();using(var w=new System.Text.Json.Utf8JsonWriter(stream))f.Write(original,w);using var json=System.Text.Json.JsonDocument.Parse(stream.ToArray());f.Apply(s,json.RootElement);Context.LiveScripts.Add(s);Context.ScriptPaths[s]=f.Path;PublishComponents(entity);}
 internal static Coroutine Start(MonoBehaviour owner,IEnumerator routine){if(!owner.gameObject.activeInHierarchy)throw new InvalidOperationException("Cannot start coroutine on an inactive object");if(Routines.Count>=256)throw new InvalidOperationException("Coroutine limit exceeded");var c=new Coroutine(owner,routine??throw new ArgumentNullException(nameof(routine)));Routines.Add(c);Advance(c);return c;}
 internal static void Stop(Coroutine c){if(c.Done)return;c.Done=true;while(c.Stack.TryPop(out var e))(e as IDisposable)?.Dispose();Routines.Remove(c);}
 internal static void Stop(MonoBehaviour owner,IEnumerator routine){foreach(var c in Routines.Where(c=>c.Owner==owner&&c.Routine==routine).ToArray())Stop(c);}
 internal static void StopAll(MonoBehaviour? owner){if(owner==null)return;foreach(var c in Routines.Where(c=>c.Owner==owner).ToArray())Stop(c);}
 private static void Advance(Coroutine c){for(var moves=0;moves<128&&!c.Done;moves++){if(c.Stack.Count==0){Stop(c);return;}var e=c.Stack.Peek();if(!e.MoveNext()){c.Stack.Pop();(e as IDisposable)?.Dispose();continue;}var value=e.Current;if(value is IEnumerator nested){if(c.Stack.Count>=32)throw new InvalidOperationException("Coroutine nesting limit");c.Stack.Push(nested);continue;}c.Waiting=value;c.Frame=Time.frameCount+1;c.Until=value switch {WaitForSeconds wait=>Time.time+wait.Duration,WaitForSecondsRealtime wait=>Time.unscaledTime+wait.waitTime,_=>0};return;}if(!c.Done)throw new InvalidOperationException("Coroutine made too many immediate advances");}
 internal static void Tick(string phase){if(phase=="update")foreach(var item in Destructions.ToArray())if(item.Due<=Time.time){Destructions.Remove(item);if(item.Target){if(item.Target is GameObject go)Object.Destroy(go);else if(item.Target is Component component)Object.Destroy(component);}}if(phase=="update")foreach(var i in Invocations.ToArray())if(i.Due<=Time.time&&Context.Entities.ContainsKey(i.Owner.Entity.Id)){Invocations.Remove(i);if(i.Repeat>0&&Context.Entities.ContainsKey(i.Owner.Entity.Id))Invocations.Add(i with {Due=Time.time+i.Repeat});i.Callback();}
  foreach(var c in Routines.ToArray()){if(c.Done)continue;if(!Context.Entities.ContainsKey(c.Owner.Entity.Id)||!c.Owner.gameObject.activeInHierarchy){Stop(c);continue;}var ready=c.Waiting switch {WaitForFixedUpdate=>phase=="fixed",WaitForEndOfFrame=>phase=="end",_=>phase=="update"&&Time.frameCount>=c.Frame&&(c.Waiting switch {WaitForSeconds=>Time.time>=c.Until,WaitForSecondsRealtime=>Time.unscaledTime>=c.Until,WaitUntil wait=>wait.Test(),WaitWhile wait=>!wait.Test(),Coroutine other=>other.Done,AsyncOperation operation=>operation.isDone,null=>true,_=>throw new NotSupportedException("Unsupported coroutine yield type "+c.Waiting.GetType().Name)})};if(ready)Advance(c);}
 }
 internal static void Invoke(MonoBehaviour owner,string name,double delay,double repeat){if(!double.IsFinite(delay)||delay<0||!double.IsFinite(repeat)||repeat<0||Invocations.Count>=256)throw new ArgumentException("Invalid invocation or limit exceeded");var method=owner.GetType().GetMethod(name,BindingFlags.Public|BindingFlags.NonPublic|BindingFlags.Instance,null,Type.EmptyTypes,null);if(method==null||method.ReturnType!=typeof(void))throw new ArgumentException("Invoke needs a compiled parameterless void method: "+name);Invocations.Add(new(owner,name,()=>method.Invoke(owner,null),Time.time+delay,repeat));}
 internal static void Cancel(MonoBehaviour owner,string? name)=>Invocations.RemoveAll(i=>i.Owner==owner&&(name==null||i.Name==name));
 internal static bool IsInvoking(MonoBehaviour owner,string? name)=>Invocations.Any(i=>i.Owner==owner&&(name==null||i.Name==name));
}
public abstract partial class MonoBehaviour {
 public Coroutine StartCoroutine(IEnumerator routine)=>RuntimeLifecycle.Start(this,routine);
 public void StopCoroutine(Coroutine coroutine){if(coroutine.Owner!=this)throw new ArgumentException("Coroutine belongs to another behaviour");RuntimeLifecycle.Stop(coroutine);}
 public void StopCoroutine(IEnumerator routine)=>RuntimeLifecycle.Stop(this,routine);
 public void StopAllCoroutines()=>RuntimeLifecycle.StopAll(this);
 public void Invoke(string methodName,double time)=>RuntimeLifecycle.Invoke(this,methodName,time,0);
 public void InvokeRepeating(string methodName,double time,double repeatRate){if(repeatRate<=0)throw new ArgumentException("Repeat rate must be positive");RuntimeLifecycle.Invoke(this,methodName,time,repeatRate);}
 public void CancelInvoke()=>RuntimeLifecycle.Cancel(this,null);
 public void CancelInvoke(string methodName)=>RuntimeLifecycle.Cancel(this,methodName);
 public bool IsInvoking()=>RuntimeLifecycle.IsInvoking(this,null);
 public bool IsInvoking(string methodName)=>RuntimeLifecycle.IsInvoking(this,methodName);
}
