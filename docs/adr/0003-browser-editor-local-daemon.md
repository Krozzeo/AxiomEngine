# ADR-0003: Browser editor with local daemon

## Context
The browser provides the UI and GPU API but not robust project filesystem and build integration.

## Decision
Serve the editor from a loopback-only daemon. The daemon owns scoped filesystem/build operations and exposes versioned adapters over a semantic protocol.

## Alternatives
Electron-only, browser-only storage and a mandatory cloud backend were rejected.

## Consequences
Browser and daemon must negotiate versions and capabilities. The engine remains offline-capable.

## Status
Accepted.

