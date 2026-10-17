namespace Axiom.Gameplay;
// Live component facades coexist with the original immutable snapshot API.
public partial class Object {
 public static GameObject Instantiate(GameObject original)=>Instantiate(original,original.transform.position,original.transform.rotation);
 public static GameObject Instantiate(GameObject original,Vector3 position,Quaternion rotation){var entity=Context.CloneHierarchy(original.Entity,position,rotation);entity.SetRotation(rotation);return new GameObject(entity);}
 public static void Destroy(GameObject target)=>Context.Destroy(target.Entity);
 public static void Destroy(Component target)=>Context.Remove(target);
}
public partial class Component : Object {
 public Entity Entity {get;internal set;}
 public GameObject gameObject=>new(Entity);
 public Transform transform=>new(Entity);
 public T? GetComponent<T>() where T:Component=>gameObject.GetComponent<T>();
 public T? GetComponentInChildren<T>() where T:Component {var own=GetComponent<T>();if(own!=null)return own;for(var i=0;i<transform.childCount;i++){var found=transform.GetChild(i).GetComponentInChildren<T>();if(found!=null)return found;}return null;}
 public T? GetComponentInParent<T>() where T:Component {Transform? current=transform;while(current!=null){var component=current.GetComponent<T>();if(component!=null)return component;current=current.parent;}return null;}
 public bool TryGetComponent<T>(out T? component) where T:Component {component=GetComponent<T>();return component!=null;}
}
public sealed partial class GameObject : Object {
 internal Entity Entity {get;}
 internal GameObject(Entity entity){Entity=entity;}
 public string name {get=>Context.Metadata(Entity,"name",Entity.Id);set=>Context.Property(Entity,"name",System.Text.Json.Nodes.JsonValue.Create(value));}
 public Transform transform=>new(Entity);
 public bool activeSelf=>Context.ActiveStates.GetValueOrDefault(Entity.Id,true);public bool activeInHierarchy=>Context.IsActive(Entity.Id);public void SetActive(bool active)=>Context.Activate(Entity,active);
 public static GameObject? Find(string name){foreach(var (id,data) in Context.EntityData)if(Context.IsActive(id)&&data.TryGetProperty("name",out var value)&&value.GetString()==name)return new(new Entity(id,Context.Generation));return null;}
 public T? GetComponent<T>() where T:Component=>GetComponents<T>().FirstOrDefault();

}
public sealed partial class Transform {
 internal Transform(Entity entity){Entity=entity;var v=Context.Read(entity);Position=v.Position;Rotation=v.Rotation;Scale=v.Scale;}
 public Vector3 position {get=>Entity.Transform.Position;set=>Entity.SetPosition(value);}
 public Quaternion rotation {get=>Entity.Transform.Rotation;set=>Entity.SetRotation(value);}
 public Vector3 localScale {get=>Context.Local(Entity).Scale;set=>Context.LocalTransform(Entity,scale:value);}
 public Vector3 localPosition {get=>Context.Local(Entity).Position;set=>Context.LocalTransform(Entity,position:value);}
 public Quaternion localRotation {get=>Context.Local(Entity).Rotation;set=>Context.LocalTransform(Entity,rotation:value);}
 public Vector3 lossyScale=>Entity.Transform.Scale;
 public Vector3 forward=>rotation*Vector3.forward;
 public Vector3 right=>rotation*Vector3.right;
 public Vector3 up=>rotation*Vector3.up;
 public Transform? parent {get=>Context.Parents.GetValueOrDefault(Entity.Id) is string id?new(new Entity(id,Context.Generation)):null;set=>SetParent(value);}
 public void SetParent(Transform? value,bool worldPositionStays=true)=>Context.Parent(Entity,value,worldPositionStays);
 public int childCount=>Context.Parents.Count(p=>p.Value==Entity.Id);
 public Transform GetChild(int index)=>new(new Entity(Context.Parents.Where(p=>p.Value==Entity.Id).ElementAt(index).Key,Context.Generation));
 public Transform? Find(string path){var current=this;foreach(var part in path.Split('/')){Transform? found=null;for(var i=0;i<current.childCount;i++){var child=current.GetChild(i);if(child.gameObject.name==part){found=child;break;}}if(found==null)return null;current=found;}return current;}
 public void Translate(Vector3 translation)=>position+=rotation*translation;
 public void Rotate(double x,double y,double z)=>rotation=rotation*Quaternion.Euler(x,y,z);
 public Vector3 TransformDirection(Vector3 direction)=>rotation*direction;
 public Vector3 InverseTransformDirection(Vector3 direction)=>Quaternion.Inverse(rotation)*direction;
}
public enum ForceMode {Force,Acceleration,Impulse,VelocityChange}
public sealed class Camera : Component {
 internal Camera(Entity entity){Entity=entity;}
 public static Camera? main=>Context.Cameras.Where(id=>Context.IsActive(id)&&Context.EntityData.TryGetValue(id,out var data)&&data.GetProperty("camera").GetProperty("active").GetBoolean()).Select(id=>new Camera(new Entity(id,Context.Generation))).FirstOrDefault();
}
public sealed class AudioSource : Component {
 internal AudioSource(Entity entity){Entity=entity;}
 public void Play()=>Entity.PlayAudio();public void Pause()=>Entity.PauseAudio();public void UnPause()=>Entity.ResumeAudio();public void Stop()=>Entity.StopAudio();
 public double volume {get=>Context.EntityData[Entity.Id].GetProperty("audioSource").GetProperty("volume").GetDouble();set=>Entity.SetAudioVolume(value);}
}
public sealed class Animator : Component {
 internal Animator(Entity entity){Entity=entity;}
 public void Play(string state)=>Entity.PlayAnimation(state,0);public void CrossFade(string state,double duration)=>Entity.PlayAnimation(state,duration);
 public void SetFloat(string name,double value)=>Entity.SetAnimationParameter(name,value);public void SetBool(string name,bool value)=>Entity.SetAnimationParameter(name,value?1:0);public void SetInteger(string name,int value)=>Entity.SetAnimationParameter(name,value);
}
public static class Time {
 private static double scale=1,delta,elapsed,unscaledElapsed,unscaledDelta;
 public static double deltaTime {get=>inFixedTimeStep?fixedDeltaTime:delta;internal set=>delta=value;}
 public static double unscaledDeltaTime {get=>inFixedTimeStep?fixedUnscaledDeltaTime:unscaledDelta;internal set=>unscaledDelta=value;}
 public static double time {get=>inFixedTimeStep?fixedTime:elapsed;internal set=>elapsed=value;}
 public static double unscaledTime {get=>inFixedTimeStep?fixedUnscaledTime:unscaledElapsed;internal set=>unscaledElapsed=value;}
 public static double realtimeSinceStartup=>unscaledTime;
 public static double timeSinceLevelLoad=>time;
 public static double timeAsDouble=>time;
 public static double unscaledTimeAsDouble=>unscaledTime;
 public static double fixedTime {get;internal set;}
 public static double fixedUnscaledTime {get;internal set;}
 public static double fixedUnscaledDeltaTime=>scale>0?fixedDeltaTime/scale:0;
 public static bool inFixedTimeStep {get;internal set;}
 public static double timeScale {get=>scale;set{if(!double.IsFinite(value)||value<0||value>8)throw new ArgumentException("Time scale must be between 0 and 8");scale=value;}}
 public static int frameCount {get;internal set;}
 public const double fixedDeltaTime=1.0/60.0;
 public const double maximumDeltaTime=0.25;
 internal static void Reset(){scale=1;delta=0;time=0;unscaledTime=0;unscaledDeltaTime=0;fixedTime=0;fixedUnscaledTime=0;frameCount=0;inFixedTimeStep=false;}
 internal static void Step(double value){unscaledDeltaTime=value;unscaledTime+=value;delta=Math.Min(value*scale,maximumDeltaTime);time+=delta;frameCount++;}
}
public enum KeyCode {W,A,S,D,UpArrow,DownArrow,LeftArrow,RightArrow,Space,Escape,LeftShift,RightShift}
public static partial class Input {
 private static string Code(KeyCode key)=>key switch {KeyCode.UpArrow=>"ArrowUp",KeyCode.DownArrow=>"ArrowDown",KeyCode.LeftArrow=>"ArrowLeft",KeyCode.RightArrow=>"ArrowRight",KeyCode.Space=>"Space",KeyCode.Escape=>"Escape",KeyCode.LeftShift=>"ShiftLeft",KeyCode.RightShift=>"ShiftRight",_=>"Key"+key};
 public static bool GetKey(KeyCode key)=>IsDown(Code(key));
 public static bool GetKeyDown(KeyCode key)=>IsDown(Code(key))&&!Context.PreviousKeys.Contains(Code(key));
 public static bool GetKeyUp(KeyCode key)=>!IsDown(Code(key))&&Context.PreviousKeys.Contains(Code(key));
 public static double GetAxisRaw(string axis)=>axis switch {"Horizontal"=>Math.Clamp(Axis("KeyA","KeyD")+Axis("ArrowLeft","ArrowRight"),-1,1),"Vertical"=>Math.Clamp(Axis("KeyS","KeyW")+Axis("ArrowDown","ArrowUp"),-1,1),"Mouse X"=>MouseDelta.X,"Mouse Y"=>MouseDelta.Y,_=>throw new ArgumentException("Unknown input axis "+axis)};
 public static double GetAxis(string axis)=>GetAxisRaw(axis);
}
public static partial class Mathf {
 public static double Abs(double v)=>Math.Abs(v);public static double Min(double a,double b)=>Math.Min(a,b);public static double Max(double a,double b)=>Math.Max(a,b);public static double Sign(double v)=>Math.Sign(v);
 public static double Sin(double v)=>Math.Sin(v);public static double Cos(double v)=>Math.Cos(v);public static double Tan(double v)=>Math.Tan(v);public static double Asin(double v)=>Math.Asin(v);public static double Acos(double v)=>Math.Acos(v);public static double Atan2(double y,double x)=>Math.Atan2(y,x);
 public static double Sqrt(double v)=>Math.Sqrt(v);public static double Pow(double v,double p)=>Math.Pow(v,p);public static double Exp(double v)=>Math.Exp(v);public static double Log(double v)=>Math.Log(v);
 public static double Floor(double v)=>Math.Floor(v);public static double Ceil(double v)=>Math.Ceiling(v);public static double Round(double v)=>Math.Round(v,MidpointRounding.ToEven);public static int FloorToInt(double v)=>(int)Math.Floor(v);public static int CeilToInt(double v)=>(int)Math.Ceiling(v);public static int RoundToInt(double v)=>(int)Math.Round(v,MidpointRounding.ToEven);
 public static double Clamp01(double v)=>Clamp(v,0,1);public static double LerpUnclamped(double a,double b,double t)=>a+(b-a)*t;public static double InverseLerp(double a,double b,double v)=>a==b?0:Clamp01((v-a)/(b-a));
 public static double MoveTowards(double current,double target,double maxDelta)=>Math.Abs(target-current)<=maxDelta?target:current+Math.Sign(target-current)*maxDelta;
 public static double Repeat(double t,double length)=>Clamp(t-Math.Floor(t/length)*length,0,length);public static double PingPong(double t,double length){t=Repeat(t,length*2);return length-Math.Abs(t-length);}
 public static bool Approximately(double a,double b)=>Math.Abs(a-b)<Math.Max(1e-6*Math.Max(Math.Abs(a),Math.Abs(b)),double.Epsilon*8);
}
public static class Random {
 public static double value=>ReplayRandom.NextDouble();public static void InitState(int seed)=>ReplayRandom.Reset(unchecked((uint)seed));public static double Range(double min,double max)=>min+(max-min)*value;public static int Range(int min,int max)=>max<=min?min:min+(int)(value*(max-min));
}
