# Demo projects

These are editable projects using the normal importer, scene commands, compiler
and persistence paths. No special demo-only rendering or physics is used.

From the extracted milestone directory on Windows:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

Requirements: the normal Node/Rust toolchain plus .NET 10 SDK and wasm-tools
(`dotnet workload install wasm-tools`). Demo creation compiles the 2D C# controller.
Each invocation now creates four new projects with fresh IDs, preserving existing
projects. Keep the entire `.axiom/projects` directory when moving projects.

The M7.1 generator saves both complete scenes before compiling C#. If compilation
fails, it prints the cause and keeps both projects available: physics still runs,
but the 2D keyboard controller is not attached. After resolving the reported
compiler error, rerun `npm.cmd run demo` to create a fresh pair with the controller.
Select projects ending in `(M7.1)`; an empty project left by the older generator
is preserved and does not become populated by Refresh List. Refresh only lists
projects already saved on disk.

On Windows the compiler resolves `dotnet.exe` from PATH, `DOTNET_ROOT`, or the
standard Program Files/user installation directories. PATH keys with different
casing are combined before spawning. If the process cannot start, its error now
includes the executable and working directory; it does not imply that the SDK
or wasm-tools workload is absent.

In Saved projects select a demo and click Open. Physics demos use Play; Scene
Workshop is an editing demo and works while stopped. Click the viewport before
using keyboard controls. Stop restores the authored positions. `npm.cmd run demo:m7`
creates only the two physics demos.

- **2D Physics Playground:** mint player, amber pushable crates, platforms and
  a violet trigger zone. Move with arrows or A/D; Space jumps when vertical speed
  is near zero. Inspect collision/trigger contacts in Frame Diagnostics. This is
  a simple sample controller, not a production grounding/character system.
- **3D Falling Blocks:** imported GLB blocks, perspective camera, depth/lighting,
  static foundation and dynamic contacts. Edit masses, dimensions, transforms or
  collision masks in the Inspector, then run again.

Both demonstrate imported resources, scene hierarchy, inspector authoring,
undo/redo, save/open and isolated Play. The first also demonstrates generated
C# velocity bindings and keyboard input. AI proposal tools can edit these same
projects through the M6 review workflow.

## M8 Scene Workshop

Open this project while stopped. Select Move me, Rotate me or Scale me either by
clicking its geometry or its Hierarchy button. Use W/E/R and drag the colored
handles/rings. Try Undo after each drag and Escape during a drag. The center scale
handle scales uniformly. Switch World/Local orientation.

Use F to frame a selection, Alt + left drag to orbit, middle drag to pan and wheel
to zoom. Hold right mouse and WASD/QE to fly in 3D. Click the bottom-left XYZ axes
and switch Ortho/Persp. In 2D, right drag pans.

Switch Game without Play: it previews the saved game camera. Navigate Scene again
and return to Game; the game view must remain unchanged. Play/Stop are independent.
The cyan sprite and four imported mesh blocks exercise mixed 2D/3D picking.

## M8 Diagnostic Lab

Open Diagnostics beside Structured Console. Select a named case and Explain selected:

| Case | Question | Expected result |
| --- | --- | --- |
| Invisible | whyNotRendered | No Renderable component |
| Outside camera | whyNotRendered | Outside camera clip planes (do not F-frame it first) |
| Mask 0 + Overlap partner | whyNotColliding | During Play, layer/mask rejects the pair |
| No Collider + Overlap partner | whyNotColliding | Missing Collider |
| No script attached | whyScriptNotRunning | No compiled attachment |
| unused-asset.png selected in Assets | whyAssetNotLoaded | No load requested because no drawable references it |

The second-entity selector supplies the collision partner. The decision path and
JSON evidence show stable reason codes and frame/command lineage. Frame diagnostics
contains actual contacts/triggers. Deep trace retains at most 32 sampled frames
for 30 seconds; copy a returned traceId into the optional field to inspect it.
Unavailable/expired/stale evidence is reported explicitly. Submitted geometry
inside the camera frustum is inconclusive about pixel visibility, by design.

Each future milestone should include useful editable demos for its new functions,
covered by automated acceptance rather than special demo-only engine behavior.
