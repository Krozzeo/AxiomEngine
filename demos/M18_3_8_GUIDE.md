# M18.3.8 / 0.0.46 demos

Run `npm.cmd run demo`, then open **Demo · M18.3.8 Runtime API Lab** from the Hub. New demos preserve existing projects. The project compiles on opening and needs .NET 10 plus wasm-tools.

## Runtime API Lab

- Before Play, one authored cube is present. In Play a second runtime cube appears beside it. It is a recursive clone whose script component was removed programmatically, and it is parented to the original.
- Both cubes move together as the parent oscillates. This checks live parent/world transforms, cloning, dynamic component removal and descendant following rather than two unrelated animations.
- Select the original cube during Play. RuntimeApiLab exposes Speed, FixedTicks, Pulses, ScaledTime and RealTime. Speed controls oscillation; FixedTicks reflects real native fixed steps and Pulses advances through a coroutine.
- With Game focused, Space switches timeScale between zero and one. Oscillation, physics ticks and scaled coroutine pulses pause; RealTime continues. Space again resumes. The console receives a scheduled report every two scaled seconds.
- Stop removes runtime clones and restores the authored scene. No player demo is repeated.

## Agent visual inspection

With a connected vision-capable OpenAI model, ask: “Inspect the actual Scene and Game images using renderer.capture for each panel. Describe the visible objects and camera differences. Do not modify the project.” The agent receives real image content, not only entity metadata. Scene and Game can be captured independently without switching the active tab or starting Play. Visible UI panels such as hierarchy/inspector/project can also be captured; closed or hidden UI panels report unavailable.

Images cost model input tokens. Captures are bounded to eight per task and only the latest two images are submitted at once. More Info keeps capture identity, project/workspace revision, frame and dimensions, not a large base64 dump. Semantic scene checks remain preferable when pixels are not needed.

## Apply persistence

Ask for a small edit in an isolated preview, make any desired manual preview adjustment, then Apply. The accepted branch is saved automatically. Close and reopen: the accepted and manually adjusted preview state should remain. Diverged MAIN edits are replaced under the existing explicit replacement policy; the pre-Apply recovery snapshot is retained. A failed save leaves the proposal available and does not report successful Apply.

API scope and pending compatibility work: [BATCHES.md](../docs/scripting-api/BATCHES.md).
