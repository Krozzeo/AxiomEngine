using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using System.Text.Json;
namespace Axiom.Gameplay;
internal static class ScriptValues {
 internal static void Apply([DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields|DynamicallyAccessedMemberTypes.NonPublicFields)] Type type,Script script,JsonElement values){
  if(values.ValueKind!=JsonValueKind.Object)throw new ArgumentException("Script fields must be an object");
  foreach(var property in values.EnumerateObject()){var field=type.GetField(property.Name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic);if(field==null||field.IsInitOnly||field.IsStatic||field.GetCustomAttribute<HideInInspectorAttribute>()!=null||!field.IsPublic&&field.GetCustomAttribute<SerializeFieldAttribute>()==null)continue;field.SetValue(script,Read(field.FieldType,property.Value));}
 }
 internal static void Write([DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicFields|DynamicallyAccessedMemberTypes.NonPublicFields)] Type type,Script script,Utf8JsonWriter writer,string[] names){writer.WriteStartObject();foreach(var name in names){var f=type.GetField(name,BindingFlags.Instance|BindingFlags.Public|BindingFlags.NonPublic);if(f==null)continue;writer.WritePropertyName(name);var v=f.GetValue(script);switch(v){case bool x:writer.WriteBooleanValue(x);break;case string x:writer.WriteStringValue(x);break;case Enum x:writer.WriteNumberValue(Convert.ToInt32(x));break;case byte x:writer.WriteNumberValue(x);break;case short x:writer.WriteNumberValue(x);break;case int x:writer.WriteNumberValue(x);break;case uint x:writer.WriteNumberValue(x);break;case long x:writer.WriteNumberValue(x);break;case float x:writer.WriteNumberValue(x);break;case double x:writer.WriteNumberValue(x);break;
case Vector2 x: Numbers(writer,x.X,x.Y);break;
case Vector3 x: Numbers(writer,x.X,x.Y,x.Z);break;
case Vector4 x: Numbers(writer,x.X,x.Y,x.Z,x.W);break;
case Vector2Int x: Numbers(writer,x.X,x.Y);break;
case Vector3Int x: Numbers(writer,x.X,x.Y,x.Z);break;
case Vector4Int x: Numbers(writer,x.X,x.Y,x.Z,x.W);break;
case Vec3 x: Numbers(writer,x.X,x.Y,x.Z);break;
case Quat x: Numbers(writer,x.X,x.Y,x.Z,x.W);break;
case Quaternion x: Numbers(writer,x.X,x.Y,x.Z,x.W);break;
case Color x: Numbers(writer,x.R,x.G,x.B,x.A);break;
case Color32 x: Numbers(writer,x.R,x.G,x.B,x.A);break;
case Rect x: Numbers(writer,x.X,x.Y,x.Width,x.Height);break;
case Bounds x: Numbers(writer,x.Center.X,x.Center.Y,x.Center.Z,x.Size.X,x.Size.Y,x.Size.Z);break;
 default:writer.WriteNullValue();break;}}writer.WriteEndObject();}
 private static void Numbers(Utf8JsonWriter writer,params double[] values){writer.WriteStartArray();foreach(var v in values)writer.WriteNumberValue(v);writer.WriteEndArray();}
 private static object Read(Type type,JsonElement e){
  if(type==typeof(bool))return e.GetBoolean();if(type==typeof(string))return e.GetString()??"";
  if(type.IsEnum)return Enum.ToObject(type,e.GetInt32());if(type==typeof(int))return e.GetInt32();if(type==typeof(uint))return e.GetUInt32();if(type==typeof(short))return e.GetInt16();if(type==typeof(byte))return e.GetByte();if(type==typeof(long))return e.GetInt64();if(type==typeof(float))return (float)e.GetDouble();if(type==typeof(double))return e.GetDouble();
  if(type==typeof(Vector2))return Vector2.Read(e);if(type==typeof(Vector3))return Vector3.Read(e);if(type==typeof(Vector4))return Vector4.Read(e);if(type==typeof(Vector2Int))return Vector2Int.Read(e);if(type==typeof(Vector3Int))return Vector3Int.Read(e);if(type==typeof(Vector4Int))return Vector4Int.Read(e);if(type==typeof(Vec3))return Vec3.Read(e);if(type==typeof(Quat))return Quat.Read(e);if(type==typeof(Quaternion))return Quaternion.Read(e);if(type==typeof(Color))return new Color(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());if(type==typeof(Rect))return new Rect(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());if(type==typeof(Bounds))return new Bounds(new Vector3(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble()),new Vector3(e[3].GetDouble(),e[4].GetDouble(),e[5].GetDouble()));if(type==typeof(Color32))return new Color32(e[0].GetByte(),e[1].GetByte(),e[2].GetByte(),e[3].GetByte());throw new ArgumentException("Unsupported serialized field type");
 }
}
