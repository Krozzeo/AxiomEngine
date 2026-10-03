# M9 demos

Run `npm.cmd run demo`, then `npm.cmd run dev`. The generator creates six fresh
editable projects and preserves existing projects. Refresh Saved projects and open
one whose name starts with `Demo · M9`. No C# build is required for these two demos.

## PBR Lighting Gallery

Game shows the saved camera even while stopped. The 15 spheres vary metallic by row
and roughness by column. Select a sphere in Hierarchy or Scene, open PBR Material
in Inspector, change values and Apply. Undo restores the previous material.

Move the blue point light, change its intensity, or edit the spot cone. The Sun
casts shadows onto the floor. HDR Rendering controls exposure, ACES/Reinhard tone
mapping, bloom, edge smoothing and quality. The glowing sphere makes bloom visible.
Only the first requested directional/spot shadow light is used. Point shadows are
reported as unsupported while their light remains visible.

## Instancing and LOD Lab

144 cubes share geometry. The 24 objects far to the side are outside the game camera.
Diagnostics → Frame Diagnostics shows batches, culling reference, current geometry
LOD and source-frame GPU readback counts. Approximately 145 instances should produce
at most three batches, rather than one draw per cube.

The gold sphere has three authored meshes. Navigate Scene closer/farther or change
LOD switch distances in Inspector. Its silhouette changes at the thresholds; the
Game camera and saved transforms do not move when navigating Scene.

Switch HDR Rendering culling between CPU and GPU: the image should remain identical.
Low quality uses eight-light forward shading and disables bloom explicitly. Open with
`?renderer=null`: renderer decisions continue, but no GPU draws or pixels are claimed.

Play is unnecessary for these static rendering demos. Both projects can be changed,
saved, reopened and used as starting scenes. M7 physics and M8 editor demos remain
included. The automated browser suite checks the above behavior and records images.
