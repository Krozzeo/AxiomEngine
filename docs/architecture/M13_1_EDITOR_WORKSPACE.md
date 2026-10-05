# M13.1 — Editor workspace corrections before M14

Five fixed docking sections retain the existing default arrangement. Every editor
tab is independently draggable, including Scene/Game; tab groups activate one
panel per section. The engine retains one active interactive viewport, selected
by its Scene/Game tab. This correction does not introduce concurrent camera
rendering or a second gameplay simulation.

Dock configuration extends optional project.editor.docks through canonical
project.editor.update, preserving the saved scene, authoring revision and undo
history. Native daemon authoring remains M0. Resizers retain their existing bounds;
top and bottom share the bottom height setting. Reset is explicit. Child windows
use same-origin adopted DOM nodes and existing handlers through a document facade:
one renderer, script lifecycle and editor bridge lease. A child is a dependent
control surface, not an independently authenticated editor. Closing returns its
nodes. Main pagehide closes children; saved layouts do not automatically reopen
windows. Non-form keyboard events are forwarded to the owning editor window.

Profiler.reset archives immutable copies with exact project/workspace/revision/
generation, before clearing the active history. Old GPU callbacks cannot attach
to an archived session. Eight archives and 120 normal records per session are
bounded; capture import caps 240 records, 1MB, scope counts, finite nonnegative
measurements and provenance equality. Historical explanations use a separate
FrameProfiler reader and the capture's original lease, never current semantic
requests. Live semantic queries preserve their existing strict lease contract.
The UI persists eight captures in origin-scoped browser storage and offers
validated JSON import/export. Storage-denied/quota conditions retain in memory;
export provides a portable durable copy. Only explicit Clear affects live history.

The bootstrap credential is removed from the hash and retained in per-tab
sessionStorage. A new bootstrap URL replaces it; daemon restart invalidates it.
Authenticated pagehide disconnect releases the old editor lease; bounded tombstones
reject late reports from that client. New tabs retain distinct renderer lease IDs.
The credential never enters project layouts or profiler exports. Startup invokes
rundll32 URL handler on Windows, open on macOS or xdg-open on Linux, without a shell.
CI, AXIOM_OPEN_BROWSER=0 and --no-open disable automatic launch; failures preserve
the printed authenticated link.

M14 remains planned and is not implemented by this correction.
