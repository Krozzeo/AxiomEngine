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
