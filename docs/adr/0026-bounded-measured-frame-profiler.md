# ADR-0026 — Bounded measured frame profiler

Status: accepted. Master specification section 132.

Keep lean transient frame history in the editor, bound to the active renderer
session. Expose identical observations to humans and semantic agents. Measure
synchronous main scopes, worker dispatch and sampled GPU passes separately;
retain elapsed intervals as a distinct metric. Delayed readbacks must carry exact
sequence/generation. Missing timestamps must never be represented as zero.

Use a median/MAD comparison against earlier compatible frames with at least eight
samples, and rank only measured scope increases. Histories are capped at 120 frames,
queries at 20 records/15,000 bytes and explanations at eight contributors/16 KiB.
One GPU readback prevents accumulating GPU buffers or synchronizing each frame.
Pause/Clear affect collection only. Project edits, Undo, Stop and private proposal
isolation remain canonical. See M13_PROFILER.md for coverage and limitations.
