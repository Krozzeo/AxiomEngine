# AudioListener

Namespace: `Axiom.Gameplay`

Runtime listener component; active mixing uses the engine listener policy.


SDK 8: `.enabled` and the Inspector component checkbox control this component in Edit and Play. Runtime changes do not modify authored data.

## Implemented declarations

```csharp
public sealed class AudioListener : Component {public bool enabled {get=>ComponentActivation.Read(Entity,"audioListener")&&Context.EntityData[Entity.Id].GetProperty("audioListener").GetProperty("enabled").GetBoolean();set{var data=JsonNode.Parse(Context.EntityData[Entity.Id].GetProperty("audioListener").GetRawText())!;data["enabled"]=value;Context.Property(Entity,"audioListener",data);ComponentActivation.Write(Entity,"audioListener",value);}}internal AudioListener(Entity entity){Entity=entity;}}
```
