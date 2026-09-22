import { randomUUID } from "node:crypto";

export const PROTOCOL_VERSION = 1;

/** @param {'command'|'event'|'error'} kind @param {object} payload @param {object} context */
export function envelope(kind, payload, context = {}) {
  const correlationId = context.correlationId ?? randomUUID();
  return {
    protocolVersion: PROTOCOL_VERSION,
    messageId: randomUUID(),
    kind,
    timestamp: new Date().toISOString(),
    correlationId,
    traceId: context.traceId ?? correlationId,
    causationId: context.causationId ?? null,
    actor: context.actor ?? { kind: "system", id: "axiom" },
    payload
  };
}

export function diagnostic(code, subsystem, cause, evidence = [], suggestedInspections = []) {
  return {
    code,
    subsystem,
    severity: "error",
    resource: null,
    location: null,
    cause,
    evidence,
    suggestedInspections
  };
}

