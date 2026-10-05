# M14 demos — 0.0.27

Run `npm.cmd run demo`, then `npm.cmd run dev`. Existing projects are preserved.
.NET 10 / wasm-tools compile the controller. If unavailable, Frame Step Lab falls
back to entity-count assertions and honestly reports compilation status; it cannot
prove C# movement until regenerated with a working compiler.

Open **Demo · M14 Frame Step Lab**. You see a cube and a Game camera. During ordinary
Play, focus Game and use left/right arrows. Stop before running automated suites.
In **Config → Game Tests**, the PASS suite holds ArrowRight for exactly 30 frames
and checks position `[1,0,0]` using the real C# controller. Run twice to compare.
Begin paused starts at frame zero; Step plan first block advances exactly 30
frames, then pauses. Finish restores the authored scene. The FAIL suite deliberately
expects 999 entities and must fail. VISUAL samples the Game background; WebGPU
provides actual pixels, while `?renderer=null` must report unavailable pixels.
Results show actual/expected values and exact assertion frames.

Open **Demo · M14 Collision Assertions**. Ordinary Play drops a cube on a floor.
Its PASS suite steps 120 frames and checks a real non-trigger collision plus two
runtime entities. Scene edits remain unchanged when tests finish or are cancelled.

Open **Demo · M14 Animation Assertions**. The imported animated GLB runs Idle.
Its PASS suite checks real animator state and the entity’s base quaternion after
120 frames. FAIL deliberately expects Wave and must report the actual Idle state.

To compare cameras, select Game and use its separate-window icon: Scene remains in
the main window while Game renders in the popup. Focus Game for gameplay arrows.
Both views observe the same falling objects/controller; only cameras differ. Close
the popup to return its tab. Drag tabs to reorder or move sections; X closes one
and Panels reopens it. Project is first by default; Config reset restores layout.
The save icon before File displays * after scene edits; Ctrl+S clears it only after
successful save. Create offers implemented modular examples; grey planned entries
are not implemented features.
