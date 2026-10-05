Read the completed M13.1 correction contract and current report first; preserve
saved capture isolation, independent dock tabs and explicit lease release.

# M14 — Automated Game Testing

Status: planned, 0%. Roadmap weight: 4 points. Master specification section 133.

Begin after M13 synchronized acceptance closure. Read the master, architecture
manifest, M13_PROFILER.md / ADR-0026, current report and M7/M11/M12 contracts.
Inventory RAF, worker, physics/animation/audio and generation ownership before
introducing stepping or synthetic input. Preserve real stopped Game previews.

Implement simulation input, frame stepping, deterministic mode, screenshot,
collision and runtime-state assertions. Agents must author and execute tests through
bounded public tools, rather than private DOM/renderer shortcuts. Use stable IDs,
exact project/workspace revisions, bounded execution budgets and explicit failures.
Separate deterministic simulation assertions from GPU/browser/hardware-dependent
visual tolerance. Null must report unavailable pixels, never pretend rendering.
A test must never mutate authored MAIN data or leak live input/sessions after
completion/cancellation/error. State the scope of deterministic guarantees.

Provide human test controls, editable test/demo projects, known passing and failing
assertions, actual browser gameplay acceptance, all earlier CI regressions and
full documentation/source ZIP/ready-unmerged-PR closure. Ask only for tests that
cannot be equivalently automated. Do not begin M15 replay in this milestone.
