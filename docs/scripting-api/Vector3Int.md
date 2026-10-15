# Vector3Int

Namespace: `Axiom.Gameplay`

## Description

3-component integer vector for discrete coordinates. Supports addition, subtraction, integer scale and conversion to its floating-vector counterpart. Vector4Int is an Axiom extension.

## Use cases

Represent tile cells, chunk addresses or discrete grid data.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var cell = new Vector3Int(1, 2, 3);
var next = cell + Vector3Int.one;
Debug.Log(next.x);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public record struct Vector3Int(int X, int Y, int Z) {
 public int x {get=>X;set=>X=value;}
 public int y {get=>Y;set=>Y=value;}
 public int z {get=>Z;set=>Z=value;}
 public static Vector3Int zero=>Zero;public static Vector3Int one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>(double)X*X+(double)Y*Y+(double)Z*Z;

 public static Vector3Int Zero => new(0,0,0);
 public static Vector3Int One => new(1,1,1);
 public double Magnitude => Math.Sqrt((double)X*X+(double)Y*Y+(double)Z*Z);
 public static Vector3Int operator +(Vector3Int a,Vector3Int b) => new(a.X+b.X,a.Y+b.Y,a.Z+b.Z);
 public static Vector3Int operator -(Vector3Int a,Vector3Int b) => new(a.X-b.X,a.Y-b.Y,a.Z-b.Z);
 public static Vector3Int operator *(Vector3Int a,int b) => new(a.X*b,a.Y*b,a.Z*b);
 internal static Vector3Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32(),e[2].GetInt32());
 public static implicit operator Vector3(Vector3Int v) => new(v.X,v.Y,v.Z);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteNumberValue(Z);w.WriteEndArray();}
}
```
