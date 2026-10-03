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
Each invocation creates two new projects with fresh IDs, preserving existing
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

In Saved projects select a demo and click Open, then Play. Click the viewport
before using the keyboard. Stop restores the authored positions.

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
