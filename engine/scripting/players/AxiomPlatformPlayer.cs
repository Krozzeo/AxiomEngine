using System;
using Axiom.Gameplay;
namespace Game;
public sealed class AxiomPlatformPlayer : MonoBehaviour {
 [Title("Movement")] [Range(0.1,30)] public double Speed = 5;
 [Range(0,20)] public double JumpSpeed = 6;
 [ReadOnly] public bool Grounded;
 private bool jumpWasDown;
 public override void OnUpdate(double deltaSeconds) {
  var x=Math.Clamp(Input.Axis("KeyA","KeyD")+Input.Axis("ArrowLeft","ArrowRight"),-1,1);
  var velocity=Entity.RigidBody.Velocity;Grounded=Entity.IsGrounded;
  var jump=Input.IsDown("Space");var y=velocity.Y;
  if(jump&&!jumpWasDown&&Grounded)y=JumpSpeed;jumpWasDown=jump;
  Entity.SetVelocity(new Vector3(x*Speed,y,0));
 }
}
