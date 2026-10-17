using Axiom.Gameplay;
namespace Game;
public sealed class ReferenceMover : MonoBehaviour {
 public double Speed=1;private Vector3 origin;
 public override void Start(){origin=transform.position;}
 public override void Update(){transform.position=origin+Vector3.up*System.Math.Sin(Time.time*Speed)*.5;}
}
