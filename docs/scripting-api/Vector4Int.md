# Vector4Int

Namespace: `Axiom.Gameplay`

## Description

4-component integer vector for discrete coordinates. Supports addition, subtraction, integer scale and conversion to its floating-vector counterpart. Vector4Int is an Axiom extension.

## Use cases

Represent tile cells, chunk addresses or discrete grid data.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var cell = new Vector4Int(1, 2, 3, 4);
var next = cell + Vector4Int.one;
Debug.Log(next.x);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public record struct Vector4Int(int X, int Y, int Z, int W) {
 public int x {get=>X;set=>X=value;}
 public int y {get=>Y;set=>Y=value;}
 public int z {get=>Z;set=>Z=value;}
 public int w {get=>W;set=>W=value;}
 public static Vector4Int zero=>Zero;public static Vector4Int one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>(double)X*X+(double)Y*Y+(double)Z*Z+(double)W*W;

 public static Vector4Int Zero => new(0,0,0,0);
 public static Vector4Int One => new(1,1,1,1);
 public double Magnitude => Math.Sqrt((double)X*X+(double)Y*Y+(double)Z*Z+(double)W*W);
 public static Vector4Int operator +(Vector4Int a,Vector4Int b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z,a.W+b.W);
 public static Vector4Int operator -(Vector4Int a,Vector4Int b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z,a.W-b.W);
 public static Vector4Int operator *(Vector4Int a,int b) => new(a.X*b,a.Y*b,a.Z*b,a.W*b);
 internal static Vector4Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32(),e[2].GetInt32(),e[3].GetInt32());
 public static implicit operator Vector4(Vector4Int v) => new(v.X,v.Y,v.Z,v.W);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteNumberValue(W);w.WriteEndArray();}
}
```
