# RaycastHit2D

Read-only XY hit collider, distance, point, normal, transform and rigidbody. A no-hit default has null collider and converts to false.

## Implemented declarations

```csharp
public readonly record struct RaycastHit2D(Collider2D? collider,double distance,Vector2 point,Vector2 normal){public static implicit operator bool(RaycastHit2D hit)=>hit.collider!=null;public Transform? transform=>collider?.transform;public Rigidbody2D? rigidbody=>collider?.attachedRigidbody;}
```
