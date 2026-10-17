# Physics2D

XY-only snapshot queries against active, enabled 2D colliders: Raycast, RaycastAll, RaycastNonAlloc, Linecast, OverlapCircle(All/NonAlloc), OverlapBox(All/NonAlloc) and OverlapPoint(All). No 3D colliders enter 2D results. RaycastHit2D is implicitly testable as bool. Boxes use full size and an angle in degrees; 3D OverlapBox uses half-extents. Overlap results are sorted by increasing world Z with stable entity-ID ties. queriesHitTriggers controls this dimension independently.

```csharp
var hit = Physics2D.Raycast(new Vector2(0, 2), Vector2.down, 10);
if (hit) Debug.Log(hit.collider!.name);
```

Depth-range overloads, ContactFilter2D and shape casts are pending. See the parent physics section for solver limits.

## Compatibility limits

The native timestep is 1/60 second with at most eight catch-up steps. Box/sphere and box/circle are the actual shapes; no capsule, mesh, compound collider, joint, continuous collision detection, sleep/interpolation, solver material asset, or per-axis constraint system is claimed. Collider dimensions are explicit world-space half-extents in the current engine and are not automatically multiplied by Transform scale. Changes are runtime-only and Stop restores authored state. MovePosition/MoveRotation set the pose immediately; they do not queue interpolated kinematic movement. Kinematic bodies are manually posed in this baseline; their stored velocity is not integrated autonomously (including Rigidbody2D). The NonAlloc overloads bound writes to the caller buffer, but this managed compatibility implementation still allocates temporary query arrays.


## Implemented declarations

```csharp
public static class Physics2D {
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
```
