# M2 current acceptance candidate — 0.0.12

Implementation of the full PNG/GLB, runtime/rendering and Play flow is complete.
38 local Node tests and 24 Rust tests pass. The actual Chromium pixel/restart gate
is pending; retain 2/11 credited acceptance points until it passes. See M2_BETA.md.
Do not treat the historical 0.0.11 evidence below as the new renderer's proof.

# M2 — Axiom Beta Foundation: progress report

Version 0.0.11. In progress, not a milestone closure.

## Outcome

The editor creates/opens projects, lists real entities and edits name, position
and scale through commands. Scene undo/redo, dirty-state handling and explicit
atomic save are implemented. IDs and transforms survive reopening and daemon
restart. The viewport still displays the labelled M1 kernel demo.

## Acceptance matrix

| # | Required user action | Status | Evidence or remaining work |
| --- | --- | --- | --- |
| 1 | Open Axiom | Passed | Static delivery, boot/handshake and real-Wasm editor tests; prior Windows browser evidence |
| 2 | Create project | Passed | Editor controller drives real commands; HTTP persistence tests |
| 3 | Import image and GLB | Blocked | Importers not implemented |
| 4 | Place sprite | Blocked | Sprite authoring/rendering not implemented |
| 5 | Place mesh | Blocked | Asset mesh authoring/rendering not implemented |
| 6 | Move placed content | Blocked | Generic transforms work; imported sprite/mesh path remains unimplemented |
| 7 | Save the composed scene | Blocked | Generic entities save; complete imported-content workflow remains unverified |
| 8 | Close that project | Blocked | Full composed-scene workflow pending |
| 9 | Reopen that project | Blocked | Generic entities reopen; full composed-scene workflow pending |
| 10 | See the same scene | Blocked | Authoring-to-renderer extraction pending |
| 11 | Enter Play | Blocked | Play isolation/runtime conversion pending |

## Automated evidence

- npm run check: 34 Node tests passed, zero failures; 11 schema documents,
  three architecture rules and M0 daemon parity checks passed.
- npm run check:native: formatting and Clippy passed; 22 Rust tests passed.
- Seven new tests cover scene history, conflicts, editor controls and HTTP restart.
- Current-version remote CI is recorded separately in axiom.project-state.json;
  historical CI results are not presented as this version's results.

## Manual tests

None required for this slice: command behavior and controller interactions have
equivalent automation. The existing hardware renderer is unchanged. Browser
layout has not been screenshot-validated in this environment.

## Limitations and next work

Generic authoring entities are not rendered. Imports, sprites, meshes, Play,
native daemon parity and schema code generation remain pending. One shared
workspace per daemon has no automatic cross-tab event subscription. Drafts and
history are memory-only until Save; history is bounded to 64 snapshots.

Next: compile authoring entities into the Rust runtime, then import/place image
sprites and GLB meshes. Do not count generic entity persistence as proof of the
complete imported-scene workflow.

## Completion

M0: 100%. M1: 100%. M2: 2/11 = approximately 18.2%.
Whole project: 5 + 6 + 7 × (2/11) = approximately 12.3%.
Weights and reporting requirements: architecture/MILESTONE_REPORTING.md.

## Remote implementation evidence

CI passed all four jobs (Linux and Windows bootstrap, Rust, C# Wasm) on commit
`35b2a20e7f0eadc317016a419c98e5e2e03781f2`:
https://github.com/Krozzeo/AxiomEngine/actions/runs/35762835402
