# M5 — AI Control Layer

Status: complete; 8/8 acceptance points and full release CI passed. Source: master specification section 124.
Start only after M4 acceptance closes.

## Required outcome

An external agent creates a complete small scene through structured tools without
human clicks: create entities, add components, import assets, edit the scene,
run it, capture a screenshot, query state/errors and stop simulation.

## Ordered work

1. Inventory actual Command Bus capabilities and canonical schemas. Keep native
   M0 and Node editor capabilities explicit; never advertise unimplemented tools.
2. Generate discoverable tool schemas and introspection from canonical metadata.
3. Add an initial MCP adapter over scoped semantic commands, with validated
   protocol envelopes, revision checks and no arbitrary shell/filesystem access.
4. Expose bounded project/scene/entity queries, runtime control, diagnostics,
   event deltas and semantic captures with explicit context budgets.
5. Implement renderer-owned screenshot capture with authority/size/lifecycle
   checks; do not substitute fabricated images or static scene snapshots.
6. Automate the full external-agent workflow against the real editor, including
   stale revision, unavailable capability, oversized context and error recovery.
7. Update docs, tool catalog, handoff and weighted completion report together.

M5 weight: 6%. Read AI_HANDOFF.md, PROTOCOL_V1.md, SECURITY.md, script/asset
runtime contracts, master specification and MILESTONE_REPORTING.md first.
