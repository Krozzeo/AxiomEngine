# Time

Namespace: `Axiom.Gameplay`

## Description

Scaled/unscaled delta and elapsed time, frame count, fixed time, inFixedTimeStep and validated timeScale. The fixed solver period is read-only 1/60 second; maximum variable delta is .25 seconds and native catch-up is capped at eight fixed steps. Time resets at Play. realtimeSinceStartup currently means unscaled time since this Play, not process uptime.

## Example

```csharp
public override void Update() {
    if (Input.GetKeyDown(KeyCode.Space)) Time.timeScale = Time.timeScale == 0 ? 1 : 0;
    transform.position += Vector3.right * Time.deltaTime;
}
```

At timeScale zero Update still runs and unscaled time advances, allowing scripts to unpause. FixedUpdate and scaled timers do not advance.

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
