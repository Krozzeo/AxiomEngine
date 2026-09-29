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
