# Physics

Native OBB/sphere simulation and managed geometric queries over the current runtime snapshot. Rays, linecasts, sphere/box overlap/check and shape casts support masks and trigger policies. Query distances accept positive infinity within the 4,000,000-world-unit query bound. Query results are deterministic; they do not step the world.

## Expanded in 0.0.47

Native 2D/3D body integration supports custom gravity, stable damping v/(1+damping*dt), moving kinematic bodies without gravity, per-axis position/rotation constraints, explicit Sleep/WakeUp and impact wake-up. Automatic sleep thresholds and interpolation remain pending. Rigidbody2D includes Static bodyType and simulated toggles. Pair/layer collision exclusions are honored by native resolution and triggers; query layer masks are separate. Collision relativeVelocity uses native pre-solver point velocity (including spin), with self-minus-other receiver convention; native diagnostics also expose normal impulse per contact.

Continuous mode uses adaptive fixed-step subdivision up to 64 samples (sized by smallest collider extent and linear travel), retains first-hit contact evidence, and reports one logical fixed step. It is bounded anti-tunneling, not unrestricted analytic TOI or angular CCD. ContinuousDynamic/Speculative throw a documented unsupported error. Maximum velocity remains 10000 world units/s; extreme thin/high-speed cases may exceed the sampling budget.

Sphere/Circle casts use exact closest points with conservative advancement capped at 128 iterations and 1e-7 tolerance. Translating box casts use swept oriented SAT against boxes and reverse sphere casts against spheres. All/nearest/buffer variants preserve deterministic distance order and trigger/layer filters. Very grazing contacts can exhaust the iteration limit and miss; no capsule/mesh casts are claimed. NonAlloc overloads bound output writes but allocate temporary managed arrays. ContactFilter2D currently supports trigger, layer and depth inclusion/exclusion for ray and circle overlap buffers, not normal-angle filtering.

Still pending: capsule/edge/polygon/mesh/compound colliders, joints, terrain, arbitrary center/inertia overrides, contact modification and solver tuning. Collider extents are world units, independent of Transform scale; MovePosition/MoveRotation set immediate poses.




## Implemented declarations

```csharp
public static partial class Physics {
 public const int AllLayers=-1;public const int IgnoreRaycastLayer=4;public const int DefaultRaycastLayers=~IgnoreRaycastLayer;
 public static bool queriesHitTriggers {get;set;}=true;
 public static bool Raycast(Vector3 origin,Vector3 direction,out RaycastHit hit,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal){var all=RaycastAll(origin,direction,maxDistance,layerMask,queryTriggerInteraction);hit=all.FirstOrDefault();return all.Length>0;}
 public static bool Raycast(Vector3 origin,Vector3 direction,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(origin,direction,out _,maxDistance,layerMask,queryTriggerInteraction);
 public static bool Raycast(Ray ray,out RaycastHit hit,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(ray.origin,ray.direction,out hit,maxDistance,layerMask,queryTriggerInteraction);
 public static bool Raycast(Ray ray,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(ray,out _,maxDistance,layerMask,queryTriggerInteraction);
 public static RaycastHit[] RaycastAll(Vector3 origin,Vector3 direction,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Rays(origin,direction,maxDistance,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static int RaycastNonAlloc(Vector3 origin,Vector3 direction,RaycastHit[] results,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(RaycastAll(origin,direction,maxDistance,layerMask,queryTriggerInteraction),results);
 public static bool Linecast(Vector3 start,Vector3 end,out RaycastHit hit,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Raycast(start,end-start,out hit,(end-start).magnitude,layerMask,queryTriggerInteraction);
 public static bool Linecast(Vector3 start,Vector3 end,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>Linecast(start,end,out _,layerMask,queryTriggerInteraction);
 public static Collider[] OverlapSphere(Vector3 position,double radius,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Sphere(position,radius,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static int OverlapSphereNonAlloc(Vector3 position,double radius,Collider[] results,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(OverlapSphere(position,radius,layerMask,queryTriggerInteraction),results);
 public static bool CheckSphere(Vector3 position,double radius,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>OverlapSphere(position,radius,layerMask,queryTriggerInteraction).Length>0;
 public static Collider[] OverlapBox(Vector3 center,Vector3 halfExtents,Quaternion orientation=default,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Box(center,halfExtents,orientation==default?Quaternion.identity:orientation,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static int OverlapBoxNonAlloc(Vector3 center,Vector3 halfExtents,Collider[] results,Quaternion orientation=default,int layerMask=AllLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(OverlapBox(center,halfExtents,orientation,layerMask,queryTriggerInteraction),results);
 public static bool CheckBox(Vector3 center,Vector3 halfExtents,Quaternion orientation=default,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>OverlapBox(center,halfExtents,orientation,layerMask,queryTriggerInteraction).Length>0;
}

public static partial class Physics {
 public static Vector3 gravity {get=>PhysicsWorld.Gravity("gravity");set=>PhysicsWorld.Gravity("gravity",value);}
 public static void IgnoreCollision(Collider a,Collider b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredPairs",PhysicsWorld.Pair(a,b),ignore);
 public static bool GetIgnoreCollision(Collider a,Collider b)=>PhysicsWorld.Ignored("ignoredPairs",PhysicsWorld.Pair(a,b));
 public static void IgnoreLayerCollision(int a,int b,bool ignore=true)=>PhysicsWorld.Ignore("ignoredLayers3",PhysicsWorld.Layers(a,b),ignore);
 public static bool GetIgnoreLayerCollision(int a,int b)=>PhysicsWorld.Ignored("ignoredLayers3",PhysicsWorld.Layers(a,b));
}

public static partial class Physics {
 public static RaycastHit[] SphereCastAll(Vector3 origin,double radius,Vector3 direction,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>ShapeCasts.Sphere(origin,radius,direction,maxDistance,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static bool SphereCast(Vector3 origin,double radius,Vector3 direction,out RaycastHit hit,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal){var hits=SphereCastAll(origin,radius,direction,maxDistance,layerMask,queryTriggerInteraction);hit=hits.FirstOrDefault();return hits.Length>0;}
 public static int SphereCastNonAlloc(Vector3 origin,double radius,Vector3 direction,RaycastHit[] results,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(SphereCastAll(origin,radius,direction,maxDistance,layerMask,queryTriggerInteraction),results);
 public static RaycastHit[] BoxCastAll(Vector3 center,Vector3 halfExtents,Vector3 direction,Quaternion orientation,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>ShapeCasts.Box(center,halfExtents,direction,orientation,maxDistance,layerMask,3,PhysicsQueries.Triggers(queryTriggerInteraction));
 public static bool BoxCast(Vector3 center,Vector3 halfExtents,Vector3 direction,out RaycastHit hit,Quaternion orientation,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal){var hits=BoxCastAll(center,halfExtents,direction,orientation,maxDistance,layerMask,queryTriggerInteraction);hit=hits.FirstOrDefault();return hits.Length>0;}
 public static int BoxCastNonAlloc(Vector3 center,Vector3 halfExtents,Vector3 direction,RaycastHit[] results,Quaternion orientation,double maxDistance=double.PositiveInfinity,int layerMask=DefaultRaycastLayers,QueryTriggerInteraction queryTriggerInteraction=QueryTriggerInteraction.UseGlobal)=>PhysicsQueries.Fill(BoxCastAll(center,halfExtents,direction,orientation,maxDistance,layerMask,queryTriggerInteraction),results);
}

public enum QueryTriggerInteraction {UseGlobal,Ignore,Collide}
```
