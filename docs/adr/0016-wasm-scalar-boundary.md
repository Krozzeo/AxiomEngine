# ADR-0016: versioned scalar Wasm boundary

Status: accepted for the M1 demo; revisit before a general scene API.

Use a small dedicated `axiom-wasm` crate with explicit create/destroy world
handles and scalar exports. Rust owns the clocks, mesh and camera projection.
The host copies twelve floats into a vertex buffer; it never receives raw Rust
pointers. This avoids a binding generator and third-party dependency for the
first integrated scene. Handles are monotonic and never reused in an instance.

Rust 2024 requires `unsafe(no_mangle)` for exported symbol names. The bridge
alone allows this attribute within its exports module; all other workspace
crates retain `unsafe_code = forbid`. No unsafe blocks, pointer dereferences or
foreign memory access are permitted. Export names have an `axiom_` prefix, the
ABI version is checked by the host, and each Wasm instance isolates its registry.

Errors: tick returns 0 on success, 1 for an invalid handle, 2 for an invalid
delta; invalid vertex requests return NaN. The JavaScript wrapper maps failures
to stable host errors. The demo camera is fixed at the origin, looks down -Z and
uses WebGPU's 0..1 clip depth. Rotation is not yet applied by the demo extractor.

The editor build now requires the pinned Rust toolchain and Wasm target. Build
output is generated locally and in CI, never treated as an editable source.

Both daemon CSPs add only `'wasm-unsafe-eval'` to `script-src`, which is required
for Wasm compilation. JavaScript `'unsafe-eval'` and inline scripts stay blocked.
The source-policy gate excludes this exact CSP token before scanning for Rust
unsafe keywords; it continues rejecting unsafe Rust and arbitrary subprocesses.
