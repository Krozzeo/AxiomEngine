# Physics

Namespace: `Axiom.Gameplay`

## Description

3D closest-hit queries against current script-visible physics geometry.

## Use cases

Destroy a pickup on trigger contact.

## Example

```csharp
using Axiom.Gameplay;
public override void OnTriggerEnter(Collider other) {
 if (other.gameObject.name == "Player") Destroy(gameObject);
}
// For a 2D scene use OnTriggerEnter2D(Collider2D other).
```

## Compatibility and limitations

RigidBody is the legacy velocity snapshot; Rigidbody is the live wrapper. AddForce uses the current frame delta for force/acceleration and directly applies impulse/velocity change; mass comes from the runtime body. Collider bounds are conservative local half-extents with scale and do not yet expose a rotated world AABB. Raycasts use the current sphere/oriented-box solver baseline, layer filtering and a finite default 1000-unit distance; triggers are included. Capsules/meshes currently use their configured box collider. Contact callbacks consume the preceding completed physics snapshot (up to 128 contacts), so delivery is one render frame later and omitted contacts cannot emit callbacks. Full Unity Collision.contacts, joints and arbitrary shape casts remain pending.


## Implemented declarations

```csharp
public static class Physics {
 // Snapshot query follows the engine's sphere/oriented-box baseline. Capsules and
 // mesh geometry use their configured box collider, exactly as the current solver.
 public static bool Raycast(Vector3 origin,Vector3 direction,out RaycastHit hit,double maxDistance=1000,int layerMask=-1)=>Cast(origin,direction,out hit,maxDistance,layerMask,3);
 public static bool Raycast(Vector3 origin,Vector3 direction,double maxDistance=1000,int layerMask=-1)=>Cast(origin,direction,out _,maxDistance,layerMask,3);
 internal static bool Cast(Vector3 origin,Vector3 direction,out RaycastHit hit,double maxDistance,int layerMask,int dimension){
  hit=default;if(!double.IsFinite(maxDistance)||maxDistance<0)throw new ArgumentException("Ray distance must be finite and nonnegative");if(dimension==2)direction.Z=0;if(direction.sqrMagnitude<1e-24)return false;direction=direction.normalized;var best=maxDistance;var found=false;
  foreach(var (id,data) in Context.EntityData.OrderBy(p=>p.Key,StringComparer.Ordinal)){if(!data.TryGetProperty("collider",out var c)||c.GetProperty("dimension").GetInt32()!=dimension||(c.GetProperty("layer").GetUInt32()&unchecked((uint)layerMask))==0)continue;
   var entity=new Entity(id,Context.Generation);var t=Context.Read(entity);var half=Vector3.Read(c.GetProperty("halfExtents"));var relative=origin-t.Position;double distance;Vector3 normal;
   if(c.GetProperty("shape").GetString()=="sphere"){if(dimension==2)relative.Z=0;var squared=relative.sqrMagnitude-half.X*half.X;var q=Vector3.Dot(relative,direction);var discriminant=q*q-squared;if(squared<=0){distance=0;normal=-direction;}else{if(discriminant<0)continue;distance=-q-Math.Sqrt(discriminant);if(distance<0)continue;normal=(origin+direction*distance-t.Position).normalized;}}
   else{var inverse=Quaternion.Inverse(t.Rotation);var o=inverse*relative;var d=inverse*direction;var a=new[]{o.X,o.Y,o.Z};var b=new[]{d.X,d.Y,d.Z};var h=new[]{half.X,half.Y,half.Z};var near=0.0;var far=best;var localNormal=Vector3.zero;for(var axis=0;axis<dimension;axis++){if(Math.Abs(b[axis])<1e-12){if(Math.Abs(a[axis])>h[axis])far=-1;}else{var x=(-h[axis]-a[axis])/b[axis];var y=(h[axis]-a[axis])/b[axis];var lower=Math.Min(x,y);if(lower>near){near=lower;localNormal=axis==0?new(-Math.Sign(b[axis]),0,0):axis==1?new(0,-Math.Sign(b[axis]),0):new(0,0,-Math.Sign(b[axis]));}far=Math.Min(far,Math.Max(x,y));}}if(near>far)continue;distance=near;normal=t.Rotation*localNormal;}
   if(distance<=best&&(!found||distance<best)){best=distance;found=true;hit=new(new Collider(entity),distance,origin+direction*distance,normal);}
  }return found;
 }
}
```
