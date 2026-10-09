# M19 — MVP Hardening

Status: not started. Master specification sections 138–139. This document is a
plan, not an implementation or an acceptance claim.

Turn the completed subsystems into a coherent product: stability, performance,
documentation, examples, onboarding, safe mode, crash recovery, schema migrations,
project health and Tier compatibility. Preserve bounded resource use, semantic
authority and explicit human review of proposals.

Begin with a reproducible clean-install/onboarding and project-health inventory.
Exercise damaged/interrupted project writes, unavailable capabilities, recovery
and migration paths; define evidence and safe defaults before introducing changes.
Measure representative workloads rather than claiming physical GPU performance
from software WebGPU CI. Keep lower capability tiers usable and explain actual
fallbacks in the UI.

Close with the master specification's end-to-end acceptance sample built through
Axiom: a 3D scene with player, physics, lighting/PBR, animation, audio and C# gameplay;
a 2D scene with tilemap, sprites, physics, animation and UI; and a reviewed AI
proposal for an enemy that follows the player, receives damage, supplies visual
and audio feedback and includes behavioral tests. The AI workflow must inspect,
edit, compile, execute, verify, repair, measure and present its change set before
the user accepts it. Do not equate M18's two narrow repair policies with this
general gameplay objective.

Require clean cross-platform gates, representative editable demos, synchronized
guides/state and retained acceptance evidence. Report remaining limitations and
only manual checks that cannot be covered equivalently by available automation.
