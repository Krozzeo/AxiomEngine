# Vector3

Namespace: `Axiom.Gameplay`

## Description

3-component floating vector using doubles. Supports arithmetic, normalization, magnitude, dot product and interpolation. Lowercase aliases coexist with legacy PascalCase fields.

## Use cases

Represent positions, directions, velocities or packed numeric parameters.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var value = new Vector3(1, 2, 3);
Debug.Log(value.magnitude);
Debug.Log(value.normalized);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public record struct Vector3(double X, double Y, double Z) {
 public double x {get=>X;set=>X=value;}
 public double y {get=>Y;set=>Y=value;}
 public double z {get=>Z;set=>Z=value;}
 public static Vector3 zero=>Zero;public static Vector3 one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>X*X+Y*Y+Z*Z;
 public Vector3 normalized=>Normalized;public void Normalize(){this=Normalized;}public static Vector3 Normalize(Vector3 v)=>v.Normalized;public static double Distance(Vector3 a,Vector3 b)=>(a-b).Magnitude;public static Vector3 operator -(Vector3 v)=>v*(-1);public static Vector3 operator /(Vector3 v,double n)=>v*(1/n);public static Vector3 operator *(double n,Vector3 v)=>v*n;

 public static Vector3 Zero => new(0,0,0);
 public static Vector3 One => new(1,1,1);
 public double Magnitude => Math.Sqrt(X*X+Y*Y+Z*Z);
 public static Vector3 operator +(Vector3 a,Vector3 b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
 public static Vector3 operator -(Vector3 a,Vector3 b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z);
 public static Vector3 operator *(Vector3 a,double b) => new(a.X*b,a.Y*b,a.Z*b);
 internal static Vector3 Read(JsonElement e) => new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble());
 public Vector3 Normalized => Magnitude>1e-12?this*(1/Magnitude):Zero;
 public static double Dot(Vector3 a,Vector3 b) => a.X*b.X+a.Y*b.Y+a.Z*b.Z;
 public static Vector3 Lerp(Vector3 a,Vector3 b,double t) => a+(b-a)*Math.Clamp(t,0,1);
 public static Vector3 up=>new(0,1,0);public static Vector3 down=>new(0,-1,0);public static Vector3 right=>new(1,0,0);public static Vector3 left=>new(-1,0,0);public static Vector3 forward=>new(0,0,1);public static Vector3 back=>new(0,0,-1);
 public static Vector3 Up => new(0,1,0);public static Vector3 Right => new(1,0,0);public static Vector3 Forward => new(0,0,-1);
 public static Vector3 Cross(Vector3 a,Vector3 b) => new(a.Y*b.Z-a.Z*b.Y,a.Z*b.X-a.X*b.Z,a.X*b.Y-a.Y*b.X);
 public static Vector3 operator +(Vector3 a,Vec3 b)=>a+(Vector3)b;
 public static Vector3 operator +(Vec3 a,Vector3 b)=>(Vector3)a+b;
 public static Vector3 operator -(Vector3 a,Vec3 b)=>a-(Vector3)b;
 public static Vector3 operator -(Vec3 a,Vector3 b)=>(Vector3)a-b;
 public static implicit operator Vector3(Vec3 v) => new(v.X,v.Y,v.Z);public static implicit operator Vec3(Vector3 v) => new(v.X,v.Y,v.Z);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
```
