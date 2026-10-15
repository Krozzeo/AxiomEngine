# Input

Namespace: `Axiom.Gameplay`

## Description

Input belongs to the input API family. Consult the declarations below for the exact supported surface.

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
public static partial class Input {
 public static Vector2 MouseDelta => Context.MouseDelta;
 public static bool IsDown(string code) => Context.Keys.Contains(code);
 public static double Axis(string negative, string positive) => (IsDown(positive)?1:0)-(IsDown(negative)?1:0);
}

public static partial class Input {
 private static string Code(KeyCode key)=>key switch {KeyCode.UpArrow=>"ArrowUp",KeyCode.DownArrow=>"ArrowDown",KeyCode.LeftArrow=>"ArrowLeft",KeyCode.RightArrow=>"ArrowRight",KeyCode.Space=>"Space",KeyCode.Escape=>"Escape",KeyCode.LeftShift=>"ShiftLeft",KeyCode.RightShift=>"ShiftRight",_=>"Key"+key};
 public static bool GetKey(KeyCode key)=>IsDown(Code(key));
 public static bool GetKeyDown(KeyCode key)=>IsDown(Code(key))&&!Context.PreviousKeys.Contains(Code(key));
 public static bool GetKeyUp(KeyCode key)=>!IsDown(Code(key))&&Context.PreviousKeys.Contains(Code(key));
 public static double GetAxisRaw(string axis)=>axis switch {"Horizontal"=>Math.Clamp(Axis("KeyA","KeyD")+Axis("ArrowLeft","ArrowRight"),-1,1),"Vertical"=>Math.Clamp(Axis("KeyS","KeyW")+Axis("ArrowDown","ArrowUp"),-1,1),"Mouse X"=>MouseDelta.X,"Mouse Y"=>MouseDelta.Y,_=>throw new ArgumentException("Unknown input axis "+axis)};
 public static double GetAxis(string axis)=>GetAxisRaw(axis);
}
```
