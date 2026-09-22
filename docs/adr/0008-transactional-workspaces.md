# ADR-0008: Transactional workspaces from bootstrap

## Context
Agent changes must never corrupt the main project.

## Decision
Introduce snapshots, atomic writes and change records from M0. Add content-addressed copy-on-write overlays and accept/reject orchestration incrementally.

## Alternatives
Waiting until the AI milestone or relying only on Git was rejected.

## Consequences
Every automated mutation has a recovery path even in projects without Git.

## Status
Accepted; foundation implemented, full COW pending.

