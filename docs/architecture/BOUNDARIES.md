# Module boundaries

| Module | Owns | Must not own |
| --- | --- | --- |
| Editor | human interaction, panels, view state | engine truth, project filesystem |
| Protocol | schemas, envelopes, command/event contracts | transport-specific business logic |
| Core | IDs, time, foundational runtime primitives | DOM, editor, filesystem |
| Runtime | compiled world and system scheduling | authoring UI |
| Renderer | Render World consumption and GPU resources | gameplay state |
| Physics | simulation and spatial queries | editor concepts |
| Assets | source/derived graph and resource identity | UI state |
| Scripting | ScriptRuntime lifecycle and bindings | direct DOM/filesystem access |
| Diagnostics | reasons, evidence, metrics and bounded traces | hidden corrective behavior |
| Daemon | scoped files, builds, Git and adapters | gameplay rules |

Cross-boundary operations use typed commands, immutable events or deliberately
small interfaces. CI scans forbidden imports immediately; Rust crate graph and
generated-schema conformance will strengthen enforcement as modules land.

