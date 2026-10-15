using Axiom.Gameplay;
namespace Game;
public sealed class ApiCompatibilityProbe : MonoBehaviour {
 [Title("API compatibility probe")] [ReadOnly] public bool TriggerVerified;
 [Range(0, 5)] public double Speed = 1;
 [ReadOnly] public int Frames;
 public override void Start() {
  if (GetComponent<Transform>() == null || GetComponent<Rigidbody>() == null) throw new System.Exception("Component lookup failed");
  transform.position = new Vector3(2, 1, 0);
  transform.localScale = Vector3.one * 2;
  if (Mathf.Abs(GetComponent<Collider>()!.bounds.Size.X - 1) > 0.0001) throw new System.Exception("Collider bounds differ from world-unit physics extents");
  transform.localScale = Vector3.one;
  if (new Vector2Int(50000, 0).magnitude != 50000) throw new System.Exception("Integer vector magnitude overflow");
  transform.rotation = Quaternion.Euler(0, 0, 0);
  var pickup = GameObject.Find("Pickup");
  if (pickup == null) throw new System.Exception("Named pickup missing");
  pickup.SetActive(false);
  if (pickup.activeInHierarchy) throw new System.Exception("Activation failed");
  pickup.SetActive(true);
  var clone = Instantiate(pickup, new Vector3(8, 1, 0), Quaternion.identity);
  Destroy(clone);
  if (!Physics.Raycast(new Vector3(2, 5, 0), Vector3.down, out var hit, 10)) throw new System.Exception("Physics query failed");
  if (Camera.main == null) throw new System.Exception("Active camera lookup failed");
  Debug.Log("API probe: component lookup, transform, activation, clone/destroy and raycast verified");
 }
 public override void Update() {
  Frames++;
  var p = transform.position;
  transform.position = new Vector3(p.x, 1 + 0.1 * Mathf.Sin(Time.time * Speed), p.z);
  if (Input.GetKeyDown(KeyCode.Space)) Debug.Log("Space edge received");
 }
 public override void OnTriggerEnter(Collider other) {
  if (other.gameObject.name == "Pickup") {
   TriggerVerified = true;
   Destroy(other.gameObject);
   Debug.Log("API probe: runtime trigger and Destroy verified");
  }
 }
}
