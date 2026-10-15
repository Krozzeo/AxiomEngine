# MonoBehaviour

Namespace: `Axiom.Gameplay`

## Description

Base class for attachable gameplay scripts, with explicit virtual lifecycle and contact callbacks.

## Use cases

Frame-based behaviour.

## Example

```csharp
using Axiom.Gameplay;
public sealed class Motion : MonoBehaviour {
 public double Speed = 1;
 public override void Update() {
  transform.position += Vector3.right * Speed * Time.deltaTime;
 }
}
```

## Compatibility and limitations

Override public callbacks; Unity-style private message methods are not reflected. Existing OnStart/OnUpdate/OnStop overrides remain supported and take precedence if they do not call base. FixedUpdate uses a local 0.02-second accumulator and is not yet a solver-owned callback. LateUpdate follows Update for each behaviour, not a separate global phase. Time uses doubles. Coroutines, Invoke, timeScale and scene loading remain pending.


## Implemented declarations

```csharp
public abstract class MonoBehaviour : Script {
 private double fixedAccumulator;
 public virtual void OnCollisionEnter(Collision collision){}public virtual void OnCollisionStay(Collision collision){}public virtual void OnCollisionExit(Collision collision){}
 public virtual void OnTriggerEnter(Collider other){}public virtual void OnTriggerStay(Collider other){}public virtual void OnTriggerExit(Collider other){}
 public virtual void OnCollisionEnter2D(Collision2D collision){}public virtual void OnCollisionStay2D(Collision2D collision){}public virtual void OnCollisionExit2D(Collision2D collision){}
 public virtual void OnTriggerEnter2D(Collider2D other){}public virtual void OnTriggerStay2D(Collider2D other){}public virtual void OnTriggerExit2D(Collider2D other){}
 public virtual void Awake(){}public virtual void OnEnable(){}public virtual void Start(){}public virtual void Update(){}public virtual void FixedUpdate(){}public virtual void LateUpdate(){}public virtual void OnDisable(){}public virtual void OnDestroy(){}
 public override void OnStart(){Awake();OnEnable();Start();}
 public override void OnUpdate(double deltaSeconds){fixedAccumulator+=deltaSeconds;while(fixedAccumulator>=Time.fixedDeltaTime){FixedUpdate();fixedAccumulator-=Time.fixedDeltaTime;}Update();LateUpdate();}
 public override void OnStop(){OnDisable();OnDestroy();}
}
```
