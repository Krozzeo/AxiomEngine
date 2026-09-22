# Native daemon adapter

The Rust daemon is the target production adapter. The Node daemon remains a
temporary executable oracle until the pinned Rust gate and browser smoke test
are green.

## Contract

Both adapters expose:

- `GET /health`;
- `GET /v1/handshake`;
- `POST /v1/commands`;
- `GET /v1/events?since=`;
- `GET /v1/traces/{traceId}`;
- `GET /v1/metrics`;
- static editor delivery for non-API GET requests.

The semantic contract is defined by the schemas, error catalog and
`protocol/fixtures/command-parity.json`; it is not owned by either HTTP
implementation.

## Security invariants

- bind to IPv4 loopback only;
- generate a 256-bit ephemeral token from the operating system RNG;
- require the bearer token on every `/v1/` request;
- require an allowlisted `Origin`, or browser-controlled
  `Sec-Fetch-Site: same-origin` when same-origin GET omits `Origin`;
- cap bodies at 256 KiB;
- serve restrictive CSP and cross-origin isolation headers;
- expose no arbitrary process execution or ambient filesystem API.

## Verification and promotion

Run `npm run check` for schemas, architecture, adapter-surface parity and the
Node behavioral oracle. With Rust 1.90 installed, run:

```bash
npm run check:native
cargo check --locked -p axiom-core --target wasm32-unknown-unknown
npm run dev:native
```

Formatting, Clippy, all nine Rust tests, the Wasm core check and the Chrome
native smoke flow passed on the Windows evidence machine. Remote CI remains the
promotion gate, so `npm run dev` intentionally launches the Node adapter.
