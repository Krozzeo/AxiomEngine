# Light

Existing authored lights expose color, intensity, range, type and None/Hard shadow mode. Direction comes from the entity rotation. Soft shadows explicitly throw. Adding a Light component from C# and additional rendering settings remain pending.


## Implemented declarations

```csharp
public sealed class Light : Component {public bool enabled {get=>ComponentActivation.Read(Entity,"light");set=>ComponentActivation.Write(Entity,"light",value);}
 internal Light(Entity e){Entity=e;}
 public Color color {get=>PresentationData.Color(Entity,"light","color");set=>PresentationData.Set(Entity,"light","color",PresentationData.Values(value.R,value.G,value.B));}
 public double intensity {get=>PresentationData.Read(Entity,"light").GetProperty("intensity").GetDouble();set=>PresentationData.Set(Entity,"light","intensity",JsonValue.Create(value)!);}
 public double range {get=>PresentationData.Read(Entity,"light").GetProperty("range").GetDouble();set=>PresentationData.Set(Entity,"light","range",JsonValue.Create(value)!);}
 public LightType type {get=>Enum.Parse<LightType>(PresentationData.Read(Entity,"light").GetProperty("kind").GetString()!,true);set=>PresentationData.Set(Entity,"light","kind",JsonValue.Create(value.ToString().ToLowerInvariant())!);}
 public LightShadows shadows {get=>PresentationData.Read(Entity,"light").GetProperty("shadow").GetBoolean()?LightShadows.Hard:LightShadows.None;set{if(value==LightShadows.Soft)throw new NotSupportedException("Soft shadow mode is not implemented");PresentationData.Set(Entity,"light","shadow",JsonValue.Create(value!=LightShadows.None)!);}}
}

public enum LightType {Directional,Point,Spot}

public enum LightShadows {None,Hard,Soft}
```
