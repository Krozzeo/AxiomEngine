# Touch

A read-only frame snapshot with fingerId, bottom-left canvas pixel position, accumulated deltaPosition, phase and pressure. Began/Ended/Canceled last one sampled frame; Stationary reports zero delta. Terminal touches are included once, then removed. No more than ten active pointers. Sample from Input.GetTouch after checking touchCount.

## Implemented declarations

```csharp
public readonly record struct Touch(int fingerId,Vector2 position,Vector2 deltaPosition,TouchPhase phase,double pressure);

public enum TouchPhase {Began,Moved,Stationary,Ended,Canceled}
```
