# Object

Namespace: `Axiom.Gameplay`

## Description

Runtime creation and destruction entry points. Destroy removes the target entity and its descendants from the simulation.

## Use cases

Move an entity with live transform access.

## Example

```csharp
using Axiom.Gameplay;
var target = GameObject.Find("Workshop Cube");
if (target != null) target.transform.position = new Vector3(2, 1, 0);
var body = GetComponent<Rigidbody>();
if (body != null) body.linearVelocity = Vector3.up * 3;
```

## Compatibility and limitations

Transforms use world position/rotation. localScale writes the runtime scale. Legacy Entity.Transform.Position/Rotation/Scale remain snapshots; lowercase transform properties are live. Generic component lookup covers built-in wrappers and already attached scripts. Instantiate clones one entity using the existing spawn contract; it does not yet clone a hierarchy or start new script instances. SetActive controls runtime hierarchy participation; GetComponentInChildren and GetComponentInParent traverse existing components. Dynamic AddComponent, tags and full Unity object identity semantics remain pending.


## Implemented declarations

```csharp
public class Object {
 public static GameObject Instantiate(GameObject original)=>Instantiate(original,original.transform.position,original.transform.rotation);
 public static GameObject Instantiate(GameObject original,Vector3 position,Quaternion rotation){var entity=original.Entity.Spawn(position);entity.SetRotation(rotation);return new GameObject(entity);}
 public static void Destroy(GameObject target)=>Context.Destroy(target.Entity);
 public static void Destroy(Component target)=>Destroy(target.gameObject);
}
```
