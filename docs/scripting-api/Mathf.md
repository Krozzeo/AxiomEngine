# Mathf

Namespace: `Axiom.Gameplay`

## Description

Common scalar mathematics, interpolation, clamps, trigonometry and periodic functions. Angles for trigonometric functions are radians; Deg2Rad/Rad2Deg convert units. Numeric results use double.

## Use cases

Clamp health values, ease a parameter or generate periodic animation.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var health = Mathf.Clamp(120, 0, 100);
var pulse = 0.5 + 0.5 * Mathf.Sin(Time.time);
Debug.Log(Mathf.Lerp(0, health, pulse));
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public static partial class Mathf {public const double PI=Math.PI;public const double Deg2Rad=Math.PI/180;public const double Rad2Deg=180/Math.PI;public static double Clamp(double value,double min,double max)=>Math.Clamp(value,min,max);public static double Lerp(double a,double b,double t)=>a+(b-a)*Math.Clamp(t,0,1);}

public static partial class Mathf {
 public static double Abs(double v)=>Math.Abs(v);public static double Min(double a,double b)=>Math.Min(a,b);public static double Max(double a,double b)=>Math.Max(a,b);public static double Sign(double v)=>Math.Sign(v);
 public static double Sin(double v)=>Math.Sin(v);public static double Cos(double v)=>Math.Cos(v);public static double Tan(double v)=>Math.Tan(v);public static double Asin(double v)=>Math.Asin(v);public static double Acos(double v)=>Math.Acos(v);public static double Atan2(double y,double x)=>Math.Atan2(y,x);
 public static double Sqrt(double v)=>Math.Sqrt(v);public static double Pow(double v,double p)=>Math.Pow(v,p);public static double Exp(double v)=>Math.Exp(v);public static double Log(double v)=>Math.Log(v);
 public static double Floor(double v)=>Math.Floor(v);public static double Ceil(double v)=>Math.Ceiling(v);public static double Round(double v)=>Math.Round(v,MidpointRounding.ToEven);public static int FloorToInt(double v)=>(int)Math.Floor(v);public static int CeilToInt(double v)=>(int)Math.Ceiling(v);public static int RoundToInt(double v)=>(int)Math.Round(v,MidpointRounding.ToEven);
 public static double Clamp01(double v)=>Clamp(v,0,1);public static double LerpUnclamped(double a,double b,double t)=>a+(b-a)*t;public static double InverseLerp(double a,double b,double v)=>a==b?0:Clamp01((v-a)/(b-a));
 public static double MoveTowards(double current,double target,double maxDelta)=>Math.Abs(target-current)<=maxDelta?target:current+Math.Sign(target-current)*maxDelta;
 public static double Repeat(double t,double length)=>Clamp(t-Math.Floor(t/length)*length,0,length);public static double PingPong(double t,double length){t=Repeat(t,length*2);return length-Math.Abs(t-length);}
 public static bool Approximately(double a,double b)=>Math.Abs(a-b)<Math.Max(1e-6*Math.Max(Math.Abs(a),Math.Abs(b)),double.Epsilon*8);
}
```
