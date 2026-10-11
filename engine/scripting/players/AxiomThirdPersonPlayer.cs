using System;
using Axiom.Gameplay;
namespace Game;
public sealed class AxiomThirdPersonPlayer : MonoBehaviour {
 [Title("Movement")] [Range(0.1,30)] public double Speed = 5;
 [Range(0,20)] public double JumpSpeed = 6;
 [Range(1,1080)] public double TurnSpeed = 360;
 [Title("Look")] [Range(0.01,2)] public double MouseSensitivity = 0.15;
 [Range(1,12)] public double CameraDistance = 4;
 [Range(0,3)] public double CameraHeight = 0.7;
 [ReadOnly] public bool Grounded;
 private Entity camera;
 private double yaw, pitch, bodyYaw;
 private bool jumpWasDown;
 public override void OnStart() {
  camera = Entity.FindChildWithCamera();
  var q = Entity.Transform.Rotation;
  yaw = Math.Atan2(2*(q.W*q.Y+q.X*q.Z),1-2*(q.Y*q.Y+q.X*q.X))*180/Math.PI;
  bodyYaw=yaw;pitch = -15;
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
  if(Math.Abs(vx)+Math.Abs(vz)>0.001) {
   var target=-Math.Atan2(vx,-vz)*180/Math.PI;
   var difference=(target-bodyYaw+540)%360-180;
   bodyYaw+=Math.Clamp(difference,-TurnSpeed*deltaSeconds,TurnSpeed*deltaSeconds);
   Entity.SetRotation(Quaternion.Euler(new Vector3(0,bodyYaw,0)));
  }
  var p=Entity.Transform.Position;var tilt=pitch*Math.PI/180;
  camera.SetPosition(new Vector3(p.X+Math.Sin(angle)*Math.Cos(tilt)*CameraDistance,p.Y+CameraHeight-Math.Sin(tilt)*CameraDistance,p.Z+Math.Cos(angle)*Math.Cos(tilt)*CameraDistance));
  camera.SetRotation(Quaternion.Euler(new Vector3(pitch,yaw,0)));
 }
}
