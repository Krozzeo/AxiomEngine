# SerializeFieldAttribute

Namespace: `Axiom.Gameplay`

## Description

SerializeFieldAttribute belongs to the inspector and diagnostics API family. Consult the declarations below for the exact supported surface.

## Use cases

Expose a constrained script field.

## Example

```csharp
using Axiom.Gameplay;
[Title("Movement")]
[Tooltip("Metres per second")]
[Range(0, 10)] public double Speed = 2;
[Space] [ReadOnly] public Vector3 LastPosition;
```

## Compatibility and limitations

Only supported script field types are serialized. Attributes affect field presentation, not arbitrary C# properties. Debug forwards bounded runtime logs. Reflection-heavy custom editors and arbitrary Unity attributes remain pending.


## Implemented declarations

```csharp
public sealed class SerializeFieldAttribute : Attribute {}
```
