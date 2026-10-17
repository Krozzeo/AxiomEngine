# NavMesh grid pathfinding

Namespace Axiom.Gameplay.AI. BuildGrid(minimum, columns, rows, cellSize, blockedCells) explicitly configures at most 4096 XZ cells. Four-neighbor A* returns complete or partial routes; SamplePosition finds a walkable cell. Area mask supports zero (none) or nonzero (the single grid area). There is no triangle bake, radius-aware obstacle clearance, area costs, dynamic obstacle carving or off-mesh links. Example: NavMesh.BuildGrid(Vector3.zero, 8, 8, 1, new[]{3,11}); var path = new NavMeshPath(); NavMesh.CalculatePath(new Vector3(.5,0,.5), new Vector3(7.5,0,7.5), NavMesh.AllAreas, path);


## Implemented declarations

```csharp
public static class NavMesh {
 public const int AllAreas=-1;private static Vector3 origin;private static int width,height;private static double cell=1;private static HashSet<int> blocked=new();
 // Axiom-specific build entry. Explicit XZ grid, not an automatic triangle-navmesh bake.
 public static void BuildGrid(Vector3 minimum,int columns,int rows,double cellSize,int[]? blockedCells=null){if(columns<1||rows<1||(long)columns*rows>4096||!double.IsFinite(cellSize)||cellSize<=0)throw new ArgumentException("Grid must contain 1–4096 cells and positive cell size");var walls=new HashSet<int>(blockedCells??Array.Empty<int>());if(walls.Any(i=>i<0||i>=columns*rows))throw new ArgumentException("Blocked cell outside grid");origin=minimum;width=columns;height=rows;cell=cellSize;blocked=walls;}
 private static int Cell(Vector3 p){var x=(int)Math.Floor((p.X-origin.X)/cell);var z=(int)Math.Floor((p.Z-origin.Z)/cell);return x>=0&&x<width&&z>=0&&z<height?z*width+x:-1;}
 private static Vector3 Point(int i)=>origin+new Vector3((i%width+.5)*cell,0,(i/width+.5)*cell);
 public static bool SamplePosition(Vector3 sourcePosition,out NavMeshHit hit,double maxDistance,int areaMask){if(!double.IsFinite(maxDistance)||maxDistance<0)throw new ArgumentException("Invalid sample distance");var best=-1;var distance=double.PositiveInfinity;if(areaMask!=0)for(var i=0;i<width*height;i++)if(!blocked.Contains(i)){var d=(Point(i)-sourcePosition).magnitude;if(d<distance&&d<=maxDistance){distance=d;best=i;}}hit=best<0?default:new(Point(best),distance,1,true);return best>=0;}
 public static bool CalculatePath(Vector3 sourcePosition,Vector3 targetPosition,int areaMask,NavMeshPath path){path.ClearCorners();if(areaMask==0)return false;var start=Cell(sourcePosition);var end=Cell(targetPosition);if(start<0||end<0||blocked.Contains(start)||blocked.Contains(end))return false;var queue=new PriorityQueue<int,double>();var costs=new Dictionary<int,double>{{start,0}};var parent=new Dictionary<int,int>();var closed=new HashSet<int>();var closest=start;double H(int i)=>Math.Abs(i%width-end%width)+Math.Abs(i/width-end/width);queue.Enqueue(start,H(start));while(queue.TryDequeue(out var current,out _)){if(!closed.Add(current))continue;if(H(current)<H(closest))closest=current;if(current==end){closest=end;break;}foreach(var next in new[]{current%width>0?current-1:-1,current%width<width-1?current+1:-1,current>=width?current-width:-1,current+width<width*height?current+width:-1}){if(next<0||blocked.Contains(next)||closed.Contains(next))continue;var cost=costs[current]+1;if(costs.TryGetValue(next,out var previous)&&previous<=cost)continue;costs[next]=cost;parent[next]=current;queue.Enqueue(next,cost+H(next));}}var nodes=new List<int>{closest};while(nodes[^1]!=start)nodes.Add(parent[nodes[^1]]);nodes.Reverse();path.corners=new[]{sourcePosition}.Concat(nodes.Skip(1).Select(Point)).Concat(closest==end?new[]{targetPosition}:Array.Empty<Vector3>()).ToArray();path.status=closest==end?NavMeshPathStatus.PathComplete:NavMeshPathStatus.PathPartial;return true;}
 internal static void Reset(){width=height=0;blocked.Clear();NavMeshAgent.Agents.Clear();}
 internal static void Tick(double delta){foreach(var (id,agent) in NavMeshAgent.Agents.ToArray()){if(!Context.Entities.ContainsKey(id)){NavMeshAgent.Agents.Remove(id);continue;}agent.Tick(delta);}}
}

public sealed class NavMeshPath {public Vector3[] corners {get;internal set;}=Array.Empty<Vector3>();public NavMeshPathStatus status {get;internal set;}=NavMeshPathStatus.PathInvalid;public void ClearCorners(){corners=Array.Empty<Vector3>();status=NavMeshPathStatus.PathInvalid;}}

public readonly record struct NavMeshHit(Vector3 position,double distance,int mask,bool hit);

public enum NavMeshPathStatus {PathComplete,PathPartial,PathInvalid}
```
