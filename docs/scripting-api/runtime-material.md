# Renderer and Material

GetComponent<MeshRenderer>().material exposes live instance color, metallic, roughness and emissionColor. SpriteRenderer exposes tint, flipX/flipY and sortingOrder. Edits update runtime rendering and Inspector. Assets must already be authored; arbitrary shaders, textures/material creation, property blocks and render pipeline extensibility remain pending. sharedMaterial aliases the instance facade and does not modify a shared asset.


## Implemented declarations

```csharp
public class Renderer : Component {internal Renderer(Entity e){Entity=e;}public Material material=>new(Entity);public Material sharedMaterial=>material;}

public sealed class MeshRenderer : Renderer {internal MeshRenderer(Entity e):base(e){}}

public sealed class SpriteRenderer : Renderer {
 internal SpriteRenderer(Entity e):base(e){}
 public Color color {get=>PresentationData.Color(Entity,"sprite2D","tint");set=>PresentationData.Set(Entity,"sprite2D","tint",PresentationData.Values(value.R,value.G,value.B,value.A));}
 public bool flipX {get=>PresentationData.Read(Entity,"sprite2D").GetProperty("flipX").GetBoolean();set=>PresentationData.Set(Entity,"sprite2D","flipX",JsonValue.Create(value)!);}
 public bool flipY {get=>PresentationData.Read(Entity,"sprite2D").GetProperty("flipY").GetBoolean();set=>PresentationData.Set(Entity,"sprite2D","flipY",JsonValue.Create(value)!);}
 public int sortingOrder {get=>PresentationData.Read(Entity,"sprite2D").GetProperty("order").GetInt32();set=>PresentationData.Set(Entity,"sprite2D","order",JsonValue.Create(value)!);}
}

public sealed class Material : Object {
 private readonly Entity entity;internal Material(Entity e){entity=e;}
 public Color color {get=>PresentationData.Color(entity,"material","baseColor");set=>PresentationData.Set(entity,"material","baseColor",PresentationData.Values(value.R,value.G,value.B,value.A));}
 public double metallic {get=>PresentationData.Read(entity,"material").GetProperty("metallic").GetDouble();set=>PresentationData.Set(entity,"material","metallic",JsonValue.Create(value)!);}
 public double roughness {get=>PresentationData.Read(entity,"material").GetProperty("roughness").GetDouble();set=>PresentationData.Set(entity,"material","roughness",JsonValue.Create(value)!);}
 public Color emissionColor {get=>PresentationData.Color(entity,"material","emissive");set=>PresentationData.Set(entity,"material","emissive",PresentationData.Values(value.R,value.G,value.B));}
}
```
