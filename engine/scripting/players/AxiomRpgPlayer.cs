using System;
using Axiom.Gameplay;
namespace Game;
public sealed class AxiomRpgPlayer : MonoBehaviour {
 [Title("Movement")] [Range(0.1,30)] public double Speed = 4;
 public override void OnUpdate(double deltaSeconds) {
  var x=Math.Clamp(Input.Axis("KeyA","KeyD")+Input.Axis("ArrowLeft","ArrowRight"),-1,1);
  var y=Math.Clamp(Input.Axis("KeyS","KeyW")+Input.Axis("ArrowDown","ArrowUp"),-1,1);
  var length=Math.Max(1,Math.Sqrt(x*x+y*y));
  Entity.SetVelocity(new Vector3(x/length*Speed,y/length*Speed,0));
 }
}
