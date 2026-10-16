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
public abstract partial class MonoBehaviour : Script {
 public virtual void OnCollisionEnter(Collision collision){}public virtual void OnCollisionStay(Collision collision){}public virtual void OnCollisionExit(Collision collision){}
 public virtual void OnTriggerEnter(Collider other){}public virtual void OnTriggerStay(Collider other){}public virtual void OnTriggerExit(Collider other){}
 public virtual void OnCollisionEnter2D(Collision2D collision){}public virtual void OnCollisionStay2D(Collision2D collision){}public virtual void OnCollisionExit2D(Collision2D collision){}
 public virtual void OnTriggerEnter2D(Collider2D other){}public virtual void OnTriggerStay2D(Collider2D other){}public virtual void OnTriggerExit2D(Collider2D other){}
 public virtual void Awake(){}public virtual void OnEnable(){}public virtual void Start(){}public virtual void Update(){}public virtual void FixedUpdate(){}public virtual void LateUpdate(){}public virtual void OnDisable(){}public virtual void OnDestroy(){}
 public override void OnStart(){}
 public override void OnUpdate(double deltaSeconds){Update();}
 public override void OnStop(){}
}

public abstract partial class MonoBehaviour {
 public Coroutine StartCoroutine(IEnumerator routine)=>RuntimeLifecycle.Start(this,routine);
 public void StopCoroutine(Coroutine coroutine){if(coroutine.Owner!=this)throw new ArgumentException("Coroutine belongs to another behaviour");RuntimeLifecycle.Stop(coroutine);}
 public void StopCoroutine(IEnumerator routine)=>RuntimeLifecycle.Stop(this,routine);
 public void StopAllCoroutines()=>RuntimeLifecycle.StopAll(this);
 public void Invoke(string methodName,double time)=>RuntimeLifecycle.Invoke(this,methodName,time,0);
 public void InvokeRepeating(string methodName,double time,double repeatRate){if(repeatRate<=0)throw new ArgumentException("Repeat rate must be positive");RuntimeLifecycle.Invoke(this,methodName,time,repeatRate);}
 public void CancelInvoke()=>RuntimeLifecycle.Cancel(this,null);
 public void CancelInvoke(string methodName)=>RuntimeLifecycle.Cancel(this,methodName);
 public bool IsInvoking()=>RuntimeLifecycle.IsInvoking(this,null);
 public bool IsInvoking(string methodName)=>RuntimeLifecycle.IsInvoking(this,methodName);
}
```
