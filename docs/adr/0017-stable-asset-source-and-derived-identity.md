# ADR-0017: Stable asset identity and immutable source revisions

## Context
M2 used a source hash as an asset reference. Replacing that reference when source
bytes change would break scene consumers and prevent dependable hot reload.

## Decision
Keep each existing asset ID as stable logical identity. Add a sourceId content
hash and a derived buildKey. Store the versioned Asset DB with the authoring scene
so its publication/save is atomic with scene references. Decode/compose resources
through a versioned importer and cache by source hash plus dependency keys.

Use explicit texture-to-mesh edges and command-driven source replacement. Do not
grant clients arbitrary host paths or executable importers. Background jobs build
immutable outputs first, then publish only if the captured scene revision still
matches. Publication is undoable; failed or cancelled work preserves authoring.

## Consequences
Legacy M2 IDs retain a hash-shaped spelling without promising that it is the
current source hash. Projects preserve old source revisions for undo/recovery.
Unused sources/cache entries require later quota/cleanup policy. Native adapter
parity and schema code generation remain separate unimplemented work. Filesystem
watching can later feed the same commands without changing the identity contract.

## Status
Accepted.
