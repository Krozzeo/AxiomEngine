# M18.1.1 — discovery repair and assistant interface

Version 0.0.34; verification in progress. The user confirmed live connection succeeds, but the real agent made five failed api.describe calls. That invalidates a successful live tool-loop claim; M18.1 remains 7/8 (87.5%) and the expanded project remains approximately 83% until a corrected live task is verified.

The bootstrap only advertised tool names and told the model to discover schemas without supplying api.describe's own required kind/name contract. The fix supplies discovery schemas and an exact example up front; a supported tool name defaults unambiguously to kind=tool when omitted. Invalid tool arguments return the precise schema and a scope hint for recovery. This does not accept wrong authority or publish changes. Controlled regressions now run discovery before inspect/edit/verify, instead of skipping it.

Configuration is a native modal window with keyboard dismissal/Close. Opening loads available models using the existing daemon credential; when no credential exists, entering a key triggers listing. Reload is an icon beside the actual select. GET /models returns identifiers, not full capability metadata. A catalog identifies known compatible text/tool families and excludes only documented incompatible specialized endpoints. New/unknown/fine-tuned models remain listed in italic with an untested label; listing sends no generation request and is not live capability proof. Explicit Connect and test remains billable and account access must still be verified.

Chat: Enter submits except during IME composition; Shift+Enter inserts a line. Accessible name remains without a visible input label. The composer starts at one line, grows to ten and then scrolls. Animated waiting dots show active tasks, with reduced-motion support. Task steps/usage sits at the upper right and opens a bounded popover inside the panel, remaining open until toggled.

16 backend tests pass, including discovery recovery and zero-generation model filtering. Browser acceptance and full regression CI are pending. Documentation/evidence will be finalized after verification; no current browser success claim yet.

Only necessary user check after delivery: repeat the failed Workshop request with the connected account and inspect actual successful discovery, edits and proposal differences while MAIN remains unchanged. No need to repeat previously confirmed connection. Never share the key. Editable replacement preview still belongs to M18.2.

References: https://developers.openai.com/api/reference/resources/models/methods/list and https://developers.openai.com/api/docs/models (reviewed 2026-10-10).
