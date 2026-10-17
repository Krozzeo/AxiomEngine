using Axiom.Gameplay;
namespace Game;
public sealed class PresentationLab : MonoBehaviour {
 public double PulseSpeed=1;public bool AnimateColor=true;[ReadOnly] public double ActualIntensity=0;
 public override void Update(){var light=GetComponent<Light>();if(light!=null){light.intensity=.6+(System.Math.Sin(Time.time*PulseSpeed)+1)*.6;ActualIntensity=light.intensity;}var renderer=GetComponent<MeshRenderer>();if(renderer!=null&&AnimateColor)renderer.material.color=new Color(.2+(System.Math.Sin(Time.time*PulseSpeed)+1)*.3,.25,.85);if(renderer!=null&&Input.GetKeyDown(KeyCode.O)&&Camera.main!=null)Camera.main.orthographic=!Camera.main.orthographic;}
}
