# BoxCollider2D

Runtime XY box size in world units. Rotation is about Z; size must be finite and positive.

## Implemented declarations

```csharp
public sealed class BoxCollider2D : Collider2D {internal BoxCollider2D(Entity entity):base(entity){} public Vector2 size {get{var h=PhysicsData.Half(Entity);return new(h.X*2,h.Y*2);}set=>PhysicsData.Half(Entity,new(value.X/2,value.Y/2,.5));}}
```
