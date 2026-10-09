# M4 ScriptRuntime integration

Status: all eight acceptance criteria passed. See
`docs/reports/M4_CURRENT_REPORT.md` for evidence and limitations.

## Current M17 extension (0.0.31)

Create physical C# files in Project or Create → C# Script; edit them in IDE.
Attach a Script/MonoBehaviour through Add Component class search or drag the
Project file onto Inspector. Source code is no longer edited inside Inspector.
Each entity stores up to eight scriptComponents `{path, values}`; total instances
remain bounded at 32. `scene.script.edit` takes id, expectedSceneRevision, entityId,
path, action (attach/remove/values), and values for a field update. Agent mutations
require workspaceId through the existing proposal route. Source edits/moves reconcile
metadata/references atomically; referenced deletion is rejected.

Public instance fields and private SerializeField fields have typed controls.
HideInInspector, ReadOnly/readonly, Title/Header, Space, Tooltip and Range control
visibility/editing/layout. Transform uses Vector3/Quaternion; float and integer
Vector2/3/4, Color/Color32, Rect, Bounds and Mathf are available. Vec3/Quat and Script
remain compatible. Metadata is a bounded field parser, not full compiler reflection;
computed initializers remain the C# constructor's responsibility. See ADR 017.

Separate physical sources compile inside fixed generated build templates, preserving
using directives and file-scoped namespaces. Play compiles changed sources; stale
daemon starts require compilation. Typed hydration and readonly snapshots are
verified in Linux development/AOT and Windows development. Snapshots affect runtime
only; Stop restores authored values. IDE buffers retain edits across tabs and saving
is explicit. M18 blocks compilation during Play; Auto compiles saved changes after
Stop. The next Play starts the new build. Explicit-source compilation remains
compatible while stopped.
Local scripts are user code, not a hardened boundary for hostile downloaded code.

The sections below preserve the historical M4 single-source contract.

## Developer workflow

Install .NET 10 SDK and `dotnet workload install wasm-tools`. Start the usual
`npm run dev` editor. Create/open a project, select an entity, edit `Game.cs` in
Inspector and choose **Compile & attach**. Play executes `Game.GameScript`.
The included example reads Transform, clones the attached entity at an offset,
logs lifecycle messages and moves the original with Left/Right arrow keys.
Keyboard input is ignored while typing in editor fields. Stop discards runtime
positions and spawned entities. Save persists source, attachments and build ID.

The historical M4 supported compilation during Play. M18 supersedes that policy:
compilation is stopped-only, including the daemon API. Auto defers saved changes
until Stop; compilation failure retains the previous good build. Runtime exceptions and two-second call timeouts stop the
worker, preserve authoring data and leave the editor responsive. Accepted source
edits remain undoable after Stop; runtime failure does not silently erase them.

## Generated contract and API

`protocol/schema/transform.component.json` is canonical component metadata.
`script-bindings.json` selects components and limits. Run
`node scripts/generate-script-bindings.mjs` to regenerate C# Transform fields and
runtime limits. `npm run check:bindings` rejects stale generated output.

The bounded M4 SDK provides `Script.OnStart`, `OnUpdate(deltaSeconds)`, `OnStop`,
`Entity.Transform`, `Entity.SetPosition`, `Entity.Move`, `Entity.Spawn`,
`Input.IsDown`, `Input.Axis`, and `Log.Info`. One GameScript type can be attached
to up to 32 entities through the protocol; the editor attaches to the selected
entity. Spawning clones an existing runtime entity, including its renderable.
It does not attach another GameScript instance automatically. Script fields and
static data reset on worker replacement. Arbitrary component reflection,
packages, multiple source files and managed state migration are not M4 features.

## Compilation authority

`script.compile` takes project ID, expected scene revision, source, attachment
IDs and mode (`development` or `aot`). It returns a job receipt. Poll
`script.job.get` or consume `script.jobFinished`; `script.job.cancel` cancels it.
The command token and exact Origin check remain required. Named capability
`script.compile.csharp` has fixed executable/argument templates, no shell and no
client-supplied paths, MSBuild files or packages. Fixed templates disable ambient
Directory.Build.props/targets and build servers. Only Game.cs is user authored.

Compilation occurs below the project UUID's `.scripts` directory. Files are
created exclusively; compiler output and manifests reject links, traversal and
non-ordinary files. Publication checks the captured scene revision. Project
switch/save is blocked during compilation; other edits make its result stale.
Job completion preserves the initiating correlation, trace and causation IDs.
The native daemon has the equivalent internal named compiler capability; its
HTTP surface remains M0-only and does not advertise editor/project commands.
The Node bootstrap remains the supported editor adapter.

Browser runtime files require a separate HttpOnly, SameSite=Strict cookie scoped
to `/script-runtime/`, established only by an authenticated handshake. Serving
also checks same-origin context and the active project's current build identity.
No bearer token is passed to the worker or placed in runtime URLs. Source and
MSBuild files are not served by that route. Preserve the complete project
folder, including `.assets` and `.scripts`, when moving a saved project.

## Runtime boundary and budgets

.NET runs in a disposable module worker, using `addEventListener` rather than a
global `onmessage` handler (dotnet/runtime#114918 sidecar detection). The host
passes bounded snapshots and accepts operation batches only for its generation.
All operations are validated before applying any to the runtime. Movement uses
Rust/Wasm `axiom_scene_position`; spawning recompiles the bounded draw instances.
GPU resources are replaced/disposed as needed. Authoring never receives Play
position or spawn operations. Frame diagnostics include generation, positions,
spawn count, fault and script round-trip latency. CPU elapsed frame timing also
includes asynchronous worker turnaround; it is not a CPU-utilization measurement.

Limits: source 64 KiB; compiler diagnostics 256 KiB; published output 128 MiB and
1024 files; each served file 64 MiB; 64 job receipts; one compilation per workspace;
180 seconds development / 600 seconds AOT; runtime startup 60 seconds and calls
2 seconds; 1024 entities; 64 spawns per generation; 128 operations and 32 logs per
call; 2048 characters per log; scene geometry 1024 draws / 300000 vertices.

Worker isolation protects responsiveness; it is not a hardened sandbox for
hostile downloaded code. The scope is local user-authored scripts. M4's AOT
foundation is measured on Linux CI, not a claim of production packaging or
cross-device performance. Build directories are retained for saved projects and
undo; automatic compiler-cache garbage collection remains a limitation.
