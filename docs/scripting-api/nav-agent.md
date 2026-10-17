# NavMeshAgent

Attach at runtime with gameObject.AddComponent<NavMeshAgent>(). SetDestination computes synchronously. speed, stoppingDistance, isStopped and updateRotation control route following; path, remainingDistance, velocity and status expose state. Warp samples the grid. No local avoidance, acceleration model or automatic repath. Do not combine with a gravity-driven dynamic Rigidbody. Agents are runtime-only components; authoring Add Component support remains pending.


## Implemented declarations

```csharp
public sealed class NavMeshAgent : Behaviour {
 internal static readonly Dictionary<string,NavMeshAgent> Agents=new();internal NavMeshAgent(Entity e){Entity=e;}
 public double speed {get;set;}=3.5;public double stoppingDistance {get;set;}=.1;public bool isStopped {get;set;}public bool updateRotation {get;set;}=true;
 public Vector3 destination {get;private set;}public NavMeshPath path {get;private set;}=new();private int waypoint;
 public bool pathPending=>false;public bool hasPath=>waypoint<path.corners.Length;public NavMeshPathStatus pathStatus=>path.status;public Vector3 velocity {get;private set;}
 public double remainingDistance {get{if(!hasPath)return 0;var value=(path.corners[waypoint]-transform.position).magnitude;for(var i=waypoint+1;i<path.corners.Length;i++)value+=(path.corners[i]-path.corners[i-1]).magnitude;return value;}}
 public bool SetDestination(Vector3 target){var next=new NavMeshPath();if(!NavMesh.CalculatePath(transform.position,target,NavMesh.AllAreas,next))return false;destination=target;path=next;waypoint=1;return true;}
 public void ResetPath(){path.ClearCorners();waypoint=0;velocity=Vector3.zero;}
 public bool Warp(Vector3 position){if(!NavMesh.SamplePosition(position,out var hit,1,NavMesh.AllAreas))return false;transform.position=hit.position;ResetPath();return true;}
 internal void Tick(double delta){velocity=Vector3.zero;if(!isActiveAndEnabled||isStopped||!hasPath||delta<=0)return;if(!double.IsFinite(speed)||speed<0||!double.IsFinite(stoppingDistance)||stoppingDistance<0)throw new ArgumentException("Invalid agent speed/stoppingDistance");var before=transform.position;var budget=speed*delta;var position=before;while(hasPath&&budget>0){var diff=path.corners[waypoint]-position;var distance=diff.magnitude;var last=waypoint==path.corners.Length-1;if(last&&distance<=stoppingDistance){waypoint=path.corners.Length;break;}var travel=Math.Min(budget,last?Math.Max(0,distance-stoppingDistance):distance);if(distance>1e-9)position+=diff/distance*travel;budget-=travel;if(travel>=distance-1e-9)waypoint++;else break;}if((position-before).magnitude>1e-9){transform.position=position;velocity=(position-before)/delta;if(updateRotation)transform.rotation=Quaternion.Euler(0,Math.Atan2(-velocity.X,-velocity.Z)*Mathf.Rad2Deg,0);}}
}
```
