# Rigidbody

A live 3D body facade with mass, linear/angular velocity, gravity, dynamic/kinematic state, pose, force/impulse/torque and off-center forces. Angular units are radians/second. Collider dimensions use world units. Read a body with GetComponent<Rigidbody>(); add one dynamically or author one before Play.

## Expanded in 0.0.47

Native 2D/3D body integration supports custom gravity, stable damping v/(1+damping*dt), moving kinematic bodies without gravity, per-axis position/rotation constraints, explicit Sleep/WakeUp and impact wake-up. Automatic sleep thresholds and interpolation remain pending. Rigidbody2D includes Static bodyType and simulated toggles. Pair/layer collision exclusions are honored by native resolution and triggers; query layer masks are separate. Collision relativeVelocity uses native pre-solver point velocity (including spin), with self-minus-other receiver convention; native diagnostics also expose normal impulse per contact.

Continuous mode uses adaptive fixed-step subdivision up to 64 samples (sized by smallest collider extent and linear travel), retains first-hit contact evidence, and reports one logical fixed step. It is bounded anti-tunneling, not unrestricted analytic TOI or angular CCD. ContinuousDynamic/Speculative throw a documented unsupported error. Maximum velocity remains 10000 world units/s; extreme thin/high-speed cases may exceed the sampling budget.

Sphere/Circle casts use exact closest points with conservative advancement capped at 128 iterations and 1e-7 tolerance. Translating box casts use swept oriented SAT against boxes and reverse sphere casts against spheres. All/nearest/buffer variants preserve deterministic distance order and trigger/layer filters. Very grazing contacts can exhaust the iteration limit and miss; no capsule/mesh casts are claimed. NonAlloc overloads bound output writes but allocate temporary managed arrays. ContactFilter2D currently supports trigger, layer and depth inclusion/exclusion for ray and circle overlap buffers, not normal-angle filtering.

Still pending: capsule/edge/polygon/mesh/compound colliders, joints, terrain, arbitrary center/inertia overrides, contact modification and solver tuning. Collider extents are world units, independent of Transform scale; MovePosition/MoveRotation set immediate poses.




## Implemented declarations

```csharp
public sealed partial class Rigidbody : Component {
 internal Rigidbody(Entity entity){Entity=entity;}
 public Vector3 linearVelocity {get=>Entity.RigidBody.Velocity;set=>Entity.SetVelocity(value);}
 public Vector3 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public Vector3 angularVelocity {get=>PhysicsData.Angular(Entity);set=>PhysicsData.Angular(Entity,value);}
 public double mass {get=>PhysicsData.Number(Entity,"mass",1);set=>PhysicsData.Number(Entity,"mass",value,.001,1000000);}
 public bool useGravity {get=>PhysicsData.Number(Entity,"gravityScale",1)!=0;set=>PhysicsData.Number(Entity,"gravityScale",value?1:0,-100,100);}
 public bool isKinematic {get=>PhysicsData.Kinematic(Entity);set=>Context.Property(Entity,"runtimeKinematic",JsonValue.Create(value));}
 public bool freezeRotation {get=>PhysicsData.Body(Entity).TryGetProperty("freezeRotation",out var v)&&v.GetBoolean();set=>PhysicsData.Set(Entity,"rigidBody","freezeRotation",JsonValue.Create(value)!);}
 public Vector3 position {get=>transform.position;set=>transform.position=value;}
 public Quaternion rotation {get=>transform.rotation;set=>transform.rotation=value;}
 public Vector3 worldCenterOfMass=>position;
 public void MovePosition(Vector3 value)=>position=value;
 public void MoveRotation(Quaternion value)=>rotation=value;
 public Vector3 GetPointVelocity(Vector3 worldPoint)=>linearVelocity+Vector3.Cross(angularVelocity,worldPoint-position);
 public Vector3 GetRelativePointVelocity(Vector3 localPoint)=>GetPointVelocity(transform.TransformPoint(localPoint));
 public void AddForce(Vector3 force,ForceMode mode=ForceMode.Force){PhysicsData.Finite(force);if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");if(!PhysicsData.CanForce(Entity))return;var change=mode is ForceMode.Acceleration or ForceMode.VelocityChange?force:force/mass;linearVelocity+=change*(mode is ForceMode.Impulse or ForceMode.VelocityChange?1:Time.fixedDeltaTime);}
 public void AddForce(double x,double y,double z,ForceMode mode=ForceMode.Force)=>AddForce(new(x,y,z),mode);
 public void AddRelativeForce(Vector3 force,ForceMode mode=ForceMode.Force)=>AddForce(rotation*force,mode);
 public void AddTorque(Vector3 torque,ForceMode mode=ForceMode.Force){PhysicsData.Finite(torque);if(!Enum.IsDefined(mode))throw new ArgumentException("Invalid force mode");if(!PhysicsData.CanForce(Entity)||freezeRotation)return;var change=mode is ForceMode.Acceleration or ForceMode.VelocityChange?torque:PhysicsData.InverseInertia(Entity,torque);angularVelocity+=change*(mode is ForceMode.Impulse or ForceMode.VelocityChange?1:Time.fixedDeltaTime);}
 public void AddRelativeTorque(Vector3 torque,ForceMode mode=ForceMode.Force)=>AddTorque(rotation*torque,mode);
 public void AddForceAtPosition(Vector3 force,Vector3 position,ForceMode mode=ForceMode.Force){PhysicsData.Finite(position);AddForce(force,mode);AddTorque(Vector3.Cross(position-this.position,force),mode);}
}

public sealed partial class Rigidbody {
 public double linearDamping {get=>PhysicsData.Number(Entity,"linearDamping");set=>PhysicsData.Number(Entity,"linearDamping",value,0,10000);}
 public double angularDamping {get=>PhysicsData.Number(Entity,"angularDamping");set=>PhysicsData.Number(Entity,"angularDamping",value,0,10000);}
 public double drag {get=>linearDamping;set=>linearDamping=value;}public double angularDrag {get=>angularDamping;set=>angularDamping=value;}
 public RigidbodyConstraints constraints {get=>(RigidbodyConstraints)(int)PhysicsData.Number(Entity,"constraints");set{if(((int)value&~126)!=0)throw new ArgumentException("Invalid constraints");PhysicsData.Number(Entity,"constraints",(int)value,0,126);}}
 public CollisionDetectionMode collisionDetectionMode {get=>PhysicsData.Body(Entity).TryGetProperty("continuous",out var v)&&v.GetBoolean()?CollisionDetectionMode.Continuous:CollisionDetectionMode.Discrete;set{if(value is not CollisionDetectionMode.Discrete and not CollisionDetectionMode.Continuous)throw new NotSupportedException("Only bounded substep Continuous and Discrete are implemented");PhysicsData.Set(Entity,"rigidBody","continuous",JsonValue.Create(value==CollisionDetectionMode.Continuous)!);}}
 public bool IsSleeping()=>PhysicsData.Body(Entity).TryGetProperty("sleeping",out var v)&&v.GetBoolean();
 public void Sleep(){linearVelocity=Vector3.zero;angularVelocity=Vector3.zero;PhysicsData.Set(Entity,"rigidBody","sleeping",JsonValue.Create(true)!);}
 public void WakeUp()=>PhysicsData.Set(Entity,"rigidBody","sleeping",JsonValue.Create(false)!);
}

public enum ForceMode {Force,Acceleration,Impulse,VelocityChange}

public enum RigidbodyConstraints {None=0,FreezePositionX=2,FreezePositionY=4,FreezePositionZ=8,FreezeRotationX=16,FreezeRotationY=32,FreezeRotationZ=64,FreezePosition=14,FreezeRotation=112,FreezeAll=126}

public enum CollisionDetectionMode {Discrete,Continuous,ContinuousDynamic,ContinuousSpeculative}
```
