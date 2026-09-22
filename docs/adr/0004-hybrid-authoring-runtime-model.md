# ADR-0004: Hybrid authoring and runtime model

## Context
Humans need familiar hierarchy/components while runtime iteration needs data-oriented storage.

## Decision
Compile an Authoring World into a Runtime World and extract a separate Render World snapshot. Runtime uses archetype-oriented ECS primitives and generational handles.

## Alternatives
Pure object graphs and exposing a pure ECS as the authoring UX were rejected.

## Consequences
Play Mode never mutates authoring state implicitly; scene compilation becomes an explicit pipeline.

## Status
Accepted.

