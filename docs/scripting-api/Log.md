# Log

Namespace: `Axiom.Gameplay`

## Description

Legacy bounded runtime log entry point. Info forwards a string to the same structured script console as Debug.Log.

## Use cases

Keep existing Axiom diagnostic statements working.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
Log.Info("Controller started");
```

## Compatibility and limitations

Only supported script field types are serialized. Attributes affect field presentation, not arbitrary C# properties. Debug forwards bounded runtime logs. Reflection-heavy custom editors and arbitrary Unity attributes remain pending.


## Implemented declarations

```csharp
public static class Log {public static void Info(string message) => Context.Log(message);}
```
