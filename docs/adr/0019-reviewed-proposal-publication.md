# ADR-0019 — Reviewed proposal publication

Status: accepted. Implements ADR-0008 and master specification section 125.

Agents need to edit and run proposals without changing shared authoring state.
M6 uses immutable base snapshots, scene copy-on-write and private resource
folders. Agent mutations require explicit workspace identity. Human acceptance
requires a current review hash and rejects source revision conflicts.

Acceptance publishes one undoable in-memory draft after validating and promoting
immutable resources. Save remains the explicit persistence boundary. Publication
failure rolls back newly created resources; rejection deletes the entire private
overlay. Recovery preserves idle proposal journals, not runtime or undo history.
See M6_WORKSPACES.md for limits and authority assumptions.

This preserves existing project Save semantics and makes acceptance reviewable.
It does not provide automatic merging, crash-atomic multi-file transactions or
arbitrary Git integration. Git is optional in the M6 specification and is omitted;
no main branch operation is exposed.
