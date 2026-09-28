# Axiom Protocol v1

The protocol is a semantic contract, not an HTTP contract. HTTP/JSON is the M0
adapter; WebSocket, in-process, CLI and MCP adapters must preserve the same
commands, events, errors and causal identities.

## Startup

The client requests `/v1/handshake` with its protocol version. The daemon
returns the supported range, selected version, schema hash, capabilities and
bounded resource limits. A mismatch fails before commands are accepted.

## Identity

- `messageId`: unique envelope identity.
- `correlationId`: one user/task-level operation.
- `traceId`: causal diagnostic trace spanning processes and jobs.
- `causationId`: the message directly responsible for this message.

Persistent entity IDs and runtime generational handles are deliberately not
protocol trace IDs.

## Mutation and facts

Commands request change. Events state that something happened. A mutation is
successful only after its event is emitted. Errors are envelopes with stable
codes and structured evidence; human text is supplementary.

## Concurrency

Mutation commands may include `expectedRevision`. A stale revision produces
`AX_COMMAND_0003` without changing state.

## Retention

M0 retains bounded event and trace rings. Responses advertise their limits.
Clients consume deltas by sequence and must tolerate expired diagnostic data.


## M4 script commands

`script.compile` validates project/scene revision and returns a bounded job
receipt. `script.job.get` reads status and Game.cs line/column diagnostics;
`script.job.cancel` terminates the owned process. `script.jobFinished` carries
the originating correlation/trace/causation identities. Only a successful build
on the captured revision updates source, attachments and build metadata. These
capabilities are advertised by the Node editor adapter. Native HTTP remains M0.
See M4_SCRIPT_RUNTIME.md and the canonical tool catalog for limits and schemas.

## M5 semantic adapter

Authenticated GET `/v1/tools` returns generated implemented tool contracts.
POST `/v1/tools/call` accepts `{name, arguments}`, validates the canonical schema
and dispatches the same causal command envelope as editor operations. Mutation
responses are compact receipts; use bounded queries for further context.
The stdio MCP adapter pins MCP 2025-11-25 independently of Axiom protocol v1.
POST `/v1/editor/sync` is a browser renderer bridge, not an agent tool. It has the
same session authority, a five-second single-tab lease and bounded capture
reports. See M5_AGENT_CONTROL.md for query budgets, deltas and capture semantics.
