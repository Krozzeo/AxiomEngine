using Axiom.Gameplay;
namespace Game;
public sealed class ReferenceReceiver : MonoBehaviour {
 public Transform? Target;
 public ReferenceMover? Controller;
 public TextAsset? Configuration;
 public GameObject? Focus;
 public SceneAsset? NextScene;
 [ReadOnly] public string ReferenceStatus="Assign references by dragging or with the picker";
 public override void Update(){ReferenceStatus="Target="+(Target?Target.gameObject.name:"None")+" · Controller="+(Controller?Controller.Speed.ToString():"None")+" · Config="+(Configuration?Configuration.name:"None");if(Input.GetKeyDown(KeyCode.T)&&Target)Target.position+=Vector3.up;if(Input.GetKeyDown(KeyCode.V)&&Controller)Controller.Speed=Controller.Speed==1?3:1;}
}
