# M5 agent control

Historical 0.0.15 contract. M6 requires workspaceId for agent mutations and
removes source Save/close and acceptance from MCP. Read M6_WORKSPACES.md for
the current authority and lifecycle rules.

The Node daemon exposes generated semantic tools through authenticated
`GET /v1/tools` and `POST /v1/tools/call` (`{name, arguments}`). These share the
public Command Bus, causal envelopes, scene revisions and workspace history.
`npm run generate:tools` generates the catalog; `npm run check:tools` detects drift.
The canonical source is `protocol/schema/semantic-tools.json`, with component
references resolved from the project document schema. Native Rust remains M0.

## MCP setup

Start the editor with `npm run dev`. A local MCP client launches:

```json
{
  "command": "node",
  "args": ["C:/path/to/AxiomEngine-m5.0/daemon/mcp/stdio.mjs"],
  "env": {
    "AXIOM_DAEMON_ORIGIN": "http://127.0.0.1:4317",
    "AXIOM_SESSION_TOKEN": "TOKEN_FROM_THE_DAEMON_LAUNCH_URL"
  }
}
```

Copy the token value from the launch URL fragment into the MCP client's private
configuration. Do not commit that configuration. Only loopback HTTP origins are
accepted. The adapter uses exact Origin and bearer authentication, follows no
redirects, and writes only JSON-RPC to stdout. It never starts a compiler or shell
itself; named compilation stays in the existing daemon capability.

Protocol: MCP `2025-11-25`, initialize / notifications/initialized / ping /
tools/list / tools/call. Unsupported versions receive the supported version during
negotiation. Tools are listed ten per page. No resources, prompts, subscriptions,
sampling or tasks are advertised. Asset/compiler cancellation uses their explicit
job tools. Stdio closes on EOF. Input lines: 12 MiB; HTTP response: 1 MiB;
transport request timeout: 30 seconds. Compiler/import tools return job receipts.

## Queries and edits

Use `project.query`, `scene.query`, `entity.query`, `asset.query`, `runtime.status`,
`diagnostics.query`, `events.query`, `api.search` and `api.describe`. Queries return
summaries, filtered pages and deltas, not source code or binary geometry. Entity
and asset pages require `id` and `expectedSceneRevision`; refresh if it changes.
Literal name matching does not execute regular expressions. Default page is 25,
maximum 100; default JSON-data budget 8192 UTF-8 bytes, permitted 1024–65536.
A page returns nextOffset; a delta returns nextSince, oldest/latest sequence and
a gap flag. Gaps mean the 512-event or 128-error window expired: query fresh state.
Budgets apply to the data object, excluding protocol envelope framing. A single
item too large for the budget returns AX_AGENT_0003 without silent truncation.

Mutation results are compact receipts with project ID and scene revision. Query
the affected entities/assets for details. All edits use the existing revision,
undo and Play rules. `scene.component.add/remove` support optional Renderable;
Transform is present on creation and cannot be removed. Only an imported sprite
or mesh with a matching kind can be attached. C# attachments use script.compile.
API introspection advertises only implemented components/tools/error codes.

## Captures and editor synchronization

Keep the launch URL open in one browser tab. The editor polls authenticated
`/v1/editor/sync`, adopts external snapshots through its normal controller and
reports renderer readiness. Only one tab owns the five-second renderer lease.
Check `runtime.status.editor.sceneRevision` against `sceneRevision` before capture.

`renderer.capture` requires project ID and expectedSceneRevision. It returns an
actual WebGPU color PNG and frame-matched semantic context. Defaults: 640×360,
16 entities. Bounds: 64–1024 width, 64–768 height, 0–32 entities, 512 KiB PNG.
MCP sends the PNG as image content and metadata as structured/text content.
Semantic entities are a bounded list of scene entities, not a visibility or
segmentation claim; omittedEntities reports remaining entries. No browser, a
stale revision, Null renderer, lost device or timeout returns an explicit error.
One capture may be pending; daemon timeout is five seconds. Editor error reports
are bounded and available through diagnostics.query.

## Automated acceptance

`npm run test:browser:m5` starts an actual MCP child process and uses only its tools
to create an entity, import an asset, attach a component, edit, Play, capture,
inspect errors/deltas, Stop and save. Browser automation only opens the editor and
collects evidence; it never clicks editing controls. Unit tests cover protocol,
context limits, revision conflicts, retention gaps and capture lease failures.
M6 adds isolated transactional workspaces; this milestone intentionally shares
the authoring draft and never modifies MAIN or any git ref.

## M13 measured profiling API

`profiler.query` reads transient frame metrics using project ID, exact scene
revision and optional workspace ID. `limit` is 1–20; `beforeFrame` paginates older
retained frames. Replies fit 15,000 bytes and may contain fewer records.
`profiler.explainFrameSpike` takes `frameSequence`, `metric` (elapsed/main/gpu) and
`baselineWindow` (8–60). Eight earlier measured comparable frames are required.
Both tools are readonly and use the renderer session via its bridge; replies bind
client/revision/workspace/generation. No live matching editor means unavailable.
See M13_PROFILER.md for scope coverage, overlap and missing GPU evidence.
