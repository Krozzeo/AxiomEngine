# Behaviour

Namespace: `Axiom.Gameplay`

Enable/disable script execution without deleting its component.


## Implemented declarations

```csharp
public class Behaviour : Component {
 private bool active=true;
 public bool enabled {get=>active;set{if(active==value)return;var before=isActiveAndEnabled;active=value;if(this is MonoBehaviour)RuntimeLifecycle.Activation();}}
 public bool isActiveAndEnabled=>active&&Context.Entities.ContainsKey(Entity.Id)&&Context.IsActive(Entity.Id)&&(this is not Script script||Context.LiveScripts.Contains(script));
}
```
