using Axiom.Gameplay;
using Axiom.Gameplay.SceneManagement;
using System.Collections;
using Object = Axiom.Gameplay.Object;
namespace Game;

// Editable M19 observation corpus. Passing a check does not certify a Unity overload.
public sealed class CompatibilityProbe : MonoBehaviour {
 [ReadOnly] public int Passed;
 [ReadOnly] public int Failed;
 [ReadOnly] public int Frames;
 [ReadOnly] public int AwakeCalls;
 [ReadOnly] public int StartCalls;
 [ReadOnly] public int EnabledCalls;
 [ReadOnly] public string Report = "";
 private double previousTime;
 private bool fixedChecked;
 private GameObject? child;
 private void Check(string id, bool result) {
  if(result)Passed++;else Failed++;
  Report += id+":"+(result?"pass":"fail")+";";
  Debug.Log("M19_CASE "+id+" "+(result?"pass":"fail"));
 }
 public override void Awake() {
  AwakeCalls++;
  Check("object.component",GetComponent<Transform>()!=null);
  Check("object.missing",GetComponent<AudioSource>()==null);
  child=new GameObject("M19 runtime child");
  child.transform.SetParent(transform,false);
  Check("object.parent",child.transform.parent==transform);
  Check("object.parent-id",child.transform.parent?.GetInstanceID()==transform.GetInstanceID());
  Check("object.find",transform.Find("M19 runtime child")!=null);
  try{transform.SetParent(child.transform);Check("object.cycle",false);}catch(System.ArgumentException){Check("object.cycle",true);}
  child.SetActive(false);Check("object.inactive",!child.activeInHierarchy);child.SetActive(true);
  Check("math.vector",Vector3.Dot(Vector3.right,Vector3.up)==0);
  Check("math.zero",Vector3.zero.normalized==Vector3.zero);
  Check("physics.hit",Physics.Raycast(new Vector3(0,5,0),new Vector3(0,-1,0),out var hit,10)&&hit.collider!=null);
  Check("physics.miss",!Physics.Raycast(new Vector3(100,5,0),new Vector3(0,-1,0),10));
  Check("physics.overlap",Physics.OverlapSphere(transform.position,2).Length>=1);
  var data=Resources.Load<TextAsset>("Observatory");
  Check("resource.text",data!=null&&data.text.Contains("M19 physical resource"));
  Check("resource.missing",Resources.Load<TextAsset>("NoSuchM19Resource")==null);
  Check("resource.type",Resources.Load<Texture2D>("Observatory")==null);
  Check("scene.valid",SceneManager.GetActiveScene().IsValid());
  Check("scene.loaded",SceneManager.GetActiveScene().isLoaded);
  previousTime=Time.time;StartCoroutine(WaitProbe());
 }
 public override void OnEnable(){EnabledCalls++;}
 public override void Start(){StartCalls++;Check("lifecycle.awake-start",AwakeCalls==1);}
 private IEnumerator WaitProbe(){yield return new WaitForSeconds(.04);Check("time.wait",Time.time>=previousTime+.03);}
 public override void FixedUpdate(){if(!fixedChecked){fixedChecked=true;Check("time.fixed",Time.inFixedTimeStep);}}
 public override void Update(){Frames++;if(Frames==1){Check("lifecycle.start-update",StartCalls==1);Check("time.delta",Time.deltaTime>=0);}if(Frames==10){Check("time.advance",Time.time>previousTime);Check("lifecycle.enabled",EnabledCalls==1);if(child!=null){Object.Destroy(child);Check("object.destroy-deferred",child);}Check("lifecycle.once",AwakeCalls==1&&StartCalls==1);}if(Frames==11)Check("object.destroy-after",!child);}
 public override void OnDisable(){Debug.Log("M19_LIFECYCLE disabled");}
}
