using Axiom.Gameplay;
namespace Game;
public sealed class GameScript : Script {
 public override void OnStart() {
  Log.Info("C# started: "+Entity.Id);
  Entity.Spawn(Entity.Transform.Position+new Vec3(2,0,0));
 }
 public override void OnUpdate(double deltaSeconds) {
  Entity.Move(new Vec3(Input.Axis("ArrowLeft","ArrowRight"),0,0)*deltaSeconds*2);
 }
 public override void OnStop() {Log.Info("C# stopped");}
}
