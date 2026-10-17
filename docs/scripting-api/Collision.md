# Collision

One callback per colliding pair per phase, preserving all native manifold points (up to four per pair, global snapshot cap 128). contacts, contactCount, GetContact and GetContacts expose world points, receiver-facing normals and negative penetration separation. relativeVelocity is self-minus-other linear velocity at post-solver dispatch, not the pre-impact/impulse value. Exit has zero contacts. Solver impulse totals and complete pre-impact contact velocities are pending.

## Implemented declarations

```csharp
public sealed class Collision {
 public Collider collider {get;}public GameObject gameObject=>collider.gameObject;public Transform transform=>collider.transform;public Rigidbody? rigidbody=>collider.attachedRigidbody;
 public Vector3 normal {get;}public Vector3 point {get;}public Vector3 relativeVelocity {get;}
 public ContactPoint[] contacts {get;}public int contactCount=>contacts.Length;
 public ContactPoint GetContact(int index)=>contacts[index];public int GetContacts(ContactPoint[] buffer){var count=Math.Min(buffer.Length,contacts.Length);Array.Copy(contacts,buffer,count);return count;}
 internal Collision(Collider collider,Vector3 normal,Vector3 point,ContactPoint[] contacts,Vector3 relativeVelocity){this.collider=collider;this.normal=normal;this.point=point;this.contacts=contacts;this.relativeVelocity=relativeVelocity;}
}

public readonly record struct ContactPoint(Vector3 point,Vector3 normal,double separation,Collider thisCollider,Collider otherCollider);
```
