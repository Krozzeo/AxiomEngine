# ADR-0018 — Initial MCP and renderer-owned capture

Status: accepted; M5 browser acceptance passed.

MCP is a stdio adapter to the authenticated Node daemon, not a second scene
implementation. It pins the 2025-11-25 MCP lifecycle and tool protocol. It offers
individual generated semantic tools and no shell, file-path or arbitrary HTTP
tool. Native Rust remains M0 and does not advertise these capabilities.

The canonical semantic metadata in protocol/schema/semantic-tools.json references
project component schemas. Generation resolves these into tool-catalog.json;
HTTP discovery, validation, MCP listing and introspection consume that artifact.
Unknown tool arguments are rejected. Existing project documents retain their
forward-compatible preservation policy.

An editor holds a five-second renderer lease. Authenticated synchronization uses
the public workspace snapshot path; external edits therefore update the same
editor and renderer as human edits. Captures require current project/revision,
a ready WebGPU frame, a single pending request and bounded dimensions/output.
The renderer copies the submitted canvas within its frame callback and pairs it
with semantic entity positions from that frame. The daemon validates request ID,
lease, revision, PNG dimensions and size. Null/device loss returns unavailable.
Depth, segmentation and other future channels are not advertised.

Agent tools operate on the shared draft workspace, preserving scene revision
checks, undo and explicit saves. Isolated transactional AI workspaces are M6.
No tool touches git branches. This is local-authority isolation, not protection
from a malicious local client already holding the daemon bearer token.

References:
- https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
- https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- https://modelcontextprotocol.io/specification/2025-11-25/server/tools
