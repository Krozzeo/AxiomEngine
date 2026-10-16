# Coroutine

Namespace: `Axiom.Gameplay`

Coroutine handles and supported yield waits. See MonoBehaviour for scheduling, cancellation and limits.


## Implemented declarations

```csharp
public sealed class Coroutine {
 internal readonly MonoBehaviour Owner;internal readonly IEnumerator Routine;internal readonly Stack<IEnumerator> Stack=new();internal object? Waiting;internal double Until;internal int Frame;internal bool Done;
 internal Coroutine(MonoBehaviour owner,IEnumerator routine){Owner=owner;Routine=routine;Stack.Push(routine);}
}

public sealed class WaitForSeconds {internal double Duration;public WaitForSeconds(double seconds){if(!double.IsFinite(seconds)||seconds<0)throw new ArgumentException("Invalid wait");Duration=seconds;}}

public sealed class WaitForSecondsRealtime {public double waitTime;public WaitForSecondsRealtime(double seconds){if(!double.IsFinite(seconds)||seconds<0)throw new ArgumentException("Invalid wait");waitTime=seconds;}}

public sealed class WaitUntil {internal Func<bool> Test;public WaitUntil(Func<bool> predicate){Test=predicate??throw new ArgumentNullException(nameof(predicate));}}

public sealed class WaitWhile {internal Func<bool> Test;public WaitWhile(Func<bool> predicate){Test=predicate??throw new ArgumentNullException(nameof(predicate));}}

public sealed class WaitForFixedUpdate {}

public sealed class WaitForEndOfFrame {}
```
