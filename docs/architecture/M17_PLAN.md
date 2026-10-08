# M17 — Advanced Assets / CAD

Status: complete, 12/12 acceptance groups, 100%. Version 0.0.31. Master section 136.
Weighted project completion: 94/104, approximately 90%.

OBJ/STL/STEP/IGES use the bounded immutable source/build/dependency pipeline.
CAD tessellation, units/orientation, cleanup/normals, generated LODs and box collision
are executable. The collision/static-CAD scope is recorded in ADR 017.
This release also completes physical C# components, typed Inspector metadata,
multi-tab IDE authoring and the requested UX corrections.

Acceptance, executable commit/tree, CI evidence and limitations:
../reports/M17_CURRENT_REPORT.md. Demo controls: ../../demos/M17_GUIDE.md.
Architecture: ADR-017-CAD-AND-SCRIPT-COMPONENTS.md; licensing:
../../THIRD_PARTY_NOTICES.md. PR #21 stays ready/open/unmerged on #20.
Next: M18_PLAN.md; autonomy implementation has not started.
