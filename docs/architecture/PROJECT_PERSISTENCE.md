# M2 project persistence — first slice (0.0.10)

For the current 0.0.11 editor integration and shared draft behavior, see
SCENE_EDITOR.md. The remaining-work section below records the 0.0.10 slice.

The Node bootstrap daemon owns a fixed `.axiom/projects` root. Clients pass stable
`project://UUID` IDs, never paths. Embedders/tests can supply `startServer`'s
`projectRoot`; HTTP callers cannot change it. Projects do not move automatically
between milestone snapshot folders: preserve/copy `.axiom/projects` while both
daemons are stopped when upgrading a snapshot.

## Contract

Send the usual protocol-v1 command envelope to `/v1/commands` with a valid token,
Origin and protocol header. Capability negotiation is authoritative: these four
commands are currently bootstrap-only. The Rust daemon continues to support the
shared M0 command corpus and does not advertise project capabilities.

| Command | Data | Success event |
| --- | --- | --- |
| `project.create` | `{ "name": "Example" }` | `project.created`, `{ project }` |
| `project.open` | `{ "id": "project://UUID" }` | `project.opened`, `{ project }` |
| `project.save` | `{ "id": "project://UUID", "expectedRevision": 0, "scene": { ... } }` | `project.saved`, `{ project }` |
| `project.list` | `{}` | `project.listed`, `{ projects: [{ id, name, revision }] }` |

Creation assigns project and scene IDs and revision 0. Save requires a complete
scene with the same scene ID and increments the persisted revision. Each entity
has an ID, name and transform: position[3], quaternion rotation[4], scale[3].
Numbers must be finite and entity IDs unique. Empty scenes are valid.
`data.expectedRevision` is the persisted project revision; the optional envelope
payload `expectedRevision` retains its separate M0 counter revision semantics.
Project commands do not modify the demo counter or its undo stack.

The canonical document is `protocol/schema/project-document.schema.json`.
Its small validator interprets the used schema vocabulary and fails at startup
if an unsupported keyword is added. It is not a general JSON Schema engine.
Rust/TypeScript/C# generation and migration tooling remain pending. Unsupported
format versions are rejected without modifying the source file.

Save preserves omitted extension properties, including on entities matched by
ID and their transforms. Omitted entities are removed. Explicit extension values
replace their old values; there is no extension-deletion command yet. Prototype
keys are rejected. Scene validation runs before disk mutation.

## Atomicity, concurrency and limits

The HTTP adapter serializes commands through `dispatch`. Save acquires an
exclusive per-project lock, checks the revision, writes and fsyncs a temporary
file, then renames it over the project. Events appear only after successful disk
replacement and retain correlation, trace and causation IDs. Failed writes emit
an error and rejection trace, without a success event. A second process must
acquire the same lock, so it cannot commit a stale revision silently.

A crash can leave a `.lock` or `.tmp` file. Recovery is manual: stop all daemons,
back up the project directory, inspect the JSON, then remove stale lock/temp
files. Never remove a lock while a daemon may still be writing. Directory fsync,
power-loss durability, network filesystems and automatic lock recovery are not
claimed. Event rings are in memory; a crash after rename can persist a change
whose event was not delivered. Reopen to resolve uncertain outcomes.

Documents are limited to 192 KiB, 1,024 entities and 32 nesting levels. Listings
allow up to 256 projects and reject invalid entries rather than silently hiding
corruption. HTTP requests retain the 256 KiB limit. IDs must match filenames.
Symlink project files/root and hardlinked project files are rejected. The managed
root and its ancestors must be controlled by the daemon user; this slice does
not claim protection against an attacker concurrently replacing ancestor paths.
Cross-platform reparse-point hardening remains a security gate.

Errors: `AX_PROJECT_0001` missing project; `0002` invalid document/limits;
`0003` revision conflict; `0004` existing lock; `0005` storage failure.
`AX_FS_0001` rejects path-like IDs and linked files. Raw filesystem paths do not
appear in project error envelopes.

## Evidence and remaining work

`npm run check` passes 27 Node tests and all schema/architecture/M0 parity checks.
Seven new tests exercise round-trip transforms/extensions, removal, real HTTP
restart, stale saves, competing stores, corruption, invalid versions, duplicate
IDs, traversal, locks, links and unauthorized writes. CI includes Linux and Windows
bootstrap jobs; a Windows account without symlink privileges reports that case.

The editor still displays the M1 demo. Create/open/save controls, entity editing
with undo, native project parity, asset imports and authoring-to-runtime conversion
are pending. Disk create/save are persistence operations without undo; future
scene edit commands must supply their inverse operations. M2 remains 0/11 for the
full user acceptance workflow; groundwork is not credited as completed UX.

Remote CI #7 passed all four jobs on implementation commit
`6756396825e476e28557494ef18153e5095a912f`:
https://github.com/Krozzeo/AxiomEngine/actions/runs/35760870433
This includes the project command tests on Linux and Windows, plus Rust and C#
Wasm. PR #2 targets the M1 branch while PR #1 remains unmerged.

## M16 current authoring extension

See M16_AUTHORING_AND_PERFORMANCE.md and ADR-0031 for portable scene.projectFiles,
canonical file edits/history/save, typed contextual copies, isolated Explorer exports,
and one-source C# authoring limits. M16_CURRENT_REPORT.md records executable evidence.
