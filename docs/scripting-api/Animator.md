# Animator

Namespace: `Axiom.Gameplay`

## Description

Animator belongs to the audio and animation API family. Consult the declarations below for the exact supported surface.

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
public sealed class Animator : Component {
 internal Animator(Entity entity){Entity=entity;}
 public void Play(string state)=>Entity.PlayAnimation(state,0);public void CrossFade(string state,double duration)=>Entity.PlayAnimation(state,duration);
 public void SetFloat(string name,double value)=>Entity.SetAnimationParameter(name,value);public void SetBool(string name,bool value)=>Entity.SetAnimationParameter(name,value?1:0);public void SetInteger(string name,int value)=>Entity.SetAnimationParameter(name,value);
}
```
