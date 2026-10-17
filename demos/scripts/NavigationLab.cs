using Axiom.Gameplay;
using Axiom.Gameplay.AI;
namespace Game;
public sealed class NavigationLab : MonoBehaviour {
 public double Speed=2;[ReadOnly] public double Remaining=0;[ReadOnly] public string Status="";private NavMeshAgent? agent;private bool other;
 public override void Start(){NavMesh.BuildGrid(new Vector3(-4,0,-4),8,8,1,new[]{3,11,19,27,35,43});agent=gameObject.AddComponent<NavMeshAgent>();agent.SetDestination(new Vector3(3.5,0,3.5));Debug.Log("Navigation: cube follows an A* route around the wall. N alternates destination; P pauses/resumes agent. Speed is editable.");}
 public override void Update(){if(agent==null)return;agent.speed=Speed;Remaining=agent.remainingDistance;Status=agent.pathStatus.ToString();if(Input.GetKeyDown(KeyCode.P))agent.isStopped=!agent.isStopped;if(Input.GetKeyDown(KeyCode.N)){other=!other;agent.SetDestination(other?new Vector3(-3.5,0,-3.5):new Vector3(3.5,0,3.5));}}
}
