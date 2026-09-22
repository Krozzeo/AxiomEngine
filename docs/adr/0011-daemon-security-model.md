# ADR-0011: Deny-by-default daemon security

## Context
A local service can be attacked by hostile pages, plugins or generated instructions.

## Decision
Bind only to loopback, authenticate every privileged request with an ephemeral token, validate exact origins, cap bodies, scope filesystem roots and allowlist external processes. Never expose a general shell.

## Alternatives
Unauthenticated localhost APIs and unrestricted project agents were rejected.

## Consequences
Security behavior has integration tests. Future capabilities are granted per task/workspace.

## Status
Accepted.

