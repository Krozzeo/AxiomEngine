# Color

Namespace: `Axiom.Gameplay`

## Description

Color belongs to the mathematics API family. Consult the declarations below for the exact supported surface.

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
public readonly record struct Color(double R,double G,double B,double A=1) {public static Color White=>new(1,1,1,1);public static Color Black=>new(0,0,0,1);}
```
