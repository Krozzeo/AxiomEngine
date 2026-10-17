# RaycastHit

Read-only hit collider, distance, point, normal, transform and attached rigidbody. Ray supplies GetPoint. Zero-length direction returns no hit.

## Implemented declarations

```csharp
public readonly record struct RaycastHit(Collider collider,double distance,Vector3 point,Vector3 normal) {public Transform transform=>collider.transform;public Rigidbody? rigidbody=>collider.attachedRigidbody;}

public readonly record struct Ray(Vector3 origin,Vector3 direction) {public Vector3 GetPoint(double distance)=>origin+direction.normalized*distance;}
```
