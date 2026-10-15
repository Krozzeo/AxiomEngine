# Camera

Namespace: `Axiom.Gameplay`

## Description

Live wrapper for a camera entity. main chooses the active camera, using the engine active-camera property rather than Unity tags. Axiom cameras look along local -Z.

## Use cases

Derive camera-relative controls from the active camera pose.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var camera = Camera.main;
if (camera != null) {
 var opticalForward = -camera.transform.forward;
 Debug.Log(opticalForward);
}
```

## Compatibility and limitations

Camera.main selects the active camera entity. It does not provide ScreenPointToRay or camera creation. AudioSource and Animator wrap existing imported resources and authored animation states/parameters; this batch does not add audio decoding, new media formats, root motion or Mecanim compatibility. Audio and animator actions are applied by the runtime bridge.


## Implemented declarations

```csharp
public sealed class Camera : Component {
 internal Camera(Entity entity){Entity=entity;}
 public static Camera? main=>Context.Cameras.Where(id=>Context.IsActive(id)&&Context.EntityData.TryGetValue(id,out var data)&&data.GetProperty("camera").GetProperty("active").GetBoolean()).Select(id=>new Camera(new Entity(id,Context.Generation))).FirstOrDefault();
}
```
