using Axiom.Gameplay;
using System.Collections;
namespace Game;
public sealed class RuntimeApiLab : MonoBehaviour {
 [Range(0,2)] public double Speed=1;
 [ReadOnly] public int FixedTicks=0;
 [ReadOnly] public int Pulses=0;
 [ReadOnly] public double ScaledTime=0;
 [ReadOnly] public double RealTime=0;
 private Vector3 origin;
 private GameObject? clone;
 public override void Start(){origin=transform.position;gameObject.tag="RuntimeProbe";clone=Instantiate(gameObject);Destroy(clone.GetComponent<RuntimeApiLab>()!);clone.name="Runtime clone (script removed)";clone.transform.position=origin+new Vector3(2,0,0);clone.transform.SetParent(transform,true);StartCoroutine(Pulse());InvokeRepeating(nameof(Report),1,2);}
 private IEnumerator Pulse(){while(true){yield return new WaitForSeconds(.5);Pulses++;}}
 private void Report(){Debug.Log("Runtime API: fixed="+FixedTicks+", pulses="+Pulses+", children="+transform.childCount);}
 public override void FixedUpdate(){FixedTicks++;}
 public override void Update(){if(Input.GetKeyDown(KeyCode.Space))Time.timeScale=Time.timeScale==0?1:0;ScaledTime=Time.time;RealTime=Time.unscaledTime;transform.position=origin+new Vector3(0,System.Math.Sin(Time.time*Speed)*.5,0);}
 public override void OnDestroy(){CancelInvoke();}
}
