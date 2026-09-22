# Authoring workspace and editor — 0.0.11

The bootstrap daemon now owns one shared in-memory authoring workspace. The editor
negotiates its capabilities before enabling project/scene controls. Native Rust
daemons do not yet advertise these capabilities; their controls remain disabled.

## User flow

Create a named project or choose one from Saved projects and Open. Add entity,
select its Hierarchy row, edit the name, position or scale, then Apply changes.
Quaternion rotation is preserved but has no control yet. Save writes the active
scene to disk. Undo/Redo operate on scene edits; Demo undo remains separate.

Project status displays unsaved changes. Switching projects asks before
explicitly discarding changes. Leaving the page requests the browser's normal
unsaved-change warning. Unapplied Inspector field values are form input rather
than a scene edit; Apply changes commits them to the workspace.

The viewport is clearly labelled as the kernel demo. Authoring entities are not
yet compiled into the Rust runtime or drawn. These are generic entities, not
sprites or GLB meshes. Imports, materials, camera editing and Play are pending.

## Command contract

All commands use the existing authenticated HTTP Command Bus and causal events.
`scene.get` returns `{ project, sceneRevision, dirty, canUndo, canRedo }`, with a
null project before opening one. Project create/open return the same fields.

| Command | Additional data | Event |
| --- | --- | --- |
| `scene.get` | None | `scene.snapshot` |
| `scene.entity.create` | Optional `name` | `scene.entityCreated` |
| `scene.entity.update` | `entityId`, optional `name` and partial `transform` | `scene.entityUpdated` |
| `scene.entity.delete` | `entityId` | `scene.entityDeleted` |
| `scene.undo` | None | `scene.undone` |
| `scene.redo` | None | `scene.redone` |
| `scene.save` | None | `scene.saved` |

Every command except scene.get requires `id` (project ID) and
`expectedSceneRevision`. Workspace revisions increase on each successful edit,
undo/redo, save or project activation. They are independent of the persisted
project revision and the M0 counter revision. Stale clients receive AX_SCENE_0002
without a mutation. Refresh workspace retrieves the authoritative current draft;
there is no automatic event subscription or multi-project tab isolation yet.

Create/open with a dirty workspace requires `discardChanges: true` and the exact
`expectedSceneRevision`. Otherwise AX_SCENE_0003 preserves the draft. Direct
project.save cannot overwrite a dirty active draft: use scene.save. A clean
active project's direct save refreshes the workspace and clears its history.

Scene edits validate the complete resulting project before committing in memory.
They do not write disk. Scene.save uses the last persisted project revision; disk
conflicts preserve the dirty draft and its undo history. To reconcile an external
writer, export/copy the current draft using scene.get before explicitly discarding
and reopening; automatic merge/export UI is not implemented.

Undo history stores exact prior scene snapshots, capped at 64 entries. A new edit
clears redo. Save retains history, so undo after save marks the scene dirty when
it differs from the saved scene. Reopening clears history. Daemon restart loses
unsaved drafts and history; saved scenes persist. Browser reload alone leaves the
daemon draft intact, but reopening the authenticated launch URL may be necessary.

## Verification

34 Node tests pass, including real Command Bus/controller integration against the
HTML's element IDs, full HTTP scene editing and daemon restart, stale-tab errors,
unsaved-switch protection, save conflicts, bounded history and persistence. The
controller tests simulate DOM events and do not claim screenshot or physical GPU
validation. Existing real-Wasm Null tests still pass. Rust's 22 tests, formatting
and Clippy pass. No new hardware rendering behavior is introduced by this slice.
