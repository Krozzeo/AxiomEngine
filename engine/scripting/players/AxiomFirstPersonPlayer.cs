using System;
using Axiom.Gameplay;
namespace Game;
public sealed class AxiomFirstPersonPlayer : MonoBehaviour {
 [Title("Movement")] [Range(0.1,30)] public double Speed = 5;
 [Range(0,20)] public double JumpSpeed = 6;
 [Title("Look")] [Range(0.01,2)] public double MouseSensitivity = 0.15;
 [ReadOnly] public bool Grounded;
 private Entity camera;
 private double yaw, pitch;
 private bool jumpWasDown;
 public override void OnStart() {
  camera = Entity.FindChildWithCamera();
  var q = Entity.Transform.Rotation;
  yaw = Math.Atan2(2*(q.W*q.Y+q.X*q.Z),1-2*(q.Y*q.Y+q.X*q.X))*180/Math.PI;
  pitch = 0;
 }
 public override void OnUpdate(double deltaSeconds) {
  yaw -= Input.MouseDelta.X * MouseSensitivity;
  pitch = Math.Clamp(pitch - Input.MouseDelta.Y * MouseSensitivity, -80, 80);
  var x = Math.Clamp(Input.Axis("KeyA","KeyD") + Input.Axis("ArrowLeft","ArrowRight"), -1, 1);
  var forward = Math.Clamp(Input.Axis("KeyS","KeyW") + Input.Axis("ArrowDown","ArrowUp"), -1, 1);
  var length = Math.Max(1,Math.Sqrt(x*x+forward*forward));x /= length;forward /= length;
  var angle = yaw*Math.PI/180;
  var vx = (x*Math.Cos(angle)-forward*Math.Sin(angle))*Speed;
  var vz = (-x*Math.Sin(angle)-forward*Math.Cos(angle))*Speed;
  Grounded = Entity.IsGrounded;
  var jump = Input.IsDown("Space");
  var vy = Entity.RigidBody.Velocity.Y;
  if(jump && !jumpWasDown && Grounded)vy=JumpSpeed;
  jumpWasDown=jump;
  Entity.SetVelocity(new Vector3(vx,vy,vz));
  Entity.SetRotation(Quaternion.Euler(new Vector3(0,yaw,0)));
  camera.SetRotation(Quaternion.Euler(new Vector3(pitch,yaw,0)));
 }
}
