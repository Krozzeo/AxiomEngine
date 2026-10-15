# M18.3.7 demos

Run `npm.cmd run demo`, then open the named project from the Hub. Existing projects are preserved. No player demos are recreated by the default command.

## Scripting API Lab

A blue starter cube and a small overlapping pickup demonstrate the new C# surface. Opening compiles its physical `Scripts/ApiCompatibilityProbe.cs`; a configured .NET SDK and wasm-tools are required.

Play runs the probe: it verifies GetComponent and named lookup, moves the cube, toggles the pickup, creates/destroys a clone, queries a ray and checks the active camera. On the first reported trigger contact it removes the original pickup. The cube then gently oscillates vertically. Space writes a keyboard-edge message to the console. Inspector shows Frames and TriggerVerified; Speed changes oscillation speed. Stop restores authored state. Help → Scripting API opens searchable documentation, declarations, examples and compatibility caveats. This demo exercises the implemented subset, not all Unity APIs.

## PMD Planning Workshop

Use a connected model to define the supplied ambiguous puzzle. Reads need no approval; before document changes the agent shows a plan and waits once when Require confirmation is ON. Approve through chat. Proceed through definition/planning, optionally skip critique, and request construction. Watch actual phase and section content, not only chat claims.

Select sections in the left tree; read/edit Markdown on the right. Save or Ctrl+S commits the section. Right-click blank space/root to create a root section, or a section to create its child. Drag onto a section to parent it, or near the top edge of a row to insert before it. Export includes a hierarchy-only index. Unsaved editor text must not disappear during agent progress updates.

## Agent Workflow Lab

The existing cube/floor milestone fixture remains available. Start with the blue-cube/floor prompt or four-wall task. With Require confirmation ON, verify no scene change happens before the plan is approved. Toggle OFF for automatic execution after plan presentation. MAIN remains separate from the editable proposal until Apply.

Follow up with a question requiring the same SDK knowledge. More Info should show retained conversation/evidence and actual tool use; reuse is not a promise that current scene facts never need rechecking. For an unavailable API, the final response must identify the limitation instead of repeatedly searching.

Manual live-model checks are still needed for the two supplied failure scenarios, conversation quality and actual usage. Automated controlled adapters cannot prove those model-dependent outcomes.
