# CustomYieldInstruction

Derive a custom wait with public override bool keepWaiting. The scheduler checks it once per Update after at least one frame. Existing nested enumerators, fixed/end-of-frame waits and scaled/unscaled waits remain supported. General Task/async-await synchronization and Unity editor-specific messages remain pending.


## Implemented declarations

```csharp
public abstract class CustomYieldInstruction : IEnumerator {public abstract bool keepWaiting {get;}public object? Current=>null;public bool MoveNext()=>keepWaiting;public void Reset(){}}
```
