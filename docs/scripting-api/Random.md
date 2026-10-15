# Random

Namespace: `Axiom.Gameplay`

## Description

Deterministic random facade backed by the replay generator. value and floating Range produce bounded samples; integer Range excludes the maximum. InitState resets the shared sequence.

## Use cases

Generate reproducible spawn variation.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
Axiom.Gameplay.Random.InitState(42);
var offset = Axiom.Gameplay.Random.Range(-2.0, 2.0);
Debug.Log(offset);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public static class Random {
 public static double value=>ReplayRandom.NextDouble();public static void InitState(int seed)=>ReplayRandom.Reset(unchecked((uint)seed));public static double Range(double min,double max)=>min+(max-min)*value;public static int Range(int min,int max)=>max<=min?min:min+(int)(value*(max-min));
}
```
