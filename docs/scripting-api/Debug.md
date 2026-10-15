# Debug

Namespace: `Axiom.Gameplay`

## Description

Bounded runtime diagnostics. Log, LogWarning and LogError forward text to the engine structured console with script/frame context.

## Use cases

Report verified gameplay events during Play.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
Debug.Log("Pickup consumed");
Debug.LogWarning("Optional target was not found");
```

## Compatibility and limitations

Only supported script field types are serialized. Attributes affect field presentation, not arbitrary C# properties. Debug forwards bounded runtime logs. Reflection-heavy custom editors and arbitrary Unity attributes remain pending.


## Implemented declarations

```csharp
public static class Debug {
 public static void Log(object? value)=>Axiom.Gameplay.Log.Info(value?.ToString()??"");
 public static void LogWarning(object? value)=>Axiom.Gameplay.Log.Info("Warning: "+value);
 public static void LogError(object? value)=>Axiom.Gameplay.Log.Info("Error: "+value);
}
```
