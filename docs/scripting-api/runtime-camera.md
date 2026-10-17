# Camera

Camera.main, fieldOfView, orthographic, orthographicSize and aspect map to the actual active Axiom camera. orthographicSize is half the vertical viewing height. Near/far planes, viewport rectangles, render textures and coordinate projection methods remain pending.


## Implemented declarations

```csharp
public sealed partial class Camera : Component {
 internal Camera(Entity entity){Entity=entity;}
 public static Camera? main=>Context.Cameras.Where(id=>Context.IsActive(id)&&Context.EntityData.TryGetValue(id,out var data)&&data.GetProperty("camera").GetProperty("active").GetBoolean()).Select(id=>new Camera(new Entity(id,Context.Generation))).FirstOrDefault();
}

public sealed partial class Camera {
 public double fieldOfView {get=>PresentationData.Read(Entity,"camera").GetProperty("fov").GetDouble();set=>PresentationData.Set(Entity,"camera","fov",JsonValue.Create(value)!);}
 public bool orthographic {get=>PresentationData.Read(Entity,"camera").GetProperty("projection").GetString()=="orthographic";set=>PresentationData.Set(Entity,"camera","projection",JsonValue.Create(value?"orthographic":"perspective")!);}
 public double orthographicSize {get=>PresentationData.Read(Entity,"camera").GetProperty("orthoHeight").GetDouble()/2;set=>PresentationData.Set(Entity,"camera","orthoHeight",JsonValue.Create(value*2)!);}
 public double aspect=>Screen.height>0?(double)Screen.width/Screen.height:1;
}
```
