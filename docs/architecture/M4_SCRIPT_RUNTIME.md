# M4 ScriptRuntime integration contract (in progress)

M4 is not complete. Browser spike evidence is required before the SDK expands.

## Acceptance matrix

1. Generated C# bindings and capability-scoped, bounded daemon compilation.
2. C# reads Transform and moves a runtime entity through the Rust/Wasm boundary.
3. C# reads keyboard Input supplied by the editor.
4. C# spawns an entity without persisting it into authoring state.
5. Script component lifecycle and causal logs/errors work in Play.
6. Edit → compile → execute replaces a runtime generation without editor reload.
7. Compile/runtime failures retain authoring and preserve the last good build;
   stale handles/responses cannot mutate a replacement runtime generation.
8. Development build and release AOT foundation have executed, measured evidence.

## Proposed isolation

ScriptRuntime runs .NET in a dedicated module worker. The daemon compiles only a
fixed project template containing generated bindings, a fixed host and Game.cs.
Clients supply C# source and authoring entity IDs, not compiler paths/arguments,
MSBuild files, packages or filesystem paths. Processes have output/time limits,
a fixed working directory and cancellation. Compiled artifacts are immutable.

The browser supplies bounded entity/input snapshots and accepts validated output
operations. Worker code receives no daemon command token and no DOM access.
Worker replacement is the reload boundary; script static fields and runtime state
reset. Compile failure leaves the current runtime/build available. Play Transform
and spawn operations never write the authoring scene.

The scope is local, user-authored project scripts. Browser workers provide fault
isolation and responsiveness; they are not a claim of a hardened hostile-code
sandbox. Commands and bundle serving must retain project authority boundaries.
