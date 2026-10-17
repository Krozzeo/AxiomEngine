using Axiom.Gameplay;
using Object=Axiom.Gameplay.Object;
namespace Game;
public sealed class PhysicsStressLab : MonoBehaviour {
 [Range(1,32)] public int BatchSize=16;
 [ReadOnly] public int DynamicBodies=0;
 [ReadOnly] public int Contacts=0;
 [ReadOnly] public double FPS=0;
 [ReadOnly] public double FrameMs=0;
 [ReadOnly] public bool CapacityReached=false;
 private GameObject? template;private readonly System.Collections.Generic.List<GameObject> instances=new();private int pending;
 public override void Start(){template=GameObject.Find("Stress Template");if(template==null)throw new System.InvalidOperationException("Missing stress template");template.SetActive(false);pending=BatchSize;Debug.Log("Physics stress: N adds a batch, Backspace removes a batch. Maximum 255 dynamic bodies + static floor. Inspector reports actual FPS, contacts and previous-frame body count; Diagnostics provides timing. Stop restores the authored scene.");}
 public override void Update(){FPS=RuntimeStats.framesPerSecond;FrameMs=RuntimeStats.frameMilliseconds;Contacts=RuntimeStats.contacts;DynamicBodies=instances.Count;CapacityReached=instances.Count>=255;
  if(Input.GetKeyDown(KeyCode.N))pending=System.Math.Min(255-instances.Count,pending+BatchSize);
  if(Input.GetKeyDown(KeyCode.Backspace))for(var n=0;n<BatchSize&&instances.Count>0;n++){Object.Destroy(instances[^1]);instances.RemoveAt(instances.Count-1);}
  // One spawn per frame keeps authoring/topology work separate from steady-state solver cost.
  if(pending>0&&instances.Count<255){var index=instances.Count;var two=template!.GetComponent<Rigidbody2D>()!=null;var pos=two?new Vector3((index%12-5.5)*.65,2+index/12*.7,0):new Vector3((index%6-2.5)*.7,2+index/36*.7,((index/6)%6-2.5)*.7);var clone=Object.Instantiate(template,pos,Quaternion.Euler(0,0,index%2==0?7:-7));clone.SetActive(true);instances.Add(clone);pending--;}
 }
}
