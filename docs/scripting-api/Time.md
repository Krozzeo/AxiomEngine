# Time

Namespace: `Axiom.Gameplay`

## Description

Time belongs to the script lifecycle API family. Consult the declarations below for the exact supported surface.

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


## Implemented declarations

```csharp
public static class Time {
 public static double deltaTime {get;internal set;}
 public static double time {get;internal set;}
 public static int frameCount {get;internal set;}
 public const double fixedDeltaTime=0.02;
 internal static void Reset(){deltaTime=0;time=0;frameCount=0;}
 internal static void Step(double delta){deltaTime=delta;time+=delta;frameCount++;}
}
```
