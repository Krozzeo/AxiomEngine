# M13 — Profiler and explainFrameSpike

Status: planned, 0%. Roadmap weight: 4%. Master specification section 132.

Begin after M12 acceptance and synchronized closure. Read the master, architecture
manifest, M12_AUDIO.md / ADR-0025, M12 report, FrameProfiler and M8 causal diagnostics.
Inventory existing CPU scopes, delayed GPU samples and frame/generation lineage.
Define bounded history, timestamp availability and comparison windows first.
Implement structured CPU profiling, GPU timestamp instrumentation, frame metric
history, anomaly comparison, top contributors and explainFrameSpike(frame).
Human Profiler controls and agent queries must expose the same observed evidence.
Do not represent unavailable/disjoint timestamps as zero or infer unmeasured causes.
Preserve bounded opt-in deep traces, Null, audio, animation, rendering, C# and
proposal workflows. Artificial known regressions must prove correct attribution
and unavailable evidence. Include an editable profiling demo, real browser
acceptance, bounded measurements, all earlier CI regressions and full closure.
Request user-only checks only when equivalent automation cannot prove the behavior.
