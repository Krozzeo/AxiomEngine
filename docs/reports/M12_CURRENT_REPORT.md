# M12 — Audio closure

M12 (0.0.24) is complete: 8/8 acceptance groups, 100%; weighted project progress is approximately 75%.
Optional AudioSource/AudioListener, spatial pan and attenuation, mixer buses,
lowpass filters and master dynamics work through Web Audio. Long PCM WAVs stream
through bounded AudioWorklet queues. Human/C#/AI runtime controls are transient;
canonical editing preserves revisions, Undo/Save and isolated proposals.
Stopped previews are silent. Scene and simulation pause preserve transport;
Stop resets it. Null and browser activation expose truthful unavailable reasons.
All 21 jobs in CI run 37245601863 pass at executable commit
aef19432107a017de935319f94d443390972aed1 (tree 178e257f6ffc86e5d1909b274d9a0462c031c6de).
144 Node and 39 Rust tests, ten new browser criteria and earlier regressions pass.
Actual graph signal, stereo pan, pause, streaming and lowpass were measured.
Final screenshots were reviewed. No user-only test remains.
Read docs/reports/M12_CURRENT_REPORT.md, docs/architecture/M12_AUDIO.md,
ADR-0025 and demos/M12_GUIDE.md. Next: M13 profiler/explainFrameSpike.
PR #14 is ready for review, stacked on unmerged #13; do not merge automatically.

## Acceptance

| Group | Status | Evidence |
| --- | --- | --- |
| Canonical PCM resources and budgets | Passed | four integer depths, mono/stereo, bounded ranges and immutable resources |
| Transport and lifecycle | Passed | buffer/worklet pause, resume, one-shot completion, Scene silence and Stop reset |
| Listener and spatialization | Passed | world transforms, inverse attenuation, measured stereo pan and C# movement |
| Buses, mixing and effects | Passed | transient controls, muted output with live transport and measured lowpass attenuation |
| Bounded streaming | Passed | actual 90-second stereo WAV, bounded refills/queue and pause-preserved cursor |
| Human/C#/AI control and diagnostics | Passed | Inspector/keyboard/API, exact leases, activation and truthful Null |
| Persistence and proposals | Passed | atomic validation, Undo/Save/reopen, reviewed acceptance and packet validation |
| Demos, regressions and closure | Passed | two editable demos, 21/21 CI, screenshot review, benchmark and synchronized docs |

## Automated evidence

https://github.com/Krozzeo/AxiomEngine/actions/runs/37245601863

144 Node tests pass on Windows/Linux. 39 Rust tests, fmt, Clippy with warnings
denied, core Wasm check and release build pass. 16 schemas, 76 semantic tools,
generated C# bindings, three architecture rules and daemon parity pass.
Ten browser criteria cover stopped preview, Inspector/Undo, measured stereo pan,
C# pause/movement, AI controls/Scene/Stop, actual streaming/refills/memory/pause,
one-shot completion, lowpass attenuation, Null and browser activation.
The activation case uses CDP without userGesture; ordinary Playwright evaluation
grants activation and is unsuitable for this case. Page/console/HTTP errors and
editor/renderer diagnostics are empty. M2–M11/correction regressions and
Windows/Linux development/Linux AOT C# pass. Final spatial, streaming, Null and
activation screenshots were reviewed. Adjacent JSON retains exact source provenance.
The canonical PCM render/resample loop used by AudioWorklet has p95 0.024/0.012/0.054 ms
at 1/8/32 stereo voices per 128-frame quantum. Queue storage is 128 KiB / 1 MiB /
4 MiB. This meets the 50 ms software-host admission threshold and excludes
asset I/O, browser scheduling, physical output and full-frame performance.
Closure changes documentation/evidence only after executable CI acceptance.

## Manual tests

None required. Equivalent automation measures graph signal, pan, effects,
controls, pause/completion, persistence, proposals, activation and Null.
Physical speaker connectivity, hardware performance and device latency are not
acceptance claims. The demos can be explored without a release gate.

## Demos and limits

Run npm.cmd ci, npm.cmd run demo, npm.cmd run dev. Open M12 via Archivo → Proyectos.
Spatial Sound Stage has arrows and keys 1–5 through its optional C# controller;
Inspector buttons also work. Streaming Mixer Lab has 90-second stereo music and
a one-second manual effect. Ajustes → Audio mixer exposes buses and controls.
See demos/M12_GUIDE.md. Preserve complete .axiom/projects including assets/scripts;
repeated generation creates copies and preserves existing projects.

PCM WAV only, 8 MiB source limit, 600-second ceiling, 32 sources, eight buses,
one enabled listener, mono spatial sources. Buffered resources are limited to
30 seconds / 4 MiB each and 16 MiB total; longer clips require stream. Each queue
has 16384 frames and reads at most 4096 frames. The daemon reads/verifies the
bounded immutable source for each range; this I/O is outside the DSP benchmark.
No compressed codecs, network radio, arbitrary plug-ins, reverb/occlusion,
editor audition, streaming seek or sample-accurate cross-voice synchronization.
Native daemon authoring remains M0; full authoring uses the Node bootstrap.

M12: 100% (8/8). Approximate weighted project completion: 75% (72% + 3%).
Next: M13 profiler/explainFrameSpike (planned, 0%). PR #14 ready, stacked on #13, unmerged.
