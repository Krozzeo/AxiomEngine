# KeyCode

Namespace: `Axiom.Gameplay`

## Description

Supported keyboard key identifiers. The current enumeration covers WASD, arrows, Space, Escape and left/right Shift. Unsupported keys are not silently mapped.

## Use cases

Express keyboard controls without browser key-code strings.

## Example

The statements below belong inside a `MonoBehaviour` callback. Add the components/resources mentioned in the use case first.

```csharp
if (Input.GetKey(KeyCode.W)) Debug.Log("Forward held");
if (Input.GetKeyUp(KeyCode.Space)) Debug.Log("Space released");
```

## Compatibility and limitations

GetAxis currently equals GetAxisRaw; no smoothing. Axes: Horizontal, Vertical, Mouse X, Mouse Y. KeyCode currently covers WASD, arrow keys, Space, Escape and both Shift keys. The focused Game view supplies input. Mouse buttons, touch, gamepads, action maps and the Unity Input System remain pending.


## Implemented declarations

```csharp
public enum KeyCode {W,A,S,D,UpArrow,DownArrow,LeftArrow,RightArrow,Space,Escape,LeftShift,RightShift}
```
