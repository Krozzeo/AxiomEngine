# Component

Namespace: `Axiom.Gameplay`

## Description

Component belongs to the objects and components API family. Consult the declarations below for the exact supported surface.

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
public class Component : Object {
 public Entity Entity {get;internal set;}
 public GameObject gameObject=>new(Entity);
 public Transform transform=>new(Entity);
 public T? GetComponent<T>() where T:Component=>gameObject.GetComponent<T>();
 public T? GetComponentInChildren<T>() where T:Component {var own=GetComponent<T>();if(own!=null)return own;for(var i=0;i<transform.childCount;i++){var found=transform.GetChild(i).GetComponentInChildren<T>();if(found!=null)return found;}return null;}
 public T? GetComponentInParent<T>() where T:Component {Transform? current=transform;while(current!=null){var component=current.GetComponent<T>();if(component!=null)return component;current=current.parent;}return null;}
 public bool TryGetComponent<T>(out T? component) where T:Component {component=GetComponent<T>();return component!=null;}
}
```
