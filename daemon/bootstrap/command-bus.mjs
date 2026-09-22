import { envelope, diagnostic } from "../../protocol/src/protocol.ts";

const MAX_EVENTS = 512;
const MAX_TRACES = 128;

export class CommandBus {
  #counter = 0;
  #revision = 0;
  #sequence = 0;
  #events = [];
  #traces = new Map();
  #undo = [];

  get state() {
    return { counter: this.#counter, revision: this.#revision };
  }

  eventsSince(sequence) {
    return this.#events.filter((event) => event.payload.sequence > sequence);
  }

  trace(traceId) {
    return this.#traces.get(traceId) ?? null;
  }

  execute(commandEnvelope) {
    const started = performance.now();
    const trace = {
      traceId: commandEnvelope.traceId,
      correlationId: commandEnvelope.correlationId,
      level: "normal",
      steps: [{ stage: "command.accepted", atMs: 0, command: commandEnvelope.payload?.type }]
    };

    try {
      this.#validateEnvelope(commandEnvelope);
      const command = commandEnvelope.payload;
      if (command.expectedRevision !== undefined && command.expectedRevision !== this.#revision) {
        throw this.#error("AX_COMMAND_0003", "Expected revision does not match current revision", [
          { expected: command.expectedRevision, actual: this.#revision }
        ]);
      }

      let eventPayload;
      switch (command.type) {
        case "system.ping":
          eventPayload = { type: "system.pong", data: { echo: command.data?.echo ?? null } };
          trace.steps.push({ stage: "system.ping.handled", atMs: performance.now() - started });
          break;
        case "demo.increment": {
          const amount = command.data?.amount ?? 1;
          if (!Number.isSafeInteger(amount) || amount === 0) {
            throw this.#error("AX_COMMAND_0004", "Increment amount must be a non-zero safe integer", [
              { received: command.data?.amount }
            ]);
          }
          const previous = this.#counter;
          this.#counter += amount;
          this.#revision += 1;
          this.#undo.push({ type: "demo.restoreCounter", value: previous });
          eventPayload = {
            type: "demo.counterChanged",
            reasonCode: "AX_DEMO_0001",
            data: { previous, current: this.#counter, revision: this.#revision }
          };
          trace.steps.push({ stage: "demo.counter.mutated", atMs: performance.now() - started, previous, current: this.#counter });
          break;
        }
        case "editor.undo": {
          const inverse = this.#undo.pop();
          if (!inverse) {
            throw this.#error("AX_COMMAND_0005", "There is no command to undo", []);
          }
          const previous = this.#counter;
          this.#counter = inverse.value;
          this.#revision += 1;
          eventPayload = {
            type: "editor.commandUndone",
            reasonCode: "AX_EDITOR_0001",
            data: { previous, current: this.#counter, revision: this.#revision }
          };
          trace.steps.push({ stage: "editor.undo.applied", atMs: performance.now() - started });
          break;
        }
        default:
          throw this.#error("AX_COMMAND_0002", "Command type is not registered", [{ type: command.type }]);
      }

      this.#sequence += 1;
      const event = envelope("event", { ...eventPayload, sequence: this.#sequence }, {
        correlationId: commandEnvelope.correlationId,
        traceId: commandEnvelope.traceId,
        causationId: commandEnvelope.messageId
      });
      trace.steps.push({ stage: "event.emitted", atMs: performance.now() - started, event: event.payload.type });
      trace.durationMs = performance.now() - started;
      this.#recordEvent(event);
      this.#recordTrace(trace);
      return event;
    } catch (error) {
      const detail = error.axiomDiagnostic ?? diagnostic(
        "AX_SYSTEM_0001",
        "command-bus",
        "Unhandled command failure",
        [{ error: String(error.message ?? error) }],
        ["trace(command.traceId)"]
      );
      trace.steps.push({ stage: "command.rejected", atMs: performance.now() - started, code: detail.code });
      trace.durationMs = performance.now() - started;
      this.#recordTrace(trace);
      return envelope("error", detail, {
        correlationId: commandEnvelope?.correlationId ?? "invalid",
        traceId: commandEnvelope?.traceId ?? "invalid",
        causationId: commandEnvelope?.messageId ?? null
      });
    }
  }

  #validateEnvelope(value) {
    if (!value || value.protocolVersion !== 1 || value.kind !== "command") {
      throw this.#error("AX_PROTOCOL_0001", "Invalid command envelope", [{ protocolVersion: value?.protocolVersion, kind: value?.kind }]);
    }
    if (!value.messageId || !value.correlationId || !value.traceId || !value.payload?.type) {
      throw this.#error("AX_PROTOCOL_0002", "Command envelope is missing required identity fields", []);
    }
  }

  #error(code, cause, evidence) {
    const error = new Error(cause);
    error.axiomDiagnostic = diagnostic(code, "command-bus", cause, evidence, ["describeError(code)", "trace(command.traceId)"]);
    return error;
  }

  #recordEvent(event) {
    this.#events.push(event);
    if (this.#events.length > MAX_EVENTS) this.#events.shift();
  }

  #recordTrace(trace) {
    this.#traces.set(trace.traceId, trace);
    if (this.#traces.size > MAX_TRACES) this.#traces.delete(this.#traces.keys().next().value);
  }
}
