# Input

Namespace: `Axiom.Gameplay`

## Description

Keyboard/axis facade over the focused Game view. GetKey tests held state; GetKeyDown/GetKeyUp detect frame edges using previous key state. Mouse X/Y expose captured deltas.

## Use cases

Move with WASD/arrows and trigger a single action when Space is first pressed.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
var x = Input.GetAxisRaw("Horizontal");
transform.position += Vector3.right * x * Time.deltaTime;
if (Input.GetKeyDown(KeyCode.Space)) Debug.Log("Jump pressed");
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
