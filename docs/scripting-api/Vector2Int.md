# Vector2Int

Namespace: `Axiom.Gameplay`

## Description

2-component integer vector for discrete coordinates. Supports addition, subtraction, integer scale and conversion to its floating-vector counterpart. Vector4Int is an Axiom extension.

## Use cases

Represent tile cells, chunk addresses or discrete grid data.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var cell = new Vector2Int(1, 2);
var next = cell + Vector2Int.one;
Debug.Log(next.x);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public record struct Vector2Int(int X, int Y) {
 public int x {get=>X;set=>X=value;}
 public int y {get=>Y;set=>Y=value;}
 public static Vector2Int zero=>Zero;public static Vector2Int one=>One;public double magnitude=>Magnitude;public double sqrMagnitude=>(double)X*X+(double)Y*Y;

 public static Vector2Int Zero => new(0,0);
 public static Vector2Int One => new(1,1);
 public double Magnitude => Math.Sqrt((double)X*X+(double)Y*Y);
 public static Vector2Int operator +(Vector2Int a,Vector2Int b) => new(a.X+b.X,a.Y+b.Y);
 public static Vector2Int operator -(Vector2Int a,Vector2Int b) => new(a.X-b.X,a.Y-b.Y);
 public static Vector2Int operator *(Vector2Int a,int b) => new(a.X*b,a.Y*b);
 internal static Vector2Int Read(JsonElement e) => new(e[0].GetInt32(),e[1].GetInt32());
 public static implicit operator Vector2(Vector2Int v) => new(v.X,v.Y);
 internal void Write(Utf8JsonWriter w) {w.WriteStartArray();w.WriteNumberValue(X);w.WriteNumberValue(Y);w.WriteEndArray();}
}
```
