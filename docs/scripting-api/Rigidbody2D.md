# Rigidbody2D

XY velocities/position, Z rotation in degrees and angularVelocity in degrees/second. AddForce/AddTorque and off-center forces use native mass/inertia; torque input is physical torque, not degrees. gravityScale, freezeRotation, dynamic/kinematic bodyType and isKinematic are available. RigidbodyType2D.Static is explicitly rejected: use a collider without a body for a static object. Body-only dynamic objects integrate without collision.

```csharp
public override void FixedUpdate() {
 var body = GetComponent<Rigidbody2D>();
 if (body != null && Input.GetKeyDown(KeyCode.Space))
  body.AddForce(Vector2.up * 4, ForceMode2D.Impulse);
}
```

## Compatibility limits

The native timestep is 1/60 second with at most eight catch-up steps. Box/sphere and box/circle are the actual shapes; no capsule, mesh, compound collider, joint, continuous collision detection, sleep/interpolation, solver material asset, or per-axis constraint system is claimed. Collider dimensions are explicit world-space half-extents in the current engine and are not automatically multiplied by Transform scale. Changes are runtime-only and Stop restores authored state. MovePosition/MoveRotation set the pose immediately; they do not queue interpolated kinematic movement. Kinematic bodies are manually posed in this baseline; their stored velocity is not integrated autonomously (including Rigidbody2D). The NonAlloc overloads bound writes to the caller buffer, but this managed compatibility implementation still allocates temporary query arrays.


## Implemented declarations

```csharp
public sealed class Rigidbody2D : Component {
 internal Rigidbody2D(Entity entity){Entity=entity;}
 private Rigidbody Body=>new(Entity);
 public Vector2 linearVelocity {get{var v=Body.linearVelocity;return new(v.X,v.Y);}set=>Body.linearVelocity=new(value.X,value.Y,0);}
 public Vector2 velocity {get=>linearVelocity;set=>linearVelocity=value;}
 public double angularVelocity {get=>Body.angularVelocity.Z*180/Math.PI;set=>Body.angularVelocity=new(0,0,value*Math.PI/180);}
 public double mass {get=>Body.mass;set=>Body.mass=value;}
 public double gravityScale {get=>PhysicsData.Number(Entity,"gravityScale",1);set=>PhysicsData.Number(Entity,"gravityScale",value,-100,100);}
 public bool freezeRotation {get=>Body.freezeRotation;set=>Body.freezeRotation=value;}
 public RigidbodyType2D bodyType {get=>Body.isKinematic?RigidbodyType2D.Kinematic:RigidbodyType2D.Dynamic;set{if(value==RigidbodyType2D.Static)throw new NotSupportedException("Static 2D bodies use a Collider2D without Rigidbody2D");if(!Enum.IsDefined(value))throw new ArgumentException("Invalid body type");Body.isKinematic=value==RigidbodyType2D.Kinematic;}}
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

public enum ForceMode2D {Force,Impulse}

public enum RigidbodyType2D {Dynamic,Kinematic,Static}
```
