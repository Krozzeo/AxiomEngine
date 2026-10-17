# Rigidbody

Linear/angular velocity, mass, useGravity, kinematic mode, full freezeRotation, world pose, point velocity and force/torque APIs. Use AddForce/AddTorque in FixedUpdate. Force/Acceleration use fixedDeltaTime; Impulse/VelocityChange do not. Torque uses oriented box/sphere inertia. AddForceAtPosition generates both linear and angular change. Forces on inactive or kinematic objects have no effect. Forces accumulate into the runtime velocity immediately and are integrated on the next native step; getters can see that accumulated velocity before simulation.

```csharp
public override void FixedUpdate() {
 var body = GetComponent<Rigidbody>();
 if (body != null) body.AddRelativeForce(Vector3.forward * 10);
}
```

## Compatibility limits

The native timestep is 1/60 second with at most eight catch-up steps. Box/sphere and box/circle are the actual shapes; no capsule, mesh, compound collider, joint, continuous collision detection, sleep/interpolation, solver material asset, or per-axis constraint system is claimed. Collider dimensions are explicit world-space half-extents in the current engine and are not automatically multiplied by Transform scale. Changes are runtime-only and Stop restores authored state. MovePosition/MoveRotation set the pose immediately; they do not queue interpolated kinematic movement. The NonAlloc overloads bound writes to the caller buffer, but this managed compatibility implementation still allocates temporary query arrays.


## Implemented declarations

```csharp
public sealed class Rigidbody : Component {
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

public enum ForceMode {Force,Acceleration,Impulse,VelocityChange}
```
