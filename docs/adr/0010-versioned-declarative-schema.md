# ADR-0010: Versioned declarative engine schema

## Context
Duplicated reflection metadata would diverge across Rust, TypeScript, C#, MCP and the Inspector.

## Decision
Use declarative, JSON-Schema-validated definitions as canonical input to one logical AST and code generators. Preserve unknown authoring fields where possible.

## Alternatives
Manual definitions and an early custom textual language were rejected.

## Consequences
Schema changes require migration and round-trip tests; wire encodings are not the schema itself.

## Status
Accepted.

