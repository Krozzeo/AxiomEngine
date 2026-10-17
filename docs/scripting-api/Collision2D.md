# Collision2D

2D contact manifold and relativeVelocity with Vector2 values. Same pair-level enter/stay/exit semantics and snapshot limits as Collision. Exit returns zero current contact points.

## Implemented declarations

```csharp
public sealed class Collision2D {
 public Collider2D collider {get;}public GameObject gameObject=>collider.gameObject;public Transform transform=>collider.transform;public Rigidbody2D? rigidbody=>collider.attachedRigidbody;
 public Vector2 normal {get;}public Vector2 point {get;}public Vector2 relativeVelocity {get;}
 public ContactPoint2D[] contacts {get;}public int contactCount=>contacts.Length;
 public ContactPoint2D GetContact(int index)=>contacts[index];public int GetContacts(ContactPoint2D[] buffer){var count=Math.Min(buffer.Length,contacts.Length);Array.Copy(contacts,buffer,count);return count;}
 internal Collision2D(Collider2D collider,Vector3 normal,Vector3 point,ContactPoint2D[] contacts,Vector3 relativeVelocity){this.collider=collider;this.normal=new(normal.X,normal.Y);this.point=new(point.X,point.Y);this.contacts=contacts;this.relativeVelocity=new(relativeVelocity.X,relativeVelocity.Y);}
}

public readonly record struct ContactPoint2D(Vector2 point,Vector2 normal,double separation,Collider2D collider,Collider2D otherCollider);
```
