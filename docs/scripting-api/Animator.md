# Animator

Namespace: `Axiom.Gameplay`

## Description

Adapter for authored Animator states and numeric parameters. State and parameter names must already exist. CrossFade uses the requested duration in seconds.

## Use cases

Transition an Animator with an authored Walk state and Speed parameter.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var animator = GetComponent<Animator>();
if (animator != null) {
 animator.SetFloat("Speed", 1);
 animator.CrossFade("Walk", 0.2);
}
```

## Compatibility and limitations

Camera.main selects the active camera entity. It does not provide ScreenPointToRay or camera creation. AudioSource and Animator wrap existing imported resources and authored animation states/parameters; this batch does not add audio decoding, new media formats, root motion or Mecanim compatibility. Audio and animator actions are applied by the runtime bridge.


## Implemented declarations

```csharp
public sealed partial class Animator : Component {
 internal Animator(Entity entity){Entity=entity;}
 public void Play(string state)=>Entity.PlayAnimation(state,0);public void CrossFade(string state,double duration)=>Entity.PlayAnimation(state,duration);
 public void SetFloat(string name,double value)=>Entity.SetAnimationParameter(name,value);public void SetBool(string name,bool value)=>Entity.SetAnimationParameter(name,value?1:0);public void SetInteger(string name,int value)=>Entity.SetAnimationParameter(name,value);
}

public sealed partial class Animator {
 public double GetFloat(string name){var p=PresentationData.Read(Entity,"animator").GetProperty("parameters").EnumerateArray().FirstOrDefault(p=>p.GetProperty("name").GetString()==name);if(p.ValueKind==System.Text.Json.JsonValueKind.Undefined)throw new ArgumentException("Unknown Animator parameter");return p.GetProperty("value").GetDouble();}
 public bool GetBool(string name)=>GetFloat(name)!=0;public int GetInteger(string name)=>(int)GetFloat(name);
}
```
