# Time

Namespace: `Axiom.Gameplay`

## Description

Simulation clock visible to script callbacks. deltaTime is the current frame interval, time is elapsed simulated time, and frameCount increments once per script step.

## Use cases

Make motion independent of rendering frame rate.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
transform.position += Vector3.right * Time.deltaTime;
Debug.Log(Time.frameCount);
```

## Compatibility and limitations

Override public callbacks; Unity-style private message methods are not reflected. Existing OnStart/OnUpdate/OnStop overrides remain supported and take precedence if they do not call base. FixedUpdate uses a local 0.02-second accumulator and is not yet a solver-owned callback. LateUpdate follows Update for each behaviour, not a separate global phase. Time uses doubles. Coroutines, Invoke, timeScale and scene loading remain pending.


## Implemented declarations

```csharp
public static class Time {
 private static double scale=1,delta;
 public static double deltaTime {get=>inFixedTimeStep?fixedDeltaTime:delta;internal set=>delta=value;}
 public static double unscaledDeltaTime {get;internal set;}
 public static double time {get;internal set;}
 public static double unscaledTime {get;internal set;}
 public static double realtimeSinceStartup=>unscaledTime;
 public static double timeSinceLevelLoad=>time;
 public static double timeAsDouble=>time;
 public static double unscaledTimeAsDouble=>unscaledTime;
 public static double fixedTime {get;internal set;}
 public static double fixedUnscaledDeltaTime=>scale>0?fixedDeltaTime/scale:0;
 public static bool inFixedTimeStep {get;internal set;}
 public static double timeScale {get=>scale;set{if(!double.IsFinite(value)||value<0||value>8)throw new ArgumentException("Time scale must be between 0 and 8");scale=value;}}
 public static int frameCount {get;internal set;}
 public const double fixedDeltaTime=1.0/60.0;
 public const double maximumDeltaTime=0.25;
 internal static void Reset(){scale=1;delta=0;time=0;unscaledTime=0;unscaledDeltaTime=0;fixedTime=0;frameCount=0;inFixedTimeStep=false;}
 internal static void Step(double value){unscaledDeltaTime=value;unscaledTime+=value;delta=Math.Min(value*scale,maximumDeltaTime);time+=delta;frameCount++;}
}
```
