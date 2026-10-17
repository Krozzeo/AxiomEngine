# Rigidbody2D

A live XY body facade with linear velocity and position in world units; rotation and angular velocity use degrees and degrees/second. Supports Dynamic, Kinematic and Static bodyType, gravityScale, force/impulse/torque, constraints, simulated and sleep/wake. A collider-only entity remains a valid static body.

## Expanded in 0.0.47

Native 2D/3D body integration supports custom gravity, stable damping v/(1+damping*dt), moving kinematic bodies without gravity, per-axis position/rotation constraints, explicit Sleep/WakeUp and impact wake-up. Automatic sleep thresholds and interpolation remain pending. Rigidbody2D includes Static bodyType and simulated toggles. Pair/layer collision exclusions are honored by native resolution and triggers; query layer masks are separate. Collision relativeVelocity uses native pre-solver point velocity (including spin), with self-minus-other receiver convention; native diagnostics also expose normal impulse per contact.

Continuous mode uses adaptive fixed-step subdivision up to 64 samples (sized by smallest collider extent and linear travel), retains first-hit contact evidence, and reports one logical fixed step. It is bounded anti-tunneling, not unrestricted analytic TOI or angular CCD. ContinuousDynamic/Speculative throw a documented unsupported error. Maximum velocity remains 10000 world units/s; extreme thin/high-speed cases may exceed the sampling budget.

Sphere/Circle casts use exact closest points with conservative advancement capped at 128 iterations and 1e-7 tolerance. Translating box casts use swept oriented SAT against boxes and reverse sphere casts against spheres. All/nearest/buffer variants preserve deterministic distance order and trigger/layer filters. Very grazing contacts can exhaust the iteration limit and miss; no capsule/mesh casts are claimed. NonAlloc overloads bound output writes but allocate temporary managed arrays. ContactFilter2D currently supports trigger, layer and depth inclusion/exclusion for ray and circle overlap buffers, not normal-angle filtering.

Still pending: capsule/edge/polygon/mesh/compound colliders, joints, terrain, arbitrary center/inertia overrides, contact modification and solver tuning. Collider extents are world units, independent of Transform scale; MovePosition/MoveRotation set immediate poses.




## Implemented declarations

```csharp
public sealed partial class Rigidbody2D : Component {
 internal Rigidbody2D(Entity entity){Entity=entity;}
 private Rigidbody Body=>new(Entity);
 public Vector2 linearVelocity {get{var v=Body.linearVelocity;return new(v.X,v.Y);}set=>Body.linearVelocity=new(value.X,value.Y,0);}
 public Vector2 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public double angularVelocity {get=>Body.angularVelocity.Z*180/Math.PI;set=>Body.angularVelocity=new(0,0,value*Math.PI/180);}
 public double mass {get=>Body.mass;set=>Body.mass=value;}
 public double gravityScale {get=>PhysicsData.Number(Entity,"gravityScale",1);set=>PhysicsData.Number(Entity,"gravityScale",value,-100,100);}
 public bool freezeRotation {get=>Body.freezeRotation;set=>Body.freezeRotation=value;}
 public RigidbodyType2D bodyType {get=>Context.EntityData[Entity.Id].TryGetProperty("runtimeStatic",out var s)&&s.GetBoolean()?RigidbodyType2D.Static:Body.isKinematic?RigidbodyType2D.Kinematic:RigidbodyType2D.Dynamic;set{if(!Enum.IsDefined(value))throw new ArgumentException("Invalid body type");Context.Property(Entity,"runtimeStatic",JsonValue.Create(value==RigidbodyType2D.Static));Body.isKinematic=value==RigidbodyType2D.Kinematic;}}
 public bool isKinematic {get=>Body.isKinematic;set=>Body.isKinematic=value;}
 public Vector2 position {get{var p=transform.position;return new(p.X,p.Y);}set=>transform.position=new(value.X,value.Y,transform.position.Z);}
 public double rotation {get{var q=transform.rotation;return 2*Math.Atan2(q.Z,q.W)*180/Math.PI;}set=>transform.rotation=Quaternion.Euler(0,0,value);}
 public void MovePosition(Vector2 value)=>position=value;
 public void MoveRotation(double angle)=>rotation=angle;
 public Vector2 GetPointVelocity(Vector2 point){var v=Body.GetPointVelocity(new(point.X,point.Y,transform.position.Z));return new(v.X,v.Y);}
 public void AddForce(Vector2 force,ForceMode2D mode=ForceMode2D.Force){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");Body.AddForce(new(force.X,force.Y,0),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);}
 public void AddRelativeForce(Vector2 force,ForceMode2D mode=ForceMode2D.Force){var v=transform.rotation*new Vector3(force.X,force.Y,0);AddForce(new(v.X,v.Y),mode);}
 public void AddTorque(double torque,ForceMode2D mode=ForceMode2D.Force){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");Body.AddTorque(new(0,0,torque),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);}
 public void AddForceAtPosition(Vector2 force,Vector2 position,ForceMode2D mode=ForceMode2D.Force){if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");Body.AddForceAtPosition(new(force.X,force.Y,0),new(position.X,position.Y,transform.position.Z),mode==ForceMode2D.Impulse?ForceMode.Impulse:ForceMode.Force);}
}

public sealed partial class Rigidbody2D {
 public double linearDamping {get=>Body.linearDamping;set=>Body.linearDamping=value;}public double angularDamping {get=>Body.angularDamping;set=>Body.angularDamping=value;}
 public double drag {get=>linearDamping;set=>linearDamping=value;}public double angularDrag {get=>angularDamping;set=>angularDamping=value;}
 public bool simulated {get=>!Context.EntityData[Entity.Id].TryGetProperty("runtimeSimulated",out var v)||v.GetBoolean();set=>Context.Property(Entity,"runtimeSimulated",JsonValue.Create(value));}
 public RigidbodyConstraints2D constraints {get{var c=(int)Body.constraints;return (RigidbodyConstraints2D)((c&6)>>1|((c&64)!=0?4:0));}set{if(((int)value&~7)!=0)throw new ArgumentException("Invalid 2D constraints");Body.constraints=(RigidbodyConstraints)(((int)value&3)<<1|(((int)value&4)!=0?64:0));}}
 public CollisionDetectionMode2D collisionDetectionMode {get=>Body.collisionDetectionMode==CollisionDetectionMode.Discrete?CollisionDetectionMode2D.Discrete:CollisionDetectionMode2D.Continuous;set{if(!Enum.IsDefined(value))throw new ArgumentException();Body.collisionDetectionMode=value==CollisionDetectionMode2D.Continuous?CollisionDetectionMode.Continuous:CollisionDetectionMode.Discrete;}}
 public bool IsSleeping()=>Body.IsSleeping();public bool IsAwake()=>!IsSleeping();public void Sleep()=>Body.Sleep();public void WakeUp()=>Body.WakeUp();
}

public enum RigidbodyType2D {Dynamic,Kinematic,Static}

public enum ForceMode2D {Force,Impulse}

public enum RigidbodyConstraints2D {None=0,FreezePositionX=1,FreezePositionY=2,FreezeRotation=4,FreezePosition=3,FreezeAll=7}

public enum CollisionDetectionMode2D {Discrete,Continuous}
```
