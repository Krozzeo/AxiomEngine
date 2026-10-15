# Vector4

Namespace: `Axiom.Gameplay`

## Description

Vector4 belongs to the mathematics API family. Consult the declarations below for the exact supported surface.

## Use cases

Vectors and quaternions.

## Example

```csharp
using Axiom.Gameplay;
var direction = (destination - transform.position).normalized;
transform.rotation = Quaternion.Euler(0, 90, 0);
var distance = Vector3.Distance(destination, transform.position);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public record struct Vector4(double X, double Y, double Z, double W) {
 public double x {get=>X;set=>X=value;}
 public double y {get=>Y;set=>Y=value;}
 public double z {get=>Z;set=>Z=value;}
 public double w {get=>W;set=>W=value;}
 public static Vector4 zero=>Zero;public static Vector4 one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>X*X+Y*Y+Z*Z+W*W;
 public Vector4 normalized=>Normalized;public void Normalize(){this=Normalized;}public static Vector4 Normalize(Vector4 v)=>v.Normalized;public static double Distance(Vector4 a,Vector4 b)=>(a-b).Magnitude;public static Vector4 operator -(Vector4 v)=>v*(-1);public static Vector4 operator /(Vector4 v,double n)=>v*(1/n);public static Vector4 operator *(double n,Vector4 v)=>v*n;

 public static Vector4 Zero => new(0,0,0,0);
 public static Vector4 One => new(1,1,1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y+Z*Z+W*W);
 public static Vector4 operator +(Vector4 a,Vector4 b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z,a.W+b.W);
 public static Vector4 operator -(Vector4 a,Vector4 b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z,a.W-b.W);
 public static Vector4 operator *(Vector4 a,double b) => new(a.X*b,a.Y*b,a.Z*b,a.W*b);
 internal static Vector4 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());
 public Vector4 Normalized => Magnitude>1e-12?this*(1/Magnitude):Zero;
 public static double Dot(Vector4 a,Vector4 b) => a.X*b.X+a.Y*b.Y+a.Z*b.Z+a.W*b.W;
 public static Vector4 Lerp(Vector4 a,Vector4 b,double t) => a+(b-a)*Math.Clamp(t,0,1);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteNumberValue(W);w.WriteEndArray();}
}
```
