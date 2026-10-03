# M8 — Causal Diagnostics v1

Status: not started. Master specification section 127. Weight: 6%.

Read existing causal protocol, M5/M6 agent contracts, M7_PHYSICS.md and resource/
script runtime decisions before implementing new diagnostic surfaces.

1. Define evidence-backed whyNotRendered, whyNotColliding, whyAssetNotLoaded and
   whyScriptNotRunning queries; explanations must describe actual decisions.
2. Add bounded Decision Graph nodes, stable reason codes and correlation lineage.
3. Integrate a trace viewer, diagnostic mode and opt-in deep-trace architecture.
4. Deliberately inject ten known faults and prove correct causal identification
   through automated tests, including unavailable/expired evidence handling.
5. Keep normal-mode overhead bounded; update schema/contracts, report and handoff.

Preserve proposal isolation and the unmerged milestone PR stack.
