# Camera

Namespace: `Axiom.Gameplay`

## Description

Camera belongs to the audio and animation API family. Consult the declarations below for the exact supported surface.

## Use cases

Play an existing source.

## Example

```csharp
using Axiom.Gameplay;
var source = GetComponent<AudioSource>();
if (source != null) source.Play();
var animator = GetComponent<Animator>();
if (animator != null) animator.CrossFade("Walk", 0.2);
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
