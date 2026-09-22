# M2 — Axiom Beta Foundation

Status: not started (0%). Source: master specification section 121.
M0 and M1 are complete; this document awards no M2 functional credit.

## Goal and acceptance

The user must be able to: (1) open Axiom, (2) create a project, (3) import an
image and GLB, (4) place a sprite, (5) place a mesh, (6) move them, (7) save,
(8) close, (9) reopen, (10) see the same scene and (11) enter Play Mode.
Each step needs executable evidence; inherited shell code alone does not prove
this complete persistent-scene workflow. Report 0/11 until tested slices exist.

## Ordered implementation slices

1. Define a versioned authoring scene/project contract: stable IDs, transforms,
   component metadata, asset references and unknown-field preservation. Generate
   shared schema types/validation where possible; avoid another manually duplicated
   model. Document migration behavior before changing format versions.
2. Add capability-scoped project create/open and atomic scene save/load in the
   daemon. Commands emit events and traces; paths never replace resource IDs.
   Test traversal, invalid data, reopen equivalence and preservation of unknown data.
3. Replace demo-only hierarchy/inspector content with scene selection and transform
   editing through Command Bus. Add undo/redo and test inverse operations.
4. Import images and GLB with stable asset references. Add sprites/orthographic
   camera, meshes/perspective camera, simple materials and basic light. M3 will
   extend this into the production asset pipeline rather than duplicate it.
5. Compile the authoring scene into a Rust runtime representation. Scene and Game
   views share resources but Play state must not silently overwrite authoring state.
6. Verify the full save-close-reopen-Play workflow in both suitable automated tests
   and a minimal hardware smoke where automation cannot substitute for evidence.

## Constraints

Editor, engine, renderer, assets and daemon retain their architecture boundaries.
Every edit uses Command Bus, produces Event Bus records and supports defined undo
semantics. Project, Hierarchy, Inspector, Console, Scene and Game panels must act
on real state. No arbitrary filesystem or process execution is exposed to clients.
Read SECURITY.md, PROTOCOL_V1.md, schema ADR-0010, and M1_KERNEL.md before editing.

## First concrete task

Implement the schema-backed project/scene model and daemon command round-trip for
create, save and load, with stable IDs and atomic persistence. Do not begin with
cosmetic editor panels or infer completion from scaffold directories.
