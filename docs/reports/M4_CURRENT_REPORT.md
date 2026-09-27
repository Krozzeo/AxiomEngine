# M4 — C# Gameplay Runtime

Status: acceptance complete (8/8). M4: 100%; weighted whole project: 30%.
Final release verification follows the documentation/version update.

## Acceptance matrix

| Required point | Status | Evidence |
| --- | --- | --- |
| Generated bindings and scoped compilation | Passed | Generated contract check; process/file tests; actual compiler |
| Transform and Rust runtime movement | Passed | Rust/Wasm scalar position test |
| Keyboard Input | Passed | C# isolated worker dispatch passed |
| Runtime-only entity spawning | Passed | C# isolated worker dispatch passed |
| Lifecycle and causal logs/errors | Passed | Start/Update/Stop and source diagnostic tests |
| Edit/compile/reload without editor restart | Passed | Dedicated browser acceptance |
| Failure, cancellation and stale-generation protection | Passed | Workspace/process/runtime tests passed |
| Development and release AOT foundation | Passed | Measured Chromium C# runs |

## Measured runtime foundation

CI run 36285741144 executed development and AOT builds in Chromium 141 on Linux.
Raw reports are `m4-csharp-development.json` and `m4-csharp-aot.json`.
Development spike: 23.86 s publish; 7,300,693 bytes raw / 2,709,208 gzip;
155.6–165.5 ms startup; 10,000 scalar interop calls in 42.0–67.9 ms.
AOT spike: 107.08 s publish; 11,478,454 bytes raw / 3,871,085 gzip;
193.3–290.9 ms startup; 10,000 calls in 17.4–18.7 ms.
Both modes executed lifecycle logs, Transform read, input-driven movement and
entity spawning using the actual generated SDK. These are individual CI samples,
not statistical benchmarks or physical-device performance guarantees.

## Automated editor evidence

Implementation run 36354561101, commit 62a7c66ed9fba6008c3c16e52733e7bc80df6824:
53 Node tests; 25 Rust tests; Rust formatting and Clippy; 13 schema documents;
three architecture rules; M0 protocol parity; all nine CI jobs passed.
Chromium used actual software WebGPU under Xvfb. M2 and M3 regressions passed.
M4 proves visible movement from keyboard input through C# and Rust, runtime
spawning, unchanged authoring, compiler source locations, last-good-runtime
preservation, reload without navigation, persisted bundle reopening, lifecycle
logs and a killed infinite loop with responsive editor. Actual screenshots were
reviewed. Raw report: `m4-browser-evidence.json`.

## Manual tests requested

None. Equivalent behavior is covered by automated compiler, process/filesystem,
Rust/Wasm and real-browser checks. Windows C# execution is also in final CI.

## Known boundaries

One source file and one GameScript type; worker replacement resets state.
Spawning clones existing entities; no arbitrary components or package imports.
AOT is a measured Linux foundation, not a production publishing system. Native
HTTP remains M0; its internal compiler capability is not exposed as an editor
API. Generated build directories are retained for saved/undo references; no
compiler-cache garbage collector yet. Workers are responsiveness isolation for
local user-authored scripts, not a hardened hostile-code sandbox.

## Delivery

The full source snapshot includes the implementation, canonical schemas,
generated bindings, tests, architecture/API docs and next M5 plan. Branches
remain stacked and unmerged. The next milestone is M5 AI Control Layer (6%).
