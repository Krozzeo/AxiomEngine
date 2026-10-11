# M18.3.1 demo guide

Run `npm.cmd run demo`, then `npm.cmd run dev`. Open the new projects labelled M18.3.1. Existing projects are preserved. Open the newly generated M18.3.1 demos to test the corrected controller sources and root hierarchy; physical scripts in previously saved projects keep their existing content. .NET 10 SDK and wasm-tools are required for the four physical Player scripts.

- **PMD Planning Workshop**: open PMD, read/expand linked brief sections and drag the divider. Document contains import/export, history and editing operations. The chat composer expands to ten lines. Assisted requests require your configured OpenAI account; demo creation makes no paid requests.
- **3D First Person**: Play, click Game to capture mouse; WASD/arrows move, mouse looks, Space jumps, Escape releases capture. Turn 180 degrees: view follows the body, without looking back at its neck. Repeat with Game detached while Scene stays visible. Stop releases capture.
- **3D Third Person**: same movement/jump; mouse orbits. The root gradually faces movement. Adjust TurnSpeed and Freeze rotation in Inspector. Orbit does not yet avoid obstacles automatically.
- **2D Platform**: A/D or left/right move, Space jumps when grounded. The square is a Graphics child; the scene camera is separate.
- **2D RPG**: WASD/arrows move top-down, normalized diagonals, no gravity/jump. The scene camera is separate.

Players created from Create are ordinary instances: empty root plus Graphics, Camera (3D), controller, collider, rigidbody and audio. Their properties/children are editable. To make a prefab, drag a root into Project, then instantiate its .prefab.json. Originals become blue/locked; additions can only follow original children. Right-click Desassemble restores free editing. Double-click the prefab JSON opens IDE, without a Project JSON preview.

Select Camera or Directional Light in Scene to inspect the forward arrow. Audio Source uses a silent placeholder until replaced; runtime controls sit inside the component card. Capsule collision still uses a box proxy; advanced slopes/stairs and third-person obstacle avoidance remain future work.

Only real-account model quality, live token cost and physical mouse comfort on your machine require user feedback; automated CI covers the deterministic controls and workflow.
