# Collider2D

2D collider facade with Vector2 ClosestPoint and attachedRigidbody2D. Inherits trigger/enabled and world AABB bounds. XY shape geometry is independent of Z.

## Implemented declarations

```csharp
public class Collider2D : Collider {internal Collider2D(Entity entity):base(entity){} public new Rigidbody2D? attachedRigidbody=>gameObject.GetComponent<Rigidbody2D>();public Vector2 ClosestPoint(Vector2 position){var p=base.ClosestPoint(new(position.X,position.Y,transform.position.Z));return new(p.X,p.Y);}}
```
