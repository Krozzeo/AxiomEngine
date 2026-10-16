# Bounds

Namespace: `Axiom.Gameplay`

## Description

Bounds data represented by Center and Size vectors. This batch provides the value shape; geometric bounds operations remain pending.

## Use cases

Store the center and dimensions of a gameplay region.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var region = new Bounds(Vector3.zero, new Vector3(4, 2, 4));
Debug.Log(region.Size);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public readonly record struct Bounds(Vector3 Center,Vector3 Size);
```
