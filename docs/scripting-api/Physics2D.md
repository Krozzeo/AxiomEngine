# Physics2D

Native XY box/circle simulation and managed ray, line, point/circle/box overlap, circle/box shape casts and ContactFilter2D buffer queries. Box query size is full size; 3D halfExtents are half size. Layer and trigger filtering are explicit. Z only affects overlap ordering/depth filters, not XY collision geometry.

## Expanded in 0.0.47

Native 2D/3D body integration supports custom gravity, stable damping v/(1+damping*dt), moving kinematic bodies without gravity, per-axis position/rotation constraints, explicit Sleep/WakeUp and impact wake-up. Automatic sleep thresholds and interpolation remain pending. Rigidbody2D includes Static bodyType and simulated toggles. Pair/layer collision exclusions are honored by native resolution and triggers; query layer masks are separate. Collision relativeVelocity uses native pre-solver point velocity (including spin), with self-minus-other receiver convention; native diagnostics also expose normal impulse per contact.

Continuous mode uses adaptive fixed-step subdivision up to 64 samples (sized by smallest collider extent and linear travel), retains first-hit contact evidence, and reports one logical fixed step. It is bounded anti-tunneling, not unrestricted analytic TOI or angular CCD. ContinuousDynamic/Speculative throw a documented unsupported error. Maximum velocity remains 10000 world units/s; extreme thin/high-speed cases may exceed the sampling budget.

Sphere/Circle casts use exact closest points with conservative advancement capped at 128 iterations and 1e-7 tolerance. Translating box casts use swept oriented SAT against boxes and reverse sphere casts against spheres. All/nearest/buffer variants preserve deterministic distance order and trigger/layer filters. Very grazing contacts can exhaust the iteration limit and miss; no capsule/mesh casts are claimed. NonAlloc overloads bound output writes but allocate temporary managed arrays. ContactFilter2D currently supports trigger, layer and depth inclusion/exclusion for ray and circle overlap buffers, not normal-angle filtering.

Still pending: capsule/edge/polygon/mesh/compound colliders, joints, terrain, arbitrary center/inertia overrides, contact modification and solver tuning. Collider extents are world units, independent of Transform scale; MovePosition/MoveRotation set immediate poses.




## Implemented declarations

```csharp
public static partial class Physics2D {
 public const int AllLayers=-1;public const int DefaultRaycastLayers=Physics.DefaultRaycastLayers;public static bool queriesHitTriggers {get;set;}=true;
 public static RaycastHit2D Raycast(Vector2 origin,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>RaycastAll(origin,direction,distance,layerMask).FirstOrDefault();
 public static RaycastHit2D[] RaycastAll(Vector2 origin,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>PhysicsQueries.Rays(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),distance,layerMask,2,queriesHitTriggers).Select(PhysicsQueries.Hit2D).ToArray();
 public static int RaycastNonAlloc(Vector2 origin,Vector2 direction,RaycastHit2D[] results,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>PhysicsQueries.Fill(RaycastAll(origin,direction,distance,layerMask),results);
 public static RaycastHit2D Linecast(Vector2 start,Vector2 end,int layerMask=DefaultRaycastLayers)=>Raycast(start,end-start,(end-start).magnitude,layerMask);
 public static Collider2D[] OverlapCircleAll(Vector2 point,double radius,int layerMask=AllLayers)=>PhysicsQueries.Sphere(new(point.X,point.Y,0),radius,layerMask,2,queriesHitTriggers).Select(c=>new Collider2D(c.Entity)).OrderBy(c=>c.transform.position.Z).ToArray();
 public static Collider2D? OverlapCircle(Vector2 point,double radius,int layerMask=AllLayers)=>OverlapCircleAll(point,radius,layerMask).FirstOrDefault();
 public static int OverlapCircleNonAlloc(Vector2 point,double radius,Collider2D[] results,int layerMask=AllLayers)=>PhysicsQueries.Fill(OverlapCircleAll(point,radius,layerMask),results);
 public static Collider2D[] OverlapBoxAll(Vector2 point,Vector2 size,double angle,int layerMask=AllLayers)=>PhysicsQueries.Box(new(point.X,point.Y,0),new(size.X/2,size.Y/2,0),Quaternion.Euler(0,0,angle),layerMask,2,queriesHitTriggers).Select(c=>new Collider2D(c.Entity)).OrderBy(c=>c.transform.position.Z).ToArray();
 public static Collider2D? OverlapBox(Vector2 point,Vector2 size,double angle,int layerMask=AllLayers)=>OverlapBoxAll(point,size,angle,layerMask).FirstOrDefault();
 public static int OverlapBoxNonAlloc(Vector2 point,Vector2 size,double angle,Collider2D[] results,int layerMask=AllLayers)=>PhysicsQueries.Fill(OverlapBoxAll(point,size,angle,layerMask),results);
 public static Collider2D? OverlapPoint(Vector2 point,int layerMask=AllLayers)=>OverlapCircle(point,0,layerMask);
 public static Collider2D[] OverlapPointAll(Vector2 point,int layerMask=AllLayers)=>OverlapCircleAll(point,0,layerMask);
}

public static partial class Physics2D {
 public static Vector2 gravity {get{var v=PhysicsWorld.Gravity("gravity2D");return new(v.X,v.Y);}set=>PhysicsWorld.Gravity("gravity2D",new(value.X,value.Y,0));}
 public static void IgnoreCollision(Collider2D a,Collider2D b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredPairs",PhysicsWorld.Pair(a,b),ignore);
 public static bool GetIgnoreCollision(Collider2D a,Collider2D b)=>PhysicsWorld.Ignored("ignoredPairs",PhysicsWorld.Pair(a,b));
 public static void IgnoreLayerCollision(int a,int b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredLayers2",PhysicsWorld.Layers(a,b),ignore);
 public static bool GetIgnoreLayerCollision(int a,int b)=>PhysicsWorld.Ignored("ignoredLayers2",PhysicsWorld.Layers(a,b));
}

public static partial class Physics2D {
 public static int Raycast(Vector2 origin,Vector2 direction,ContactFilter2D filter,RaycastHit2D[] results,double distance=double.PositiveInfinity){ArgumentNullException.ThrowIfNull(results);var hits=PhysicsQueries.Rays(new(origin.X,origin.Y,0),new(direction.X,direction.Y,0),distance,filter.useLayerMask?filter.layerMask:AllLayers,2,filter.useTriggers).Select(PhysicsQueries.Hit2D).Where(h=>filter.Allows(h.collider!)).Take(results.Length).ToArray();Array.Copy(hits,results,hits.Length);return hits.Length;}
 public static int OverlapCircle(Vector2 point,double radius,ContactFilter2D filter,Collider2D[] results){ArgumentNullException.ThrowIfNull(results);var hits=PhysicsQueries.Sphere(new(point.X,point.Y,0),radius,filter.useLayerMask?filter.layerMask:AllLayers,2,filter.useTriggers).Select(c=>new Collider2D(c.Entity)).Where(filter.Allows).OrderBy(c=>c.transform.position.Z).Take(results.Length).ToArray();Array.Copy(hits,results,hits.Length);return hits.Length;}
}

public static partial class Physics2D {
 public static RaycastHit2D[] CircleCastAll(Vector2 origin,double radius,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>ShapeCasts.Sphere(new(origin.X,origin.Y,0),radius,new(direction.X,direction.Y,0),distance,layerMask,2,queriesHitTriggers).Select(PhysicsQueries.Hit2D).ToArray();
 public static RaycastHit2D CircleCast(Vector2 origin,double radius,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>CircleCastAll(origin,radius,direction,distance,layerMask).FirstOrDefault();
 public static int CircleCastNonAlloc(Vector2 origin,double radius,Vector2 direction,RaycastHit2D[] results,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>PhysicsQueries.Fill(CircleCastAll(origin,radius,direction,distance,layerMask),results);
 public static RaycastHit2D[] BoxCastAll(Vector2 origin,Vector2 size,double angle,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>ShapeCasts.Box(new(origin.X,origin.Y,0),new(size.X/2,size.Y/2,0),new(direction.X,direction.Y,0),Quaternion.Euler(0,0,angle),distance,layerMask,2,queriesHitTriggers).Select(PhysicsQueries.Hit2D).ToArray();
 public static RaycastHit2D BoxCast(Vector2 origin,Vector2 size,double angle,Vector2 direction,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>BoxCastAll(origin,size,angle,direction,distance,layerMask).FirstOrDefault();
 public static int BoxCastNonAlloc(Vector2 origin,Vector2 size,double angle,Vector2 direction,RaycastHit2D[] results,double distance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers)=>PhysicsQueries.Fill(BoxCastAll(origin,size,angle,direction,distance,layerMask),results);
}

public struct ContactFilter2D {
 public bool useTriggers,useLayerMask,useDepth,useOutsideDepth;public int layerMask;public double minDepth,maxDepth;
 public ContactFilter2D NoFilter(){useTriggers=true;useLayerMask=false;useDepth=false;useOutsideDepth=false;return this;}
 public void SetLayerMask(int mask){layerMask=mask;useLayerMask=true;}public void ClearLayerMask()=>useLayerMask=false;
 public void SetDepth(double min,double max){if(!double.IsFinite(min)||!double.IsFinite(max)||min>max)throw new ArgumentException("Invalid depth range");minDepth=min;maxDepth=max;useDepth=true;}public void ClearDepth()=>useDepth=false;
 public bool IsFilteringLayerMask(GameObject target)=>useLayerMask&&(unchecked((uint)layerMask)&(1u<<target.layer))==0;
 public bool IsFilteringDepth(GameObject target){if(!useDepth)return false;var inside=target.transform.position.Z>=minDepth&&target.transform.position.Z<=maxDepth;return useOutsideDepth?inside:!inside;}
 internal bool Allows(Collider2D target)=>(useTriggers||!target.isTrigger)&&!IsFilteringLayerMask(target.gameObject)&&!IsFilteringDepth(target.gameObject);
}
```
