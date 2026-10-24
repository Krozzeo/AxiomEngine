# M18.3 — PMD and prefab Players

Run `npm.cmd run demo:m18-3`, then `npm.cmd run dev`. Five new projects are saved; existing projects are preserved. C# Players require .NET 10 SDK and wasm-tools. Scripts are physical files under Scripts/Players, sources editable in IDE, fields adjustable on their prefab instances.

## PMD Planning Workshop

Open the project, then click the PMD indicator or AI → Project Master Document. The panel starts closed in the center. Read the deliberately incomplete brief and clarification child section. Expand/collapse or follow section links. Drag the chat/document divider. Configure a tested OpenAI connection to ask the PMD assistant to refine the brief; no automatic paid requests occur when creating demos.

Try: “Aclara este proyecto con preguntas breves y recomendaciones. Conserva el brief importado y registra decisiones, supuestos y preguntas pendientes.” Review the proposal; human buttons approve definition and milestone planning. Optional critical analysis prepares a prompt for the chat. Skip it or finish the round, then request linked final sections and explicitly finalize. Manual sections/metadata editing works offline. Export produces multiple linked Markdown files plus a round-trip JSON manifest in ZIP. Import previews extracted TXT/MD/JSON/DOCX/PDF before acceptance; scanned PDFs need external OCR. Layout, tables and diagrams are not preserved faithfully. Restore a bounded history revision; delete requires confirmation. Save MAIN before requesting another edit outside preview.

## Four Players

3D First Person: click Game during Play to capture the pointer. WASD/arrows move relative to view; mouse looks; Space jumps when grounded. Escape releases browser pointer lock. Head camera belongs to the capsule.

3D Third Person: same movement/jump inputs. Mouse orbits the child camera; character faces movement. CameraDistance, CameraHeight, MouseSensitivity, Speed and JumpSpeed are Inspector fields. The orbit camera does not yet avoid obstacles automatically.

2D Platform: square with horizontal A/D or arrows; Space grounded jump. Existing scene camera is used. 2D RPG: square with normalized WASD/arrows top-down movement, gravity off and no jump. Neither 2D preset creates a camera.

Both 3D presets currently use a box physics proxy around the visible capsule; capsule collision shape, stairs/slope controller and camera occlusion correction are future work. Audio components contain a silent replaceable WAV placeholder, not an audible sound demo.

Create → Players instantiates a linked prefab. Linked root/original descendants are blue. Root placement and script field values are instance overrides; original children/components are locked. Add new children freely. Right-click → Desassemble removes the entire instance link; Undo restores it. Drag a Hierarchy root to a Project folder to create `.prefab.json`; drag that file to Scene/Hierarchy to instantiate it. Internal entity references are remapped; external entity references are rejected. Prefabs are reusable within their project, not standalone cross-project dependency packages. Editing prefab definitions and automatically propagating source changes to existing instances is not an editor workflow in this delivery.

## Manual account-specific checks

Use your actual OpenAI model for question quality, critical analysis and a targeted section redesign; inspect token usage and preview before Apply. Controlled CI responses verify transport/isolation, not live model quality or billed cost. Physical pointer lock and mouse comfort on your Windows/browser are useful feedback; keyboard/controller behavior is tested by the real C# browser worker in CI.
