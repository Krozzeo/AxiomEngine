# Daemon security model

The daemon grants project access, never ambient computer access.

M0 guarantees:

- loopback-only binding;
- ephemeral high-entropy bearer token;
- exact Origin validation for privileged endpoints;
- browser-controlled `Sec-Fetch-Site: same-origin` validation when a same-origin
  GET legitimately omits `Origin`;
- no token in server request paths (the launch token uses a URL fragment);
- strict request-body limits;
- cross-origin isolation and restrictive content security headers;
- path resolution constrained to an authorized root;
- atomic file replacement;
- no general shell or arbitrary process endpoint;
- stable, tested security error codes.

Before external compiler/importer execution is enabled, the native daemon must
add named executable capabilities, argument templates, timeouts, output limits,
working-directory constraints and an audit event. Symlink/reparse-point defense
must be validated on Windows, Linux and macOS.

M5 semantic tools use the existing bearer/Origin gate and public Command Bus.
The stdio adapter accepts only a configured loopback daemon origin; it offers
no raw path, arbitrary executable, arbitrary HTTP or git operation. Captures use
a single expiring editor lease and validate request ID, project, scene revision,
dimensions and PNG byte budget. See ADR-0018 and M5_AGENT_CONTROL.md.

## M6 proposal boundary

See M6_WORKSPACES.md and ADR-0019. Agent scene/resource mutations require an
explicit workspaceId. workspace.accept and scene.save are not MCP tools. Human
acceptance checks proposal revision, review hash and unchanged source revision;
Save remains explicit. The trusted local token is not a hostile-process sandbox.
