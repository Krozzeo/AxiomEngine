# Physics

Snapshot queries against active, enabled 3D colliders, using their live current runtime poses. Raycast (including Ray overloads), RaycastAll, RaycastNonAlloc, Linecast, OverlapSphere/Box, CheckSphere/Box and bounded result buffers are implemented. Ray hits are sorted nearest-first with deterministic entity-ID ties. QueryTriggerInteraction selects global/ignore/collide; queriesHitTriggers is a query preference and does not change solver contacts. DefaultRaycastLayers excludes layer 2, while AllLayers includes every numeric layer.

```csharp
if (Physics.Raycast(transform.position, transform.forward, out var hit, 20))
 Debug.Log(hit.collider.name);
var nearby = Physics.OverlapSphere(transform.position, 3);
```

Positive infinity is accepted for query distance and bounded to the engine position domain. Starting inside a shape returns distance zero and an opposite-ray normal in this baseline, including 3D (a known Unity difference). Invalid vectors, radii or dimensions throw.

## Compatibility limits

The native timestep is 1/60 second with at most eight catch-up steps. Box/sphere and box/circle are the actual shapes; no capsule, mesh, compound collider, joint, continuous collision detection, sleep/interpolation, solver material asset, or per-axis constraint system is claimed. Collider dimensions are explicit world-space half-extents in the current engine and are not automatically multiplied by Transform scale. Changes are runtime-only and Stop restores authored state. MovePosition/MoveRotation set the pose immediately; they do not queue interpolated kinematic movement. Kinematic bodies are manually posed in this baseline; their stored velocity is not integrated autonomously (including Rigidbody2D). The NonAlloc overloads bound writes to the caller buffer, but this managed compatibility implementation still allocates temporary query arrays.


## Implemented declarations

```csharp
public static class Physics {
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

public enum QueryTriggerInteraction {UseGlobal,Ignore,Collide}
```
