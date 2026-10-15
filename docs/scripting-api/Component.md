# Component

Namespace: `Axiom.Gameplay`

## Description

Base for script and built-in component wrappers. Entity identifies its owner; gameObject and transform expose the owner facade. Component searches walk the current runtime hierarchy.

## Use cases

Retrieve the owning Rigidbody without copying scene JSON or inventing entity IDs.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var body = GetComponent<Rigidbody>();
if (body != null) body.linearVelocity = Vector3.up * 3;
var camera = GetComponentInChildren<Camera>();
if (camera != null) Debug.Log(camera.gameObject.name);
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
