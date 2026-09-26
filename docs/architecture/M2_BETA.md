# M2 beta implementation (0.0.12)

Status: complete; all eleven acceptance points passed in Chromium CI. See ../reports/M2_CURRENT_REPORT.md.

## End-to-end flow

Run `npm ci` once in the extracted project, then `npm run dev` (`npm.cmd` in
Windows PowerShell). Create a project, choose a PNG/GLB in Assets and Import asset,
then select it and Place selected asset. Hierarchy selects entities; Inspector
changes name, position and scale through Apply changes. Undo/Redo retain 64 edits.
Camera selects perspective (3D) or orthographic (2D). Save writes authoring data;
Close project and Open restore it. Play/Game compiles a fresh runtime copy;
Stop returns to authoring without persisting runtime state.

Preserve the whole `.axiom/projects` directory when upgrading snapshots, including
`<project UUID>.assets` folders. A project JSON alone does not contain its assets.

## Asset import contract

`asset.import` takes project `id`, `expectedSceneRevision`, display `name` and
canonical `base64` bytes. `asset.get` takes `id` and `assetId`. `scene.asset.place`
takes `id`, `expectedSceneRevision` and `assetId`. Import adds metadata to the
unsaved scene. Place creates a stable entity with a `renderable` component.
Unknown/unsupported files fail with AX_ASSET_0001; no external URLs are fetched.

| Resource | Supported in M2 | Limits |
| --- | --- | --- |
| Image | PNG with checked CRC and decode; sprite uses original pixels/alpha | 8 MiB source; 2048 × 2048 pixels |
| GLB | glTF 2.0 static triangle meshes; embedded buffer; indexed/non-indexed geometry; node TRS/matrices; base-color material; embedded PNG base-color texture; unlit extension | 8 MiB; 150,000 expanded vertices; 256 primitives; 16 textures |
| Scene | Sprite/mesh components, stable IDs, quaternion transforms, orthographic/perspective camera | 1024 entities/draws; 300,000 vertices; 128 asset records; 192 KiB document |

GLB sparse accessors, Draco/meshopt, skinning, morph targets, non-triangle modes,
external buffers/images and JPEG textures are rejected. Animations leave a warning
and import the static node pose; animation playback belongs to later milestones.
Normals are generated per triangle. M2 lighting is a fixed directional light plus
ambient contribution. This is simple shading, not the M9 production PBR renderer.
New placements are scaled/centered to fit the default camera; source data is unchanged.

Sources are stored atomically under content hashes, scoped to the project ID.
The scene retains `asset://sha256` references. Hash verification rejects damaged
files. Undo removes scene references; unused source files remain for future M3
asset garbage collection. Binary/expanded asset payloads are not retained in the
diagnostic event ring; retained asset.loaded events contain ID and kind only.
Import request allowance is 12 MiB; ordinary commands retain 256 KiB.

## Runtime and rendering

The importer lives in engine/assets and has no DOM dependency. The browser host
binds immutable asset geometry to GPU buffers; `axiom-core::authoring` and the
scalar Wasm bridge own runtime instances, persistent entity IDs, quaternion/model
transforms and camera projection. WebGPU receives Rust-produced matrices. The
real Rust Null Renderer counts the same compiled draw items and advances the same
engine clocks. Empty/no-project views contain no demo geometry.

Sprites use alpha textures, GLB materials use base color and optional PNG texture,
and both participate in depth testing. Camera matrices use WebGPU's 0..1 depth
range. Optional GPU timestamp queries and bounded CPU traces remain available.
Device loss falls back to Null. Limits and sampling are not performance guarantees.

Play is a Command Bus transition with revision checking. The server blocks edits
until Stop. The renderer creates a fresh Wasm world from a cloned authoring scene;
its clocks/resources are independent of the authoring document. M2 executes the
static 2D/3D scene; C# gameplay execution is M4, not claimed here.

The bootstrap Node daemon is the verified beta path. Native Rust daemon authoring
capabilities, general schema code generation, advanced importer features, material
editing and production resource streaming are not claimed by this beta.

## Verification

`npm run check` runs unit/integration/Wasm tests. `npm run check:native` runs Rust
formatting, Clippy and tests. `npm run test:browser` runs the eleven-step M2 flow
in Chromium with software WebGPU, verifies actual sprite/mesh pixel colors,
compares screenshots byte-for-byte after restart/reopen, checks Play isolation,
and checks Null item parity. Install its browser with
`npx playwright install --with-deps chromium` on a supported CI machine.
On Linux CI, install `xvfb xauth libvulkan1 mesa-vulkan-drivers` and run
`AXIOM_HEADLESS=false xvfb-run -a -s "-screen 0 1440x1000x24" npm run test:browser`.
This uses a virtual display with software Vulkan; physical GPU performance is not measured.
Evidence is written to `.axiom/browser-evidence` and uploaded by CI.

GLB interpretation follows the Khronos glTF 2.0 specification:
https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
