using Axiom.Gameplay;
using Axiom.Gameplay.SceneManagement;
using Object=Axiom.Gameplay.Object;
namespace Game;
public sealed class SceneResourcesLab : MonoBehaviour {
 [ReadOnly] public int LoadedScenes=1;[ReadOnly, PlayerPref("visits")] public int SavedVisits=0;[ReadOnly] public string ActiveScene="";
 public override void Start(){Object.DontDestroyOnLoad(gameObject);SavedVisits=PlayerPrefs.GetInt("visits");Debug.Log("Scene Resources Lab: A = load Arena additively; U = unload Arena; N = replace scenes with Arena; I = instantiate a physical prefab resource; P = increment/save visits. Settings JSON: "+Resources.Load<TextAsset>("Assets/Settings.json")!.text);}
 public override void Update(){LoadedScenes=SceneManager.sceneCount;ActiveScene=SceneManager.GetActiveScene().name;if(Input.GetKeyDown(KeyCode.A)&&!SceneManager.GetSceneByName("Arena").isLoaded)SceneManager.LoadScene("Arena",LoadSceneMode.Additive);if(Input.GetKeyDown(KeyCode.U)&&SceneManager.GetSceneByName("Arena").isLoaded&&SceneManager.sceneCount>1)SceneManager.UnloadSceneAsync("Arena");if(Input.GetKeyDown(KeyCode.N))SceneManager.LoadScene("Arena");if(Input.GetKeyDown(KeyCode.I))Object.Instantiate(Resources.Load<PrefabAsset>("Assets/Crate.prefab.json")!,new Vector3(-2,1,0),Quaternion.identity);if(Input.GetKeyDown(KeyCode.P)){SavedVisits++;PlayerPrefs.SetInt("visits",SavedVisits);PlayerPrefs.Save();Debug.Log("Visits saved: "+SavedVisits);}}
}
