# ADR-0028: Isolated game tests and parallel editor targets

Accepted for M14, 0.0.27.

Retain the existing single browser frame owner during the bootstrap transition.
Introduce a pure bounded test-session adapter and a public revision-scoped control
API. Test stepping suspends ordinary RAF advancement, compiles cloned runtime
state, uses exact delta/input and restores current authoring state. Asynchronous
receipts permit cancellation without a blocked HTTP request. Runtime-state and
visual evidence have different guarantees; Null never fabricates pixels.

M13.1's single-visible-viewport restriction prevents useful Scene/Game parallel
work. Supersede that restriction with independent rendering targets sharing one
kernel/script worker/frame/audio owner. A detached Game uses its own camera and
surface while primary Scene remains interactive. Resource lifetime and target
readiness are explicit; secondary targets do not advance gameplay. Primary GPU
profiling timestamps do not claim secondary coverage.

Persist tab ordering and closure in editor settings, keeping layout changes out
of scene undo/history. Preserve real DOM controls across window adoption and return.
Do not add replay, arbitrary multi-editor leases or native OS window docking.
