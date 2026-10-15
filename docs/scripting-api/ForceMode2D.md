# ForceMode2D

Namespace: `Axiom.Gameplay`

## Description

Selects a 2D force integrated over the frame interval, or an instantaneous mass-dependent impulse.

## Use cases

Give a 2D player a jump impulse.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var body = GetComponent<Rigidbody2D>();
if (body != null) body.AddForce(new Vector2(0, 3), ForceMode2D.Impulse);
```

## Compatibility and limitations

# ForceMode2D

Force integrates over the current frame delta; Impulse changes velocity immediately according to body mass. Used by Rigidbody2D.AddForce.


## Implemented declarations

```csharp
public enum ForceMode2D {Force,Impulse}
```
