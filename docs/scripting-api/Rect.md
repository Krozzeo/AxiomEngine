# Rect

Namespace: `Axiom.Gameplay`

## Description

Rectangle data with X, Y, Width and Height. This batch provides the value shape; full Unity Rect hit-testing/conversion helpers remain pending.

## Use cases

Expose a viewport or layout rectangle as script data.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var viewport = new Rect(0, 0, 320, 180);
Debug.Log(viewport.Width);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public readonly record struct Rect(double X,double Y,double Width,double Height);
```
