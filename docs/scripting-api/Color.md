# Color

Namespace: `Axiom.Gameplay`

## Description

Linear RGBA data with double components and optional alpha. This batch preserves PascalCase R/G/B/A and White/Black; it is not the complete Unity Color surface.

## Use cases

Store a tint in an exposed script field.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var tint = new Color(0.2, 0.5, 1, 1);
Debug.Log(tint.B);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public readonly record struct Color(double R,double G,double B,double A=1) {public static Color White=>new(1,1,1,1);public static Color Black=>new(0,0,0,1);}
```
