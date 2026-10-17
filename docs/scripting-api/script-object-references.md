# Script object and asset references

Public or [SerializeField] single references to GameObject, Transform, supported engine components, compiled MonoBehaviour classes, TextAsset, SceneAsset, PrefabAsset, Texture2D, AudioClip and Mesh appear as typed Inspector slots. Drag a component heading from any Inspector, an entity from Hierarchy, or a compatible file from Project. The picker provides an alternative. Null clears the reference. Object IDs and project paths persist in the project; cross-project and incompatible references reject. References resolve after all script instances exist and before Awake/Start; internal references are remapped when cloning/importing hierarchies. Arrays, arbitrary managed object graphs, ScriptableObject and Addressables references are not implemented. Texture2D/AudioClip/Mesh are read-only project-asset handles (name/assetId), not full runtime asset construction APIs.

The Inspector lock pins its target independently of app selection. Additional Inspectors can dock or detach, with up to eight simultaneous Inspector panels. Target locks reset on project/workspace changes and are session state; layout positions persist.

[ReadOnly, PlayerPref("visits")] public int SavedVisits=0; explicitly binds the stopped Inspector display to the project/browser preference. Runtime code must still call PlayerPrefs.GetInt/SetInt/Save. Transient fields and transforms are restored on Stop.


## Implemented declarations

```csharp
public abstract class ProjectAsset : Object {internal string Path {get;}public string name=>Path.Split('/').Last();public string assetId {get;}internal ProjectAsset(string path,string id){Path=path;assetId=id;}}

public sealed class Texture2D(string path,string id) : ProjectAsset(path,id) {}

public sealed class AudioClip(string path,string id) : ProjectAsset(path,id) {}

public sealed class Mesh(string path,string id) : ProjectAsset(path,id) {}

public sealed class PlayerPrefAttribute(string key) : Attribute {public string Key {get;}=key;}
```
