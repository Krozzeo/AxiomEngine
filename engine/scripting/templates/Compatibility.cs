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
 public T? GetComponent<T>() where T:Component {
  _=Context.Read(Entity);Component? component=null;
  if(typeof(T)==typeof(AudioListener)&&Context.EntityData[Entity.Id].TryGetProperty("audioListener",out _))component=new AudioListener(Entity);
  else if(typeof(T)==typeof(BoxCollider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var bc)&&bc.GetProperty("dimension").GetInt32()==3&&bc.GetProperty("shape").GetString()=="box")component=new BoxCollider(Entity);
  else if(typeof(T)==typeof(SphereCollider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var sc)&&sc.GetProperty("dimension").GetInt32()==3&&sc.GetProperty("shape").GetString()=="sphere")component=new SphereCollider(Entity);
  else if(typeof(T)==typeof(BoxCollider2D)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var bc2)&&bc2.GetProperty("dimension").GetInt32()==2&&bc2.GetProperty("shape").GetString()=="box")component=new BoxCollider2D(Entity);
  else if(typeof(T)==typeof(CircleCollider2D)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var cc2)&&cc2.GetProperty("dimension").GetInt32()==2&&cc2.GetProperty("shape").GetString()=="sphere")component=new CircleCollider2D(Entity);
  else if(typeof(T)==typeof(Collider)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out _))component=new Collider(Entity);
  else if(typeof(T)==typeof(Collider2D)&&Context.EntityData[Entity.Id].TryGetProperty("collider",out var collider)&&collider.GetProperty("dimension").GetInt32()==2)component=new Collider2D(Entity);
  else if(typeof(T)==typeof(Transform))component=transform;
  else if(typeof(T)==typeof(Rigidbody2D)&&Context.Bodies.ContainsKey(Entity.Id)&&Context.EntityData[Entity.Id].GetProperty("collider").GetProperty("dimension").GetInt32()==2)component=new Rigidbody2D(Entity);
  else if(typeof(T)==typeof(Rigidbody)&&Context.Bodies.ContainsKey(Entity.Id))component=new Rigidbody(Entity);
  else if(typeof(T)==typeof(Camera)&&Context.Cameras.Contains(Entity.Id))component=new Camera(Entity);
  else if(typeof(T)==typeof(AudioSource)&&Context.AudioSources.Contains(Entity.Id))component=new AudioSource(Entity);
  else if(typeof(T)==typeof(Animator)&&Context.Animators.ContainsKey(Entity.Id))component=new Animator(Entity);
  return component as T??Context.LiveScripts.OfType<T>().FirstOrDefault(script=>script.Entity.Id==Entity.Id);
 }
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
public sealed class Rigidbody : Component {
 internal Rigidbody(Entity entity){Entity=entity;}
 public Vector3 linearVelocity {get=>Entity.RigidBody.Velocity;set=>Entity.SetVelocity(value);}
 public Vector3 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public Vector3 position {get=>Entity.Transform.Position;set=>Entity.SetPosition(value);}
 public void MovePosition(Vector3 position)=>Entity.SetPosition(position);
 public void MoveRotation(Quaternion rotation)=>Entity.SetRotation(rotation);
 public void AddForce(Vector3 force,ForceMode mode=ForceMode.Force){var data=Context.EntityData[Entity.Id].GetProperty("rigidBody");var mass=data.TryGetProperty("mass",out var m)?m.GetDouble():1;var acceleration=mode is ForceMode.Acceleration or ForceMode.VelocityChange?force:force/mass;linearVelocity+=acceleration*(mode is ForceMode.Impulse or ForceMode.VelocityChange?1:Time.deltaTime);}
}
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
 private static double scale=1,delta;
 public static double deltaTime {get=>inFixedTimeStep?fixedDeltaTime:delta;internal set=>delta=value;}
 public static double unscaledDeltaTime {get;internal set;}
 public static double time {get;internal set;}
 public static double unscaledTime {get;internal set;}
 public static double realtimeSinceStartup=>unscaledTime;
 public static double timeSinceLevelLoad=>time;
 public static double timeAsDouble=>time;
 public static double unscaledTimeAsDouble=>unscaledTime;
 public static double fixedTime {get;internal set;}
 public static double fixedUnscaledDeltaTime=>scale>0?fixedDeltaTime/scale:0;
 public static bool inFixedTimeStep {get;internal set;}
 public static double timeScale {get=>scale;set{if(!double.IsFinite(value)||value<0||value>8)throw new ArgumentException("Time scale must be between 0 and 8");scale=value;}}
 public static int frameCount {get;internal set;}
 public const double fixedDeltaTime=1.0/60.0;
 public const double maximumDeltaTime=0.25;
 internal static void Reset(){scale=1;delta=0;time=0;unscaledTime=0;unscaledDeltaTime=0;fixedTime=0;frameCount=0;inFixedTimeStep=false;}
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
public class Collider : Component {
 internal Collider(Entity entity){Entity=entity;}
 internal System.Text.Json.JsonElement Data=>Context.EntityData[Entity.Id].GetProperty("collider");
 public bool isTrigger=>Data.GetProperty("trigger").GetBoolean();
 public Bounds bounds {get{var t=Entity.Transform;var h=Vector3.Read(Data.GetProperty("halfExtents"));var dimension=Data.GetProperty("dimension").GetInt32();Vector3 extents;if(Data.GetProperty("shape").GetString()=="sphere")extents=new(h.X,h.X,dimension==2?0:h.X);else{var x=t.Rotation*Vector3.right;var y=t.Rotation*Vector3.up;var z=t.Rotation*Vector3.forward;extents=new(Math.Abs(x.X)*h.X+Math.Abs(y.X)*h.Y+Math.Abs(z.X)*h.Z,Math.Abs(x.Y)*h.X+Math.Abs(y.Y)*h.Y+Math.Abs(z.Y)*h.Z,dimension==2?0:Math.Abs(x.Z)*h.X+Math.Abs(y.Z)*h.Y+Math.Abs(z.Z)*h.Z);}return new(t.Position,extents*2);}}
}
public class Collider2D : Collider {internal Collider2D(Entity entity):base(entity){}}
public sealed class Collision {
 public Collider collider {get;}
 public GameObject gameObject=>collider.gameObject;
 public Vector3 normal {get;}
 public Vector3 point {get;}
 internal Collision(Collider collider,Vector3 normal,Vector3 point){this.collider=collider;this.normal=normal;this.point=point;}
}
public sealed class Collision2D {
 public Collider2D collider {get;}
 public GameObject gameObject=>collider.gameObject;
 public Vector2 normal {get;}
 public Vector2 point {get;}
 internal Collision2D(Collider2D collider,Vector3 normal,Vector3 point){this.collider=collider;this.normal=new(normal.X,normal.Y);this.point=new(point.X,point.Y);}
}
public readonly record struct Ray(Vector3 origin,Vector3 direction) {public Vector3 GetPoint(double distance)=>origin+direction.normalized*distance;}
public readonly record struct RaycastHit(Collider collider,double distance,Vector3 point,Vector3 normal) {public Transform transform=>collider.transform;}
public static class Physics {
 // Snapshot query follows the engine's sphere/oriented-box baseline. Capsules and
 // mesh geometry use their configured box collider, exactly as the current solver.
 public static bool Raycast(Vector3 origin,Vector3 direction,out RaycastHit hit,double maxDistance=1000,int layerMask=-1)=>Cast(origin,direction,out hit,maxDistance,layerMask,3);
 public static bool Raycast(Vector3 origin,Vector3 direction,double maxDistance=1000,int layerMask=-1)=>Cast(origin,direction,out _,maxDistance,layerMask,3);
 internal static bool Cast(Vector3 origin,Vector3 direction,out RaycastHit hit,double maxDistance,int layerMask,int dimension){
  hit=default;if(!double.IsFinite(maxDistance)||maxDistance<0)throw new ArgumentException("Ray distance must be finite and nonnegative");if(dimension==2)direction.Z=0;if(direction.sqrMagnitude<1e-24)return false;direction=direction.normalized;var best=maxDistance;var found=false;
  foreach(var (id,data) in Context.EntityData.OrderBy(p=>p.Key,StringComparer.Ordinal)){if(!data.TryGetProperty("collider",out var c)||c.GetProperty("dimension").GetInt32()!=dimension||(c.GetProperty("layer").GetUInt32()&unchecked((uint)layerMask))==0)continue;
   var entity=new Entity(id,Context.Generation);var t=Context.Read(entity);var half=Vector3.Read(c.GetProperty("halfExtents"));var relative=origin-t.Position;double distance;Vector3 normal;
   if(c.GetProperty("shape").GetString()=="sphere"){if(dimension==2)relative.Z=0;var squared=relative.sqrMagnitude-half.X*half.X;var q=Vector3.Dot(relative,direction);var discriminant=q*q-squared;if(squared<=0){distance=0;normal=-direction;}else{if(discriminant<0)continue;distance=-q-Math.Sqrt(discriminant);if(distance<0)continue;normal=(origin+direction*distance-t.Position).normalized;}}
   else{var inverse=Quaternion.Inverse(t.Rotation);var o=inverse*relative;var d=inverse*direction;var a=new[]{o.X,o.Y,o.Z};var b=new[]{d.X,d.Y,d.Z};var h=new[]{half.X,half.Y,half.Z};var near=0.0;var far=best;var localNormal=Vector3.zero;for(var axis=0;axis<dimension;axis++){if(Math.Abs(b[axis])<1e-12){if(Math.Abs(a[axis])>h[axis])far=-1;}else{var x=(-h[axis]-a[axis])/b[axis];var y=(h[axis]-a[axis])/b[axis];var lower=Math.Min(x,y);if(lower>near){near=lower;localNormal=axis==0?new(-Math.Sign(b[axis]),0,0):axis==1?new(0,-Math.Sign(b[axis]),0):new(0,0,-Math.Sign(b[axis]));}far=Math.Min(far,Math.Max(x,y));}}if(near>far)continue;distance=near;normal=t.Rotation*localNormal;}
   if(distance<=best&&(!found||distance<best)){best=distance;found=true;hit=new(new Collider(entity),distance,origin+direction*distance,normal);}
  }return found;
 }
}
public readonly record struct RaycastHit2D(Collider2D? collider,double distance,Vector2 point,Vector2 normal){public static implicit operator bool(RaycastHit2D hit)=>hit.collider!=null;}
public static class Physics2D {
 public static RaycastHit2D Raycast(Vector2 origin,Vector2 direction,double distance=1000,int layerMask=-1){if(!Physics.Cast(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),out var hit,distance,layerMask,2))return default;return new(new Collider2D(hit.collider.Entity),hit.distance,new(hit.point.X,hit.point.Y),new(hit.normal.X,hit.normal.Y));}
}
public enum ForceMode2D {Force,Impulse}
public sealed class Rigidbody2D : Component {
 internal Rigidbody2D(Entity entity){Entity=entity;}
 public Vector2 linearVelocity {get{var v=Entity.RigidBody.Velocity;return new(v.X,v.Y);}set{var v=Entity.RigidBody.Velocity;Entity.SetVelocity(new Vector3(value.X,value.Y,v.Z));}}
 public Vector2 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public Vector2 position {get{var p=transform.position;return new(p.X,p.Y);}set{var p=transform.position;transform.position=new Vector3(value.X,value.Y,p.Z);}}
 public void MovePosition(Vector2 position){this.position=position;}
 public void AddForce(Vector2 force,ForceMode2D mode=ForceMode2D.Force)=>new Rigidbody(Entity).AddForce(new Vector3(force.X,force.Y,0),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);
}
