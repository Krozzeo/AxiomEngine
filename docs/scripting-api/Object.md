# Object

Namespace: `Axiom.Gameplay`

## Description

Base for the live object/component facade. Instantiate creates one runtime entity from an existing template; Destroy removes an entity subtree. These operations affect Play, not the authored scene.

## Use cases

Spawn a temporary pickup or remove a consumed object.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var original = GameObject.Find("Pickup");
if (original != null) {
 var clone = Instantiate(original, new Vector3(2, 1, 0), Quaternion.identity);
 Destroy(clone);
}
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
