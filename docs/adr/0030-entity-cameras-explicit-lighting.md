# ADR-0030 — Entity cameras and explicit lighting

Accepted contract, M15 (0.0.28); browser acceptance passed; see the milestone report.

Camera is an optional entity component: active, projection, vertical FOV and
orthographic height. Position and rotation come from the hierarchical Transform;
scale does not change viewing direction. Create → Camera includes Audio Listener.
Camera settings live in the selected entity Inspector; File has no Game Camera.
Only one active Camera is admitted. Activation deactivates other cameras and their
listeners. A scene using entity cameras with none active has an empty Game view;
Scene navigation stays independent. Game and a detached Game render target use the
same resolved camera, without starting Play or creating another simulation.

New human projects choose 3D or 2D. 3D contains Cube, Camera + Audio Listener, and
Directional Light, with zero environment illumination. 2D contains a Square PNG
sprite, orthographic Camera + Audio Listener, and 2D Light, with zero ambient.
Create → 3D/2D Objects directly lists geometry. Empty is an advanced template;
omitting dimension in the low-level project.create API preserves its old empty
contract. Old scene-level camera documents remain readable until Create Camera
or adding the Camera component opts into entity-camera mode. Legacy camera.update
is retained only for compatibility clients, and targets the active Camera in the
new mode. New authoring never stores a second global Game camera.

Remove the legacy shader's fixed sunlight and ambient term. Lit legacy meshes use
only up to eight authored directional components, with directions resolved through
world rotation. HDR uses authored lights plus its independently configurable RGB
environment. Unlit materials/sprites retain their intended independent visibility.
A light-free scene is not automatically illuminated. Older light-free mesh projects
may need a Directional Light; this is intentional, not a new hidden default light.
M15 demos include explicit cameras/lights. Pixel-perfect 2D still requires XY-facing
orthographic cameras; its reference-height/pixels-per-unit settings determine the
rendered orthographic extent. Disable pixel perfect for free camera rotation/zoom.

Save, revision checks, Undo/Redo, component remove, scene tools, public API query
and schema validation apply to Camera as to other components. Replay records these
entities as authored state and invalidates on scene mutation.
