using System.Text.Json.Nodes;
namespace Axiom.Gameplay;
internal static class PresentationData {
 internal static System.Text.Json.JsonElement Read(Entity e,string key){_=Context.Read(e);if(!Context.EntityData[e.Id].TryGetProperty(key,out var v))throw new InvalidOperationException("Component missing: "+key);return v;}
 internal static void Set(Entity e,string key,string field,JsonNode value){var data=JsonNode.Parse(Read(e,key).GetRawText())!.AsObject();if(data[field]?.ToJsonString()==value.ToJsonString())return;data[field]=value;Context.Property(e,key,data);}
 internal static Color Color(Entity e,string key,string field){var v=Read(e,key).GetProperty(field);return new(v[0].GetDouble(),v[1].GetDouble(),v[2].GetDouble(),v.GetArrayLength()>3?v[3].GetDouble():1);}
 internal static JsonArray Values(params double[] v){var a=new JsonArray();foreach(var n in v){if(!double.IsFinite(n))throw new ArgumentException("Non-finite presentation value");a.Add(JsonValue.Create(n));}return a;}
}
public sealed class Material : Object {
 private readonly Entity entity;internal Material(Entity e){entity=e;}
 public Color color {get=>PresentationData.Color(entity,"material","baseColor");set=>PresentationData.Set(entity,"material","baseColor",PresentationData.Values(value.R,value.G,value.B,value.A));}
 public double metallic {get=>PresentationData.Read(entity,"material").GetProperty("metallic").GetDouble();set=>PresentationData.Set(entity,"material","metallic",JsonValue.Create(value)!);}
 public double roughness {get=>PresentationData.Read(entity,"material").GetProperty("roughness").GetDouble();set=>PresentationData.Set(entity,"material","roughness",JsonValue.Create(value)!);}
 public Color emissionColor {get=>PresentationData.Color(entity,"material","emissive");set=>PresentationData.Set(entity,"material","emissive",PresentationData.Values(value.R,value.G,value.B));}
}
public class Renderer : Component {internal Renderer(Entity e){Entity=e;}public Material material {get{if(!Context.EntityData[Entity.Id].TryGetProperty("material",out _))Context.Property(Entity,"material",JsonNode.Parse("{\"baseColor\":[1,1,1,1],\"metallic\":0,\"roughness\":0.5,\"emissive\":[0,0,0],\"alphaMode\":\"opaque\",\"alphaCutoff\":0.5,\"unlit\":false,\"castShadow\":true}"));return new(Entity);}}public Material sharedMaterial=>material;}
public sealed class MeshRenderer : Renderer {internal MeshRenderer(Entity e):base(e){}}
public sealed class SpriteRenderer : Renderer {
 internal SpriteRenderer(Entity e):base(e){}
 public Color color {get=>PresentationData.Color(Entity,"sprite2D","tint");set=>PresentationData.Set(Entity,"sprite2D","tint",PresentationData.Values(value.R,value.G,value.B,value.A));}
 public bool flipX {get=>PresentationData.Read(Entity,"sprite2D").GetProperty("flipX").GetBoolean();set=>PresentationData.Set(Entity,"sprite2D","flipX",JsonValue.Create(value)!);}
 public bool flipY {get=>PresentationData.Read(Entity,"sprite2D").GetProperty("flipY").GetBoolean();set=>PresentationData.Set(Entity,"sprite2D","flipY",JsonValue.Create(value)!);}
 public int sortingOrder {get=>PresentationData.Read(Entity,"sprite2D").GetProperty("order").GetInt32();set=>PresentationData.Set(Entity,"sprite2D","order",JsonValue.Create(value)!);}
}
public enum LightType {Directional,Point,Spot}
public enum LightShadows {None,Hard,Soft}
public sealed class Light : Component {
 internal Light(Entity e){Entity=e;}
 public Color color {get=>PresentationData.Color(Entity,"light","color");set=>PresentationData.Set(Entity,"light","color",PresentationData.Values(value.R,value.G,value.B));}
 public double intensity {get=>PresentationData.Read(Entity,"light").GetProperty("intensity").GetDouble();set=>PresentationData.Set(Entity,"light","intensity",JsonValue.Create(value)!);}
 public double range {get=>PresentationData.Read(Entity,"light").GetProperty("range").GetDouble();set=>PresentationData.Set(Entity,"light","range",JsonValue.Create(value)!);}
 public LightType type {get=>Enum.Parse<LightType>(PresentationData.Read(Entity,"light").GetProperty("kind").GetString()!,true);set=>PresentationData.Set(Entity,"light","kind",JsonValue.Create(value.ToString().ToLowerInvariant())!);}
 public LightShadows shadows {get=>PresentationData.Read(Entity,"light").GetProperty("shadow").GetBoolean()?LightShadows.Hard:LightShadows.None;set{if(value==LightShadows.Soft)throw new NotSupportedException("Soft shadow mode is not implemented");PresentationData.Set(Entity,"light","shadow",JsonValue.Create(value!=LightShadows.None)!);}}
}
public sealed partial class Camera {
 public double fieldOfView {get=>PresentationData.Read(Entity,"camera").GetProperty("fov").GetDouble();set=>PresentationData.Set(Entity,"camera","fov",JsonValue.Create(value)!);}
 public bool orthographic {get=>PresentationData.Read(Entity,"camera").GetProperty("projection").GetString()=="orthographic";set=>PresentationData.Set(Entity,"camera","projection",JsonValue.Create(value?"orthographic":"perspective")!);}
 public double orthographicSize {get=>PresentationData.Read(Entity,"camera").GetProperty("orthoHeight").GetDouble()/2;set=>PresentationData.Set(Entity,"camera","orthoHeight",JsonValue.Create(value*2)!);}
 public double aspect=>Screen.height>0?(double)Screen.width/Screen.height:1;
}
public sealed partial class AudioSource {
 public bool loop {get=>PresentationData.Read(Entity,"audioSource").GetProperty("loop").GetBoolean();set=>PresentationData.Set(Entity,"audioSource","loop",JsonValue.Create(value)!);}
 public double pitch {get=>PresentationData.Read(Entity,"audioSource").GetProperty("playbackRate").GetDouble();set=>PresentationData.Set(Entity,"audioSource","playbackRate",JsonValue.Create(value)!);}
 public double minDistance {get=>PresentationData.Read(Entity,"audioSource").GetProperty("minDistance").GetDouble();set=>PresentationData.Set(Entity,"audioSource","minDistance",JsonValue.Create(value)!);}
 public double maxDistance {get=>PresentationData.Read(Entity,"audioSource").GetProperty("maxDistance").GetDouble();set=>PresentationData.Set(Entity,"audioSource","maxDistance",JsonValue.Create(value)!);}
}
public sealed partial class Animator {
 public double GetFloat(string name){var p=PresentationData.Read(Entity,"animator").GetProperty("parameters").EnumerateArray().FirstOrDefault(p=>p.GetProperty("name").GetString()==name);if(p.ValueKind==System.Text.Json.JsonValueKind.Undefined)throw new ArgumentException("Unknown Animator parameter");return p.GetProperty("value").GetDouble();}
 public bool GetBool(string name)=>GetFloat(name)!=0;public int GetInteger(string name)=>(int)GetFloat(name);
}
