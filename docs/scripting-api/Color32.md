# Color32

Namespace: `Axiom.Gameplay`

## Description

Compact RGBA data with byte channels from 0 to 255. Alpha defaults to 255.

## Use cases

Store byte-based sprite or UI color data.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var tint = new Color32(64, 128, 255);
Debug.Log(tint.A);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public readonly record struct Color32(byte R,byte G,byte B,byte A=255);
```
