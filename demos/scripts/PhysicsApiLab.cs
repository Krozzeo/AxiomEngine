using Axiom.Gameplay;
namespace Game;
public sealed class PhysicsApiLab : MonoBehaviour {
 public double JumpImpulse=5;
 public double SpinImpulse=1;
 [ReadOnly] public double Height=0;
 [ReadOnly] public double Spin=0;
 [ReadOnly] public int ContactPoints=0;
 [ReadOnly] public int NearbyColliders=0;
 private Rigidbody? body3;private Rigidbody2D? body2;private Vector3 origin;
 public override void Start(){origin=transform.position;body3=GetComponent<Rigidbody>();body2=GetComponent<Rigidbody2D>();Debug.Log("Physics API Lab: Space = upward/off-center impulse, R = reset. Select this object to watch live body/contact values.");}
 public override void Update(){
  Height=transform.position.Y;
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
