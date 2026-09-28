# M6 — Transactional AI Workspaces

## Lifecycle and authority

Start from a saved, stopped project with no running jobs. `workspace.begin`
captures the project and source scene revision and returns a `workspace://UUID`.
Pass this ID on all agent scene, asset, script and Play mutations. Direct agent
source mutations fail with AX_WORKSPACE_0001. Project creation/opening remain
explicit selection operations. MCP cannot invoke acceptance or source Save.

`workspace.list`, `workspace.diff` and `workspace.log` expose bounded summaries,
pageable changes and causal actions. Differences use stable entity/asset IDs;
long values are split into chunks with offsets. Follow nextOffset until null.
`workspace.preview` runs the proposal in the connected editor. Captures and
runtime leases include workspace identity, so matching revision numbers across
workspaces do not authorize stale frames. `workspace.continue` stops preview
and returns to the source while retaining the editable proposal.

The human editor offers Review differences, Run proposal, Return to source,
Accept reviewed changes and Reject. Acceptance requires the exact review hash
and current proposal revision. Concurrent source edits or a different saved
project revision reject acceptance. A changed proposal requires another review.

Acceptance validates resources, promotes immutable referenced assets and the
published script bundle, and publishes one undoable source scene change. The
source is now a dirty draft: **Save explicitly persists it**. Undo restores the
source scene; immutable promoted resources may remain available for redo.
A failed publication removes files and empty directories it created. Reject
removes the private overlay and returns to the unchanged source. No git command,
branch merge or MAIN mutation is performed.

## Storage and recovery

The immutable base scene is shared until the first mutation. Base assets and
compiled bundles are read through by immutable identity. New assets, derived
caches and compiled output stay under the private `.proposals/<UUID>` directory.
Only referenced asset binaries and manifest/publish script files are promoted;
intermediate compiler output and derived cache files are not copied to source.

Idle proposals survive daemon restart through an atomically replaced journal.
Play and undo stacks do not persist. After reopening the same unchanged saved
source, explicit Continue can bind a recovered proposal to its new runtime
revision. This is not a rebase of concurrent changes. Interrupted compiler jobs
are not resumed; reject can discard remaining private files. Power-loss atomic
transactions across project and resource files are not claimed.

Limits: eight proposals, 1 MiB per journal, last 128 causal actions, bounded
query pages, and promotion budget of 256 MiB/4096 files per resource tree.
Ordinary files and directories are required; linked overlay entries, conflicting
published bytes and invalid identities are rejected. The local bearer token
remains trusted: the human role is a protocol boundary, not a sandbox against
another process already possessing that token.

## Verification

`tests/workspaces.test.mjs` covers isolation, immutable snapshots, rejection,
accept/undo/save, conflicts, restart, scoped preview, unsafe IDs/links and rollback.
`npm run test:browser:m6` exercises an external MCP process, human diff/reject/
accept controls, actual WebGPU capture, private C# compilation and saved restart.
CI also reruns M2–M5 and native, schema and generated-contract gates.
