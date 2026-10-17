# ResourceRequest and AsyncOperation

Resources.LoadAsync<T> resolves already-resident validated resources; it is immediately done. HTTP subclasses remain pending until host completion. completed event callbacks run when the operation completes, and newly subscribed callbacks run immediately for an already completed operation. These are not scene streaming promises.


## Implemented declarations

```csharp
public sealed class ResourceRequest : AsyncOperation {public Object? asset {get;}internal ResourceRequest(Object? value){asset=value;}}

public class AsyncOperation {public virtual bool isDone=>true;public virtual double progress=>1;private event Action<AsyncOperation>? callbacks;public event Action<AsyncOperation> completed {add{if(isDone)value(this);else callbacks+=value;}remove{callbacks-=value;}}internal void Complete(){callbacks?.Invoke(this);callbacks=null;}}
```
