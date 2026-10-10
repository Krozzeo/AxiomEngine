# M18.2.1 — Script efficiency and preview UX correction

Version **0.0.37**, badge **M18.2.1**. Complete: **6/6 acceptance groups, 100%**. CI **219** passes **all 32 jobs**, including the corrected M14 cancellation check, on executable commit `300d47405ee9bc0ec1c99e9dc131dd4733686831` (tree `761052eef1d16c1ea821b271a74a0c3f0c9a30eb`). PR #27 remains draft/open/unmerged, stacked on #26. This correction adds no roadmap weight: overall expanded MVP remains approximately 88% (111/126).

## Root cause and corrections

The user's unsuccessful sine task spent **425,505 provider-reported tokens across 99 requests**: 411,872 input (332,521 cached; 79,351 uncached), 13,633 output, of which 5,401 reasoning. Repeated input and tool turns dominate; this is not evidence of exponential growth or a pricing calculation. The authored script called nonexistent `Entity.Transform.SetPosition`; Transform is a readonly snapshot and the actual write API is `Entity.SetPosition(Vec3)` with implicit Vector3 conversion.

The assistant now receives that SDK/lifecycle/file/attachment contract, can read bounded actual SDK source, waits for compilation in the host rather than issuing model polling turns, and returns bounded terminal build metadata/diagnostics instead of framework manifests. Changed physical sources must compile successfully before task completion; a failed build cannot be labelled completed. Repeated identical tool results and long discovery loops stop locally. Context checkpoints retain current compilation evidence and only recent steps. Scene-only tasks omit full C# contracts, and the function enum supplies tool names once instead of repeating a second roster. On the same controlled Workshop schedule, serialized request payload is 29,837 bytes versus the M18.2 35,612 bytes (16.2% less); both use three requests. This measures bytes, not live tokens/cost.

Preview remains accessible outside preview for a pending branch; Exit preview identifies the active view. Apply preserves panel focus. More info contains review/recovery/history. Config supplies persistent Limitless for all five local caps; null removes only that configured cap. Walking skeleton UI is removed; protocol regression commands remain supported.

## Validation

Local acceptance covers SDK source lookup, repeated-read termination, unbuilt-source rejection, host compilation wait/failure gating, unlimited persistence/provider request construction, existing budget/resume/branch contracts and all previous non-server tests. CI passed **268 Node tests on both Linux and Windows**, **39 Rust tests**, 18 schemas/88 public semantic tools, all 23 browser milestone jobs and C# Linux development/AOT plus Windows development. The 33 assistant regressions include limits/resume/no-progress/SDK/compiler/completion tests. A new real .NET compilation and browser runtime test passed, covering physical CubeSineMotion, attachment, range/travel measurements and the exact CS1061 failure gate.

Controlled response counts and serialized bytes are not live model tokens/cost. No live reduction is claimed until the same-model comparison. See demos/M18_2_1_GUIDE.md. Next milestone remains M18.3 Assisted PMD.

An inherited M14 cancellation check raced a 600-frame run against a later cancel request. CI 218 exposed completion winning that race. The acceptance now begins an interactive test, confirms pause after 120 real C# frames, then cancels and verifies cleanup/authoring isolation; it no longer assumes a run lasts longer than a transport round trip.


## Evidence and practical limits

The six new browser groups pass with zero page errors. The controlled Responses adapter required three requests and four semantic calls to create/write/compile/inspect, while the compiler and browser .NET worker were real. Seventy runtime samples measured Y=1.000526471942035…1.999475254108211. The intentionally invalid Transform.SetPosition build produced real CS1061 diagnostics and a failed task; a false final success message was withheld.

Both current screenshots were downloaded, SHA-256 verified and visually reviewed. CI219 artifact `milestone-browser-evidence-m18-2-1`, ID `11683953358`, digest `sha256:9db9a4be3fca36496b2a9c596095832dba2cceec8b209e0837e61bec45287e19`, contains report.json, real-sine-runtime.png and failed-build-gate.png. Evidence: https://github.com/Krozzeo/AxiomEngine/actions/runs/38091006202 .

Only account-specific live model comparison remains manual. Repeat the same prompt/model/reasoning settings in the new Workshop and inspect More info. Three controlled requests and 16.2% fewer serialized scene-request bytes do not promise a particular live token count, price or one-attempt reliability for arbitrary tasks. Limitless removes local configured caps; provider limits, transport/context/compiler bounds and validation remain in force. Credentials remain daemon memory only.

Expanded MVP remains approximately **88% (111/126)**; this correction adds no roadmap weight. Next is **M18.3 Assisted PMD**, followed by M18.4 GitHub integration and M19 hardening. No user-exclusive UI/runtime acceptance remains.
