# Contributing to Axiom Game Engine

Use English for identifiers/comments/UI/documentation/commits/PRs. Preserve stable serialized identifiers, native formats and user-authored text. Historical source-language documents are retained under docs/archive/original-language as reference, not current instructions.

Read docs/AI_HANDOFF.md, architecture/IMPLEMENTATION_STATUS.md, the relevant plan/ADR and the Platform boundary before changing code. Domain invariants stay in Engine; generic services use pinned public Platform contracts and lockfile integrity. No permanent checkout-copy dependency. Provider source is published before consumer pinning.

Work through review branches/PRs. Preserve main/recovery refs and historical test results. Run npm run check and relevant domain/browser/native checks; do not weaken assertions or count unexecuted checks as passed. Browser Null, software WebGPU and physical GPU evidence are distinct; real-account/model quality need their own acceptance.

Maintain editable demos, status/handoff/changelog/API docs and machine-readable state with each milestone. No fake API values or compile-only equivalence; M19 fixes the full signature denominator. Keep projects/generated artifacts/credentials out of source. Human review/Apply, stale revision protection, isolated proposals, scoped credentials and explicit publication remain invariants.
