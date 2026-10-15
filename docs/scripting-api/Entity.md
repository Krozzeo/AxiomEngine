# Entity

Namespace: `Axiom.Gameplay`

## Description

Entity belongs to the objects and components API family. Consult the declarations below for the exact supported surface.

## Use cases

Move an entity with live transform access.

## Example

```csharp
using Axiom.Gameplay;
var target = GameObject.Find("Workshop Cube");
if (target != null) target.transform.position = new Vector3(2, 1, 0);
var body = GetComponent<Rigidbody>();
if (body != null) body.linearVelocity = Vector3.up * 3;
```

## Compatibility and limitations

Transforms use world position/rotation. localScale writes the runtime scale. Legacy Entity.Transform.Position/Rotation/Scale remain snapshots; lowercase transform properties are live. Generic component lookup covers built-in wrappers and already attached scripts. Instantiate clones one entity using the existing spawn contract; it does not yet clone a hierarchy or start new script instances. SetActive controls runtime hierarchy participation; GetComponentInChildren and GetComponentInParent traverse existing components. Dynamic AddComponent, tags and full Unity object identity semantics remain pending.


## Implemented declarations

```csharp
public readonly record struct Entity(string Id, int Generation) {
 public Transform Transform => Context.Read(this);
 public RigidBody RigidBody => Context.ReadBody(this);
 public void SetVelocity(Vec3 velocity) => Context.Velocity(this,velocity);
 public void Move(Vec3 delta) => SetPosition(Transform.Position+(Vector3)delta);
 public void SetPosition(Vec3 position) => Context.Move(this,position);
 public void SetRotation(Quaternion rotation) => Context.Rotate(this,rotation);
 public bool IsGrounded => Context.Grounded.Contains(Id);
 public Entity FindChildWithCamera() => Context.FindCamera(this);
 public string? CurrentAnimation => Context.AnimationState(this,"currentAnimation");
 public string? WhyAnimationNotPlaying => Context.AnimationState(this,"whyAnimationNotPlaying");
 public void SetAnimationParameter(string name,double value) => Context.Animate(this,"parameter",name,value,0);
 public void PlayAnimation(string state,double crossfadeSeconds=0.3) => Context.Animate(this,"state",state,0,crossfadeSeconds);
 public void PauseAnimation() => Context.Animate(this,"pause",null,0,0);
 public void ResumeAnimation() => Context.Animate(this,"resume",null,0,0);
 public void PlayAudio() => Context.Audio(this,"play",0);
 public void PauseAudio() => Context.Audio(this,"pause",0);
 public void ResumeAudio() => Context.Audio(this,"resume",0);
 public void StopAudio() => Context.Audio(this,"stop",0);
 public void SetAudioVolume(double volume) => Context.Audio(this,"volume",volume);
 public Entity Spawn(Vec3 position) => Context.Spawn(this,position);
}
```
