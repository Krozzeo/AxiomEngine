# M18.3.10 / 0.0.48 — Scenes, services and Inspector labs

Run `npm.cmd ci`, `npm.cmd run demo`, then `npm.cmd run dev`. Open the **M18.3.10** labs from Hub. Existing projects are preserved. Wait for Compiled. Game must have keyboard focus for controls; Scene/Hierarchy/Inspector remain available during Play. Runtime edits are restored on Stop except explicit PlayerPrefs saves.

## References & Inspectors Lab

Select Reference Receiver. Its script has typed empty slots. Lock the Inspector with the open-padlock icon; select Reference Source: the pinned Inspector must stay on Receiver. Right-click the Inspector tab > Duplicate Tab; dock the second Inspector elsewhere or detach it. Unlock one Inspector and inspect Source. Drag Source's Transform heading into Receiver's Target, and ReferenceMover heading into Controller. Drag Assets/ReferenceSettings.json into Configuration. Drag the Source entity from Hierarchy into Focus and Scenes/Next.scene into NextScene. A compatible object picker and clear button are also available. Invalid types/project identities reject.

Play: Source oscillates. Receiver's ReferenceStatus names the resolved target/configuration and shows the linked controller speed. V toggles the linked controller speed between 1 and 3. T moves Target up once, but its own oscillation controller can overwrite that position on the next Update. Null fields do nothing. Save before stopping/reopening to check authored references. Create > Inspector opens another normal unlocked Inspector. Duplicate Tab copies the source Inspector target/lock; all tabs have Close Tab on right-click. Up to eight Inspector panels; positions persist, locks are session state and reset when switching project/workspace.

## Scenes & Resources API Lab

Project contains physical `Scenes/Main Scene.scene` and `Scenes/Arena.scene`, plus prefab/settings resources. Double-click Arena (or right-click > Open): another named scene header appears in Hierarchy and Arena becomes active. Click Main Scene's title to activate it. Only the active editor scene appears while stopped; the runtime supports additive loaded scenes during Play. Collapse either header: only its title should occupy space. Close with X or right-click > Close Scene: content stays in its .scene file. Reopening restores authored objects. Open scenes cannot be overwritten/deleted/renamed as raw files.

Create > Scene or Project > right-click > New Scene creates a uniquely named .scene in the current Project directory. New files are initially empty. Open and author entities; Save persists the scene document with the project. Creating projects is available only in Hub, which closes after a successful open/create.

Game controls: A load Arena additively, U unload if another scene remains, N replace with Arena keeping the persistent probe, I instantiate a prefab, P increment/save visits. SavedVisits is explicitly annotated [PlayerPref("visits")], so Inspector shows the saved value during and outside Play, including after Stop/reload. This does not preserve transient fields/transforms. Storage is project/browser/origin-specific. Avoid opening Arena in the editor before testing A if you want to observe a fresh additive load.

## Physics 2D and 3D Stress API Labs

Select Stress Controller. Play starts spawning one batch. N queues another batch (BatchSize defaults 16; range 1–32). One body is added per frame to avoid one-frame creation spikes; wait until the count stabilizes before measuring. Backspace removes a batch. Fields show DynamicBodies, Contacts, FPS and previous-frame duration. Game Debug can show FPS. Diagnostics/Profiler provide frame and physics evidence. Capture a quiet baseline and then steady 16/32/64/128/192/255-body samples with the same camera/render settings. Do not mistake the spawn/rebuild interval for steady-state simulation cost.

The native solver has a 256-active-body ceiling: 255 dynamic blocks plus one static floor. The hidden inactive template does not count as an active body. CapacityReached identifies the ceiling, which is not an FPS result. The former lifetime quota of 64 creations is gone. Compare WebGPU and Null renderer to distinguish rendering cost; do not compare absolute FPS across different cameras/devices as if it were a solver-only measurement. Stop/Play resets the test. No universal hardware capacity is claimed.

## Navigation API Lab

The small cube follows an A* path around the visible wall on an explicitly configured XZ grid. N alternates destinations, P pauses/resumes the agent, Speed changes motion. Remaining and Status expose the route. This is a bounded four-neighbor grid implementation, not triangle NavMesh baking or local agent avoidance; a gravity-driven Rigidbody is not attached.

## Presentation API Lab

Cube material color and directional light intensity pulse live through C# facades. PulseSpeed changes frequency; AnimateColor stops the cube's color animation. Select the light to observe ActualIntensity. O toggles the active camera between perspective and orthographic. Runtime changes restore on Stop.

## Platform & Network API Lab

Inspector reports actual canvas dimensions and browser/platform hints. Enter an external HTTP(S) text endpoint with CORS in URL, focus Game, press H. No request is sent automatically. NetworkStatus shows loading, status/result or the actual error; Response is limited to 512 displayed characters. Browser rules apply: no editor-origin calls, embedded credentials, redirects or cookies; max eight concurrent requests, 64 KiB upload, 256 KiB UTF-8 download, timeout 1–60 seconds. This is HTTP client support, not multiplayer networking. J serializes a small primitive/vector save object into project PlayerPrefs and reads it back.

## Input & Persistence API Lab

WASD/arrows/gamepad left stick move; Jump raises by one unit (not a physical platformer jump). J switches Space/Enter and saves binding; P increments/saves score; R resets pose. SavedScore's explicit PlayerPref binding keeps its stopped Inspector display consistent. MouseTravel accumulates mouse input; touches reposition the cube. Device coverage/limits remain as documented in M18.3.9; no repeat physical gamepad/touch validation is required for this release.
