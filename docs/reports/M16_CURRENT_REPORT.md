# M16 — Performance & Low-End Pass and editor authoring

Version 0.0.29. Implementation is in acceptance, not yet a completed release.
M15 remains the verified baseline, approximately 84% (87/104 roadmap points).
Required groups and final executable CI evidence are tracked in M16_PLAN.md.
No unexecuted browser/platform check is reported as passing.

Portable authoring files, scoped context menus/clipboard, Inspector autocommit,
consistent list menus, named C# templates, explicit scale and actual Game FPS are
implemented. Two editable demos are documented in demos/M16_GUIDE.md. Performance
work indexes/virtualizes hierarchy, caches Wasm modules with fresh memory/worlds,
reuses 253,952 bytes of GPU staging and bounds queued submissions on slow adapters.
Retained shader/asset caches and C# Development/AOT behavior are regression gates.
See M16_AUTHORING_AND_PERFORMANCE.md and ADR-0031 for exact contracts and limits.

Before closure: pass all 26 jobs, review final screenshots, save actual benchmark
and browser reports, update state/handoff/counts/percentages, mark PR #19 ready while
keeping it open/unmerged, and build a complete source ZIP from the closure tree.
