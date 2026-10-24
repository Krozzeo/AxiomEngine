# Compatibility Observatory — editable M19 demo

From the Engine directory run `npm run demo:m19`, then `npm run dev`. Open its authenticated browser URL, select **Demo · M19 Compatibility Observatory** and open the editor. Existing projects are preserved; repeated generation creates another demo.

1. Select **Compatibility Probe**, open Game and press Play. The scene retains the default cube, directional light and camera.
2. In the Inspector observe Frames, Passed, Failed and Report. After at least11 frames and the wait case, expect25 passed observations and2 known failures. Reports identify each case; a green harness result does not mean full Unity conformance.
3. The known failures are `object.parent` (wrapper equality despite the same instance ID) and `object.destroy-deferred` (immediate invalidation during Update). `object.parent-id` and `object.destroy-after` distinguish identity/timing observations. Both discrepancies are assigned to M20, with scheduling implications in M22.
4. Stop. The complete authored scene is restored; runtime-created children, destroyed objects and runtime fields are not saved into authoring.
5. Open `Scripts/CompatibilityProbe.cs` from the project IDE, edit an observation, save and compile. The resource is a real project file, `Assets/Resources/Observatory.json`; resource tests do not use a sample-only API.
6. Choose **Help → Compatibility Observatory**. Switch among declared managed ABI, published scripting reference and external packages. Search `Vector3`, `UnityEditor.Editor` or an exact declaration, then filter milestone/priority/status. Each row retains provenance. Package blockers are visible and separate.

The automated test `npm run test:browser:m19` uses a fresh temporary project, real C#/Wasm, Play/Stop and the actual Help link. It verifies known discrepancies, scene restoration and all three inventory scopes. It uses Null rendering to test UI/runtime behavior; this is not GPU physics or rendering acceptance. Exact Unity6.3 reference execution and M19-specific AOT/device profiles remain uncredited. No account token or paid AI call is needed.
