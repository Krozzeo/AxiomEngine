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

# Input

Axiom.Gameplay API reference. Unity naming baseline: Unity 6.3 LTS.

GetAxis currently equals GetAxisRaw; no smoothing. Axes: Horizontal, Vertical, Mouse X, Mouse Y. KeyCode currently covers WASD, arrow keys, Space, Escape and both Shift keys. The focused Game view supplies input. Mouse buttons, touch, gamepads, action maps and the Unity Input System remain pending.
