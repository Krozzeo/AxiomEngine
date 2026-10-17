# M18.3.9 / 0.0.47 — API labs

Run `npm.cmd ci`, then `npm.cmd run demo`, then `npm.cmd run dev`. The five new projects are marked **M18.3.9** in the Hub. Existing projects are preserved. Open a lab and wait for **Compiled**; C# requires .NET 10 and wasm-tools. Use Game for gameplay input, Scene/Hierarchy for runtime inspection. Stop restores the authored scene.

## Runtime API Lab

Play creates **Runtime API Probe (clone)** beneath **Runtime API Probe**. Expand the source in Hierarchy: both cubes are listed, and selecting either there highlights it in Scene. Click the clone in Scene to select that same entity. The clone loses the demo script to prevent recursive cloning; the source drives its motion. Space pauses/resumes scaled time. Stop removes the runtime clone and clears a selection that no longer exists. Empty runtime objects also have clickable Scene markers.

## Input & Persistence API Lab

- WASD/arrows or gamepad left stick move the cube; Space or gamepad A raises it.
- **J** switches Jump between Space and Enter, preserving gamepad A, then saves that binding.
- **P** increments and explicitly saves the score. Select the probe to watch SavedScore, JumpControl, Touches, Gamepads and accumulated MouseTravel. Mouse axes work for custom scripts as well as built-in player controllers.
- **R** restores the starting position.
- On a touch device, touch/drag Game to position the cube. Coordinates use canvas pixels; the demonstration assumes the default 960×540 canvas.

Stop/Play and refresh preserve score and binding for this project/browser origin. Another project has a separate preference bank. Browser storage clearing removes preferences; they are not in the portable project JSON. A physical gamepad may require an initial button press before the browser exposes it.

## Scenes & Resources API Lab

- **A** loads the physical `Scenes/Arena.scene.json` resource additively; Arena Cube appears in Hierarchy.
- **U** unloads Arena while another scene remains.
- **N** replaces the loaded scene with Arena, preserving the original probe marked DontDestroyOnLoad.
- **I** instantiates `Assets/Crate.prefab.json`: **Resource Crate (clone)** appears, selectable in Scene and Hierarchy.
- **P** increments/saves visits. Observe LoadedScenes, ActiveScene and SavedVisits on the persistent probe.

`Assets/Settings.json` loads as TextAsset and is logged at Start. Inspect the physical JSON files from Project/IDE. All assets and script factories belong to the current compiled project; no external files or other editor projects are loaded. These runtime operations do not author scene changes. Scene resource loads/instantiations share the bounded creation budget (64 per Play); restart Play if testing many repeated loads.

## Physics 2D and Physics 3D API Labs

The probe falls onto a static floor. Space applies upward/off-center impulse and spin; R resets pose and velocities. Inspector Damping changes native damping live. **K** toggles a body into/out of velocity-driven kinematic motion; **T** explicitly sleeps/wakes it; **G** toggles scene gravity. Kinematic motion ignores gravity and can push dynamic bodies; static geometry remains immovable.

These labs demonstrate the body controls visually. Automated Rust/Wasm/C# checks also cover constraints, static/simulated 2D bodies, collision exclusions, filtered shape casts, pre-impact contact evidence and bounded continuous collision detection.

See [Scripting API batches](../docs/scripting-api/BATCHES.md) for precise implementation limits and the three remaining major batches. No player demos are recreated.
