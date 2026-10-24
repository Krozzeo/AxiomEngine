# Scripting API status —0.0.49 / SDK 8

M19–M39 remain planned. This release added shared Inspector/C# activation, GameObject.scene and whole-scene persistence through Always active, plus reference/performance corrections. It does not provide full Unity parity or complete any of the nine historical areas; all remain partial.

```csharp
var managers = SceneManager.GetSceneByName("Managers");
SceneManager.SetSceneAlwaysActive(managers, true); // Axiom extension
GetComponent<Light>()!.enabled = false;
enabled = false; // Disable this script; another script or Inspector can re-enable it.
```

Play changes are discarded on Stop. Run active plus marked scenes; LoadScene Single preserves Managers. Lock state persists and is undoable in Edit. It is not a replacement for DontDestroyOnLoad on individual objects. Scene.alwaysActive/SetSceneAlwaysActive/IsSceneAlwaysActive are Axiom extensions, not Unity members.

Capacity65536 entities/bodies/draws combines with geometry/project/message/time budgets;32 scripts/128 response operations remain. Capacity is not a frame-rate promise. M19 must fix the complete denominator and conformance tests before precise coverage percentages. [Report](../reports/M18_3_11_CURRENT_REPORT.md). Functional source2cf8fa7 passed [CI 315 (42/42)](https://github.com/Krozzeo/AxiomGameEngine/actions/runs/39324017306); dense whole-editor performance remains open.

Naming references: [Behaviour.enabled](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/Behaviour-enabled.html), [LoadScene](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/SceneManagement.SceneManager.LoadScene.html). Current code/CI is tracked separately in implementation status.
