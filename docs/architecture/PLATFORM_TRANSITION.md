# Transition to Axiom Platform

Owner decision documented2026-10-21. Canonical product/repository: Axiom Game Engine / AxiomGameEngine. The rename preserves commits/issues/milestones/recovery. Existing package axiom-engine, namespaces and document identifiers remain stable; branding does not force data migration. Public MIT supersedes earlier license proposals without rewriting old releases or dependency notices; commercial decisions are deferred.

[Platform](https://github.com/Krozzeo/AxiomPlatform) owns the master plan, ownership matrix, contracts, P0–P5 roadmap and shared services. Engine owns its specialized editor, scene/component/assets/C#/renderer/shaders/physics/audio/animation/testing/export and adapter. Mixed daemon/agent/workspace/protocol files are split through ports, not moved whole. Platform cannot import Engine domain types.

P0 was documentary; P1 subsequently integrated with owner acceptance (Platform0a0471b/Engine400fec0). P2/P3/P4 are stacked review candidates. P2 supplies installed common OS/GitHub transport/account; P3 generic AI/runtime/usage/registry/review/journal; P4 Hub/Settings/presentation/distribution plus Engine starter/rename. Exact source pins and evidence are in the current handoff. Direct Engine startup remains; standalone export remains planned rather than implemented.

Engine retains45 main milestones,23 historically closed,22 pendingM19–M40. M19 freezes/audits Unity 6.3; M20–M39 implement/conform; M40 hardens. GPU/compute/shaders remain M25/M26/M28/M30/M39/M40. Platform milestones neither renumber nor credit these; M19 can advance without P5 when independent.

Inspected P0 base871a72f6d2c720e99e0a8d1598c0f35af69c4d78 and recovery/pre-restructure-stable-2026-10-20 stay fixed. Earlier CI 329 (46/46) was followed by M17 failure on the same base (run39507425121,44/46,#51); do not claim complete-green from earlier runs. P3 CI 336 (43/46) still has M17/M18.3.11/aggregate failures; #47/#51/#55 and native GitHub/model/dense physics remain separate. Active remotes use https://github.com/Krozzeo/AxiomGameEngine.git; do not force main or move tags.
