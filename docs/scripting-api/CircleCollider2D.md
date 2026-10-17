# CircleCollider2D

Runtime circle radius in world units, finite and positive.

## Implemented declarations

```csharp
public sealed class CircleCollider2D : Collider2D {internal CircleCollider2D(Entity entity):base(entity){} public double radius {get=>PhysicsData.Half(Entity).X;set=>PhysicsData.Half(Entity,new(value,value,.5));}}
```
