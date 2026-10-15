# Quaternion

Namespace: `Axiom.Gameplay`

## Description

Four-component rotation value with Euler/AngleAxis construction, inverse, composition and vector rotation. Euler and AngleAxis accept degrees. Entity rotation writes normalize the result.

## Use cases

Rotate an entity without storing ad hoc Euler-angle arrays.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var turn = Quaternion.AngleAxis(90, Vector3.up);
transform.rotation = turn;
Debug.Log(turn * Vector3.forward);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public readonly record struct Quaternion(double X,double Y,double Z,double W) {
 public static Quaternion identity=>Identity;
 public static Quaternion Euler(double x,double y,double z)=>Euler(new Vector3(x,y,z));
 public static Quaternion operator *(Quaternion a,Quaternion b)=>new(a.W*b.X+a.X*b.W+a.Y*b.Z-a.Z*b.Y,a.W*b.Y-a.X*b.Z+a.Y*b.W+a.Z*b.X,a.W*b.Z+a.X*b.Y-a.Y*b.X+a.Z*b.W,a.W*b.W-a.X*b.X-a.Y*b.Y-a.Z*b.Z);
 public static Vector3 operator *(Quaternion q,Vector3 v){var u=new Vector3(q.X,q.Y,q.Z);return v+2*Vector3.Cross(u,Vector3.Cross(u,v)+q.W*v);}
 public static Quaternion Inverse(Quaternion q){var n=q.X*q.X+q.Y*q.Y+q.Z*q.Z+q.W*q.W;if(n<1e-20)throw new ArgumentException("Zero quaternion");return new(-q.X/n,-q.Y/n,-q.Z/n,q.W/n);}
 public static Quaternion AngleAxis(double angle,Vector3 axis){var u=axis.normalized;var a=angle*Math.PI/360;return new(u.X*Math.Sin(a),u.Y*Math.Sin(a),u.Z*Math.Sin(a),Math.Cos(a));}
 public static Quaternion Identity => new(0,0,0,1);
 public static Quaternion Euler(Vector3 degrees) {var x=degrees.X*Math.PI/360;var y=degrees.Y*Math.PI/360;var z=degrees.Z*Math.PI/360;var cx=Math.Cos(x);var sx=Math.Sin(x);var cy=Math.Cos(y);var sy=Math.Sin(y);var cz=Math.Cos(z);var sz=Math.Sin(z);return new(sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz);}
 public static implicit operator Quat(Quaternion q)=>new(q.X,q.Y,q.Z,q.W);public static implicit operator Quaternion(Quat q)=>new(q.X,q.Y,q.Z,q.W);
 internal static Quaternion Read(JsonElement e)=>new(e[0].GetDouble(),e[1].GetDouble(),e[2].GetDouble(),e[3].GetDouble());
}
```
