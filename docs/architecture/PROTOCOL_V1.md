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

