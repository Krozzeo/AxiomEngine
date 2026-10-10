# M18.2.1 — Script efficiency and preview UX correction

Version 0.0.37. Implementation and local verification complete; full CI and real compiler/browser acceptance pending. This correction adds no roadmap weight: overall expanded MVP remains approximately 88% (111/126).

## Root cause and corrections

The user's unsuccessful sine task spent **425,505 provider-reported tokens across 99 requests**: 411,872 input (332,521 cached; 79,351 uncached), 13,633 output, of which 5,401 reasoning. Repeated input and tool turns dominate; this is not evidence of exponential growth or a pricing calculation. The authored script called nonexistent `Entity.Transform.SetPosition`; Transform is a readonly snapshot and the actual write API is `Entity.SetPosition(Vec3)` with implicit Vector3 conversion.

The assistant now receives that SDK/lifecycle/file/attachment contract, can read bounded actual SDK source, waits for compilation in the host rather than issuing model polling turns, and returns bounded terminal build metadata/diagnostics instead of framework manifests. Changed physical sources must compile successfully before task completion; a failed build cannot be labelled completed. Repeated identical tool results and long discovery loops stop locally. Context checkpoints retain current compilation evidence and only recent steps.

Preview remains accessible outside preview for a pending branch; Exit preview identifies the active view. Apply preserves panel focus. More info contains review/recovery/history. Config supplies persistent Limitless for all five local caps; null removes only that configured cap. Walking skeleton UI is removed; protocol regression commands remain supported.

## Validation

Local acceptance covers SDK source lookup, repeated-read termination, unbuilt-source rejection, host compilation wait/failure gating, unlimited persistence/provider request construction, existing budget/resume/branch contracts and all previous non-server tests. Full CI includes a new real .NET compilation and browser runtime test of physical CubeSineMotion, attachment, range/travel measurements and the exact CS1061 failure gate.

Controlled response counts and serialized bytes are not live model tokens/cost. No live reduction is claimed until the same-model comparison. See demos/M18_2_1_GUIDE.md. Next milestone remains M18.3 Assisted PMD.
