# M12 — Audio foundation

Status: planned; implementation not started. Roadmap weight: 3%.
Master specification sections 39 and 131.
Begin after full M11 acceptance and synchronized closure. Read the master,
M11_ANIMATION.md / ADR-0024, M6_WORKSPACES.md, asset import contracts,
M8_DIAGNOSTICS_AND_EDITOR.md and the current report first.

Implement bounded audio sources, listener, spatialization, buses, mixing,
streaming and observed diagnostics. Reuse the immutable asset pipeline and
normal project/component APIs. Define formats, byte/voice budgets and streaming
semantics before implementation. Playback follows Play/pause/Stop and independent
Scene/Game routing; stopped preview does not silently begin audio. Browser audio
activation and unsupported devices must produce explicit reasons, not false
playing evidence. Null provides truthful semantic state without claiming sound.

Human Inspector controls and AI tools share schemas, revisions, Undo/Save and
M6 isolated proposals for authoring. Runtime play/pause/volume actions remain
transient. Queries expose observed source/bus/listener state and
whyAudioNotPlaying with bounded provenance. Keep animation, physics, C# input,
2D/legacy/HDR rendering and old saved projects compatible.

Include editable demos through canonical commands, automated real browser audio
and control acceptance, protocol/proposal/persistence tests, bounded measurements,
all earlier CI regressions and complete documentation/state/handoff/changelog.
Request human checks only for sound behavior that cannot be equivalently measured
or automated. A plan alone earns no implemented progress.
