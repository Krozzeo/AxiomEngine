using Axiom.Gameplay;
namespace Game;
public sealed class PhysicsApiLab : MonoBehaviour {
 public double JumpImpulse=5;
 public double Damping=.2;
 [ReadOnly] public bool Sleeping=false;
 public double SpinImpulse=1;
 [ReadOnly] public double Height=0;
 [ReadOnly] public double Spin=0;
 [ReadOnly] public int ContactPoints=0;
 [ReadOnly] public int NearbyColliders=0;
 private Rigidbody? body3;private Rigidbody2D? body2;private Vector3 origin;
 public override void Start(){origin=transform.position;body3=GetComponent<Rigidbody>();body2=GetComponent<Rigidbody2D>();Debug.Log("Physics API Lab: Space = upward/off-center impulse, R = reset, K = kinematic velocity, T = sleep/wake, G = toggle gravity. Select this object to watch live body/contact values.");}
 public override void Update(){
  Height=transform.position.Y;
  if(body3!=null){body3.linearDamping=Damping;Sleeping=body3.IsSleeping();}if(body2!=null){body2.linearDamping=Damping;Sleeping=body2.IsSleeping();}
  if(Input.GetKeyDown(KeyCode.K)){if(body3!=null){body3.isKinematic=!body3.isKinematic;body3.linearVelocity=body3.isKinematic?Vector3.right:Vector3.zero;}if(body2!=null){body2.isKinematic=!body2.isKinematic;body2.linearVelocity=body2.isKinematic?Vector2.right:Vector2.zero;}}
  if(Input.GetKeyDown(KeyCode.T)){if(body3!=null){if(body3.IsSleeping())body3.WakeUp();else body3.Sleep();}if(body2!=null){if(body2.IsSleeping())body2.WakeUp();else body2.Sleep();}}
  if(Input.GetKeyDown(KeyCode.G)){if(body3!=null)Physics.gravity=Physics.gravity.Y==0?new Vector3(0,-9.81,0):Vector3.zero;if(body2!=null)Physics2D.gravity=Physics2D.gravity.Y==0?new Vector2(0,-9.81):Vector2.zero;}

  Spin=body2!=null?body2.angularVelocity:(body3?.angularVelocity.Z??0)*Mathf.Rad2Deg;
  NearbyColliders=body2!=null?Physics2D.OverlapCircleAll(new Vector2(transform.position.X,transform.position.Y),2).Length:Physics.OverlapSphere(transform.position,2).Length;
  if(Input.IsDown("KeyR")){transform.position=origin;transform.rotation=Quaternion.identity;if(body2!=null){body2.linearVelocity=Vector2.zero;body2.angularVelocity=0;}if(body3!=null){body3.linearVelocity=Vector3.zero;body3.angularVelocity=Vector3.zero;}}
  if(Input.GetKeyDown(KeyCode.Space)){if(body2!=null){body2.AddForce(Vector2.up*JumpImpulse,ForceMode2D.Impulse);body2.AddTorque(SpinImpulse,ForceMode2D.Impulse);}if(body3!=null){body3.AddForceAtPosition(Vector3.up*JumpImpulse,transform.position+Vector3.right*.2,ForceMode.Impulse);body3.AddTorque(Vector3.forward*SpinImpulse,ForceMode.Impulse);}}
 }
 public override void OnCollisionEnter(Collision c){ContactPoints=c.contactCount;}
 public override void OnCollisionStay(Collision c){ContactPoints=c.contactCount;}
 public override void OnCollisionExit(Collision c){ContactPoints=0;}
 public override void OnCollisionEnter2D(Collision2D c){ContactPoints=c.contactCount;}
 public override void OnCollisionStay2D(Collision2D c){ContactPoints=c.contactCount;}
 public override void OnCollisionExit2D(Collision2D c){ContactPoints=0;}
}
