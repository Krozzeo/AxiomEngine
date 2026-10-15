# Color32

Namespace: `Axiom.Gameplay`

## Description

Color32 belongs to the mathematics API family. Consult the declarations below for the exact supported surface.

## Use cases

Vectors and quaternions.

## Example

```csharp
using Axiom.Gameplay;
var direction = (destination - transform.position).normalized;
transform.rotation = Quaternion.Euler(0, 90, 0);
var distance = Vector3.Distance(destination, transform.position);
```

## Compatibility and limitations

Existing PascalCase names remain supported. Lowercase vector fields and constants are available. Vector numbers use double rather than Unity float. Vector4Int is an Axiom extension. Legacy Vector3.Forward points toward -Z; the Unity-compatible lowercase Vector3.forward points +Z. Axiom cameras look along local -Z. Random wraps the deterministic replay generator; qualify Axiom.Gameplay.Random when System.Random is also in scope. Not every Unity math member is implemented.


## Implemented declarations

```csharp
public readonly record struct Color32(byte R,byte G,byte B,byte A=255);
public readonly record struct Rect(double X,double Y,double Width,double Height);
public readonly record struct Bounds(Vector3 Center,Vector3 Size);
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
