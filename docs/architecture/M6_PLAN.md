# M6 — Transactional AI Workspaces

Status: complete; see ../reports/M6_CURRENT_REPORT.md. Source: master specification section 125. Weight: 5%.

Required outcome: an agent edits an isolated proposal while the authoritative
project stays unchanged. A human can inspect the change set, run the proposal,
accept it atomically or reject it without residual project changes.

1. Define workspace IDs, immutable snapshots, revisions and COW overlays for
   scene, asset and script references. Preserve M5 bounded tools and authority.
2. Route agent mutations into explicit proposal workspaces; never silently write
   the shared authoring project or MAIN. Add causal action logs and change sets.
3. Implement inspect/run/continue/accept/reject with conflict detection against
   the original project revision. Do not overwrite concurrent human changes.
4. Integrate proposal inspection and preview into the editor. Acceptance must
   be concrete and reviewable; rejection restores the source without residues.
5. Automate isolation, preview, acceptance, rejection, stale conflicts, restart
   behavior and bounded diagnostics. Git integration is optional and must never
   introduce automatic main-branch mutation.
6. Update architecture decisions, public schemas, handoff and milestone report.

Read ADR-0018, M5_AGENT_CONTROL.md, PROJECT_PERSISTENCE.md, SECURITY.md,
M3_ASSET_PIPELINE.md, M4_SCRIPT_RUNTIME.md and master specification first.
