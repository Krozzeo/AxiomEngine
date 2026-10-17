# SphereCollider

Runtime sphere radius in world units; finite positive radius updates the actual sphere solver shape.

## Implemented declarations

```csharp
public sealed class SphereCollider : Collider {internal SphereCollider(Entity entity):base(entity){} public double radius {get=>PhysicsData.Half(Entity).X;set=>PhysicsData.Half(Entity,new(value,value,value));}}
```
