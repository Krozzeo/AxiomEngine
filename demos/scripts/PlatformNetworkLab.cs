using Axiom.Gameplay;
using Axiom.Gameplay.Networking;
using System.Collections;
namespace Game;
public sealed class PlatformNetworkLab : MonoBehaviour {
 public string URL="";
 [ReadOnly] public string Platform="";[ReadOnly] public int Width=0;[ReadOnly] public int Height=0;[ReadOnly] public string NetworkStatus="Press H after entering an HTTPS endpoint with CORS";[ReadOnly] public string Response="";
 public override void Start(){Platform=Application.platform+" / "+SystemInfo.operatingSystem;Debug.Log("Platform/network: inspector shows actual browser canvas and platform. Set URL to an external CORS-enabled text endpoint, H sends GET. No request is sent automatically. No cookies/daemon credentials are sent; 256 KiB response limit. J tests JSON save roundtrip using PlayerPrefs.");}
 public override void Update(){Width=Screen.width;Height=Screen.height;if(Input.GetKeyDown(KeyCode.H)&&URL.Length>0)StartCoroutine(Fetch());if(Input.GetKeyDown(KeyCode.J)){var data=new DemoSave{visits=PlayerPrefs.GetInt("visits")+1,position=transform.position};var json=JsonUtility.ToJson(data,true);PlayerPrefs.SetString("save",json);PlayerPrefs.SetInt("visits",data.visits);PlayerPrefs.Save();var restored=JsonUtility.FromJson<DemoSave>(PlayerPrefs.GetString("save"));Response="Saved visits "+restored.visits+" · "+restored.position;}}
 private IEnumerator Fetch(){NetworkStatus="Loading";using var request=UnityWebRequest.Get(URL);yield return request.SendWebRequest();NetworkStatus=request.result+" · "+request.responseCode+(request.error==null?"":" · "+request.error);Response=request.downloadHandler.text[..System.Math.Min(request.downloadHandler.text.Length,512)];}
}
public sealed class DemoSave {public int visits=0;public Vector3 position=Vector3.zero;}
