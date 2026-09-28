# M5 — AI Control Layer

Status: complete. M5: 8/8 (100%). Weighted whole-project completion: 36%.

## Acceptance matrix

| Requirement | Evidence / status |
| --- | --- |
| Generated tool schemas and introspection | Canonical metadata, component refs and drift check passed |
| Initial MCP server and command protocol | Separate stdio process; lifecycle, listing, invocation and errors passed |
| Project, scene, entity and asset queries | Bounded filtered pages; scene revision checks passed |
| Entity/component/import/edit workflow | Public Command Bus integration passed |
| Runtime controls and editor synchronization | Passed in actual Chromium |
| Actual screenshot and semantic capture | Passed: real pixels, same-frame context and lease/stale/timeout checks |
| Event/error deltas and context budget | Pagination, retention gaps and strict budget tests passed |
| Complete external-agent scene without clicks | Passed: separate MCP process, no editing clicks |

## Implemented behavior

Agents discover individual tools, create entities, attach imported Renderable
components, modify transforms, start/stop Play, inspect errors and obtain actual
renderer frames with bounded semantic context. External mutations synchronize
the existing editor through its public controller. Agent commands are visible
in the editor console and carry causal trace identities.

## Automated evidence

Seven new Node tests cover tool schemas, revisions/components, context budgets,
retention gaps, capture lease failures, MCP lifecycle, fragmented stdio and
loopback authority. Existing regression tests also run in CI. The browser test
uses a separate MCP child process and no editor editing clicks.
Release CI run 36425589992, commit 324f0504a6f408d854d0c9a0cc13e948ddb454f4,
passed all ten jobs: 60 Node tests, 25 Rust tests, formatting/Clippy, 14 schema
documents, generated binding/tool checks, three architecture rules, M0 parity,
M2–M5 Chromium workflows and C# development/AOT (Windows development included).
The captured PNG is 640×360 with non-background rendered asset pixels. Actual
editor and capture screenshots were reviewed. Raw report: m5-browser-evidence.json
(from the successful browser job of run 36425180314 on the identical code commit).
That push run hit its 20-minute Windows job timeout; the PR run above passed all
ten jobs, including the Windows C# gameplay test.

## Manual tests

None; the acceptance workflow is automated through MCP and
actual Chromium WebGPU. Physical GPU performance is not claimed by this milestone.

## Boundaries

MCP pins 2025-11-25 over stdio to the authenticated Node daemon. Native Rust
remains M0. Tools share the authoring draft; isolated proposals are M6. Captures
require one live WebGPU editor, support color only and cap PNG output at 512 KiB.
Semantic context lists up to 32 scene entities; it is not visibility segmentation.
No arbitrary shell, filesystem path, HTTP fetch or git operation is exposed.
