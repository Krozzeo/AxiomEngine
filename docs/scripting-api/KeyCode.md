# KeyCode

Namespace: `Axiom.Gameplay`

## Description

KeyCode belongs to the input API family. Consult the declarations below for the exact supported surface.

## Use cases

Keyboard movement and jump edge.

## Example

```csharp
using Axiom.Gameplay;
var horizontal = Input.GetAxisRaw("Horizontal");
if (Input.GetKeyDown(KeyCode.Space) && Entity.IsGrounded) {
 var body = GetComponent<Rigidbody>();
 if (body != null) body.linearVelocity = new Vector3(horizontal, 5, 0);
}
```

## Compatibility and limitations

GetAxis currently equals GetAxisRaw; no smoothing. Axes: Horizontal, Vertical, Mouse X, Mouse Y. KeyCode currently covers WASD, arrow keys, Space, Escape and both Shift keys. The focused Game view supplies input. Mouse buttons, touch, gamepads, action maps and the Unity Input System remain pending.


## Implemented declarations

```csharp
public enum KeyCode {W,A,S,D,UpArrow,DownArrow,LeftArrow,RightArrow,Space,Escape,LeftShift,RightShift}
```
