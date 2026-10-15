# Vector2

Namespace: `Axiom.Gameplay`

## Description

2-component floating vector using doubles. Supports arithmetic, normalization, magnitude, dot product and interpolation. Lowercase aliases coexist with legacy PascalCase fields.

## Use cases

Represent positions, directions, velocities or packed numeric parameters.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var value = new Vector2(1, 2);
Debug.Log(value.magnitude);
Debug.Log(value.normalized);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public record struct Vector2(double X, double Y) {
 public double x {get=>X;set=>X=value;}
 public double y {get=>Y;set=>Y=value;}
 public static Vector2 zero=>Zero;public static Vector2 one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>X*X+Y*Y;
 public Vector2 normalized=>Normalized;public void Normalize(){this=Normalized;}public static Vector2 Normalize(Vector2 v)=>v.Normalized;public static double Distance(Vector2 a,Vector2 b)=>(a-b).Magnitude;public static Vector2 operator -(Vector2 v)=>v*(-1);public static Vector2 operator /(Vector2 v,double n)=>v*(1/n);public static Vector2 operator *(double n,Vector2 v)=>v*n;

 public static Vector2 up=>new(0,1);public static Vector2 down=>new(0,-1);public static Vector2 right=>new(1,0);public static Vector2 left=>new(-1,0);
 public static Vector2 Zero => new(0,0);
 public static Vector2 One => new(1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y);
 public static Vector2 operator +(Vector2 a,Vector2 b) => new(a.X+b.X,a.Y+b.Y);
 public static Vector2 operator -(Vector2 a,Vector2 b) => new(a.X-b.X,a.Y-b.Y);
 public static Vector2 operator *(Vector2 a,double b) => new(a.X*b,a.Y*b);
 internal static Vector2 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble());
 public Vector2 Normalized => Magnitude>1e-12?this*(1/Magnitude):Zero;
 public static double Dot(Vector2 a,Vector2 b) => a.X*b.X+a.Y*b.Y;
 public static Vector2 Lerp(Vector2 a,Vector2 b,double t) => a+(b-a)*Math.Clamp(t,0,1);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteEndArray();}
}
```
