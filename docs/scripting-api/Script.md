# Script

Namespace: `Axiom.Gameplay`

## Description

Script belongs to the script lifecycle API family. Consult the declarations below for the exact supported surface.

## Use cases

Frame-based behaviour.

## Example

```csharp
using Axiom.Gameplay;
public sealed class Motion : MonoBehaviour {
 public double Speed = 1;
 public override void Update() {
  transform.position += Vector3.right * Speed * Time.deltaTime;
 }
}
```

## Compatibility and limitations

Override public callbacks; Unity-style private message methods are not reflected. Existing OnStart/OnUpdate/OnStop overrides remain supported and take precedence if they do not call base. FixedUpdate uses a local 0.02-second accumulator and is not yet a solver-owned callback. LateUpdate follows Update for each behaviour, not a separate global phase. Time uses doubles. Coroutines, Invoke, timeScale and scene loading remain pending.


SDK 8: `enabled` is shared by C# and the live Inspector checkbox. Disabling suppresses regular Update/FixedUpdate/LateUpdate, invokes OnDisable; enabling invokes OnEnable and resumes updates. Runtime activation is discarded on Stop. This toggles the component, not the GameObject subtree. Rigidbody and Transform have no enabled checkbox.

## Implemented declarations

```csharp
public abstract class Script : Behaviour {
 public virtual void OnStart() {}
 public virtual void OnUpdate(double deltaSeconds) {}
 public virtual void OnStop() {}
}
```
