# Compatibility contract v1 — M19

Target: Unity6.3 LTS, exact managed reference profile6000.3.27f1. This contract freezes interface facts and acceptance rules. It does not implement M20–M39 APIs or certify existing aliases as compatible.

## Denominators and identity

`native-snapshot.json` / `native-api.jsonl.gz` is the complete declared managed profile captured from Windows editor assemblies and Android/iOS editor extensions. It retains public and protected exported Unity-namespace type/member contracts, enum constants, generic constraints, visibility, accessors, defaults, modifiers, obsolete attributes, base types and interface relationships. Property/event accessor methods are represented by their parent contract rather than counted again. Inherited declarations are counted once at their declaring type. Multiple assembly copies retain provenance and any differing profile shapes. Other target-platform deltas remain separate M37 profiles; they are never silently treated as supported.

`snapshot.json` / `unity-6000.3-api.jsonl.gz` separately freezes every named English ScriptReference entry in the official offline archive, including overloads, legacy/obsolete entries and script messages. Broken display headings do not override canonical namespace/nesting/generic arity. Blank/navigation pages remain in the provenance ledger with hashes and reasons; no signature is invented for them. Missing published declarations are supplemented from pinned C# reference or compiled metadata, with provenance. Confirmed internal/private entries and module descriptions stay visible as such. This catalog and the ABI are overlapping reference profiles: **never add their totals**. Script messages are a separate semantic-contract denominator because they need not be declared methods on MonoBehaviour.

External package recommendations, exact versions where stated, API UID inventories and blocked entries are in `packages.json` / `package-api.jsonl.gz`. Package UIDs are not complete return/accessor declarations or verified binaries. Package coverage and unresolved versions/indexes remain separate M39 gates. The6.6 type delta is tracking information and cannot enlarge, shrink or credit the6.3 target implicitly.

Stable IDs derive from canonical owner/kind/signature. Source hashes, assembly hashes/MVIDs, release metadata and exact versions are retained. Any denominator change requires a versioned baseline diff and review; unsupported members cannot be removed to improve a percentage. Raw Unity archives/DLLs/implementation code are not included in Engine or its distributable.

## Classification and metrics

- **Compatible:** exact source signature plus attributed behavior acceptance for the claimed profile. Match namespace, nesting, generic arity/constraints, parameter and return types, ref/out/in, defaults, named parameters, accessors, static/instance, inheritance and exceptions.
- **Partial:** a mapped Axiom alias declaration exists, but its overload, numeric or behavioral equivalence is unproven or differs. Name/generic-arity candidates are discovery only.
- **Pending:** no mapped declaration/implementation has been established.
- **Blocked:** explicit unavailable metadata, platform, device or service dependency. Preserve identity and denominator.
- **Out of scope:** only a documented scope reason, such as confirmed non-public metadata. Preserve the entry and publish exclusions separately.

Native-source coverage and behavior-signature coverage are separate. The current `Axiom.Gameplay` namespace is an alias surface; it does not let an unchanged `using UnityEngine` script compile. Float/double differences, synthetic values, immediate resource operations or successful compilation alone do not count as conformance. The existing SDK remains useful; zero formally verified target signatures is not a claim that it has no functioning APIs.

M39 requires at least95% of the full core target profile and100% of P0, with package/platform/blocked metrics published independently. A whole-API headline cannot use a favorable subset denominator. Assignment/priority rules are explicit planning policy, not evidence of implementation. Counts per milestone measure relative scope, not hours, complexity or actual development time; GPU/shader infrastructure has additional workload gates.

## Behavioral acceptance

Each accepted signature needs a traceable case set: positive behavior, invalid/edge inputs and lifecycle/resource ownership. Verify return values, mutations, exceptions, callbacks, references, timing, persistence, Play/Stop and relevant visible output. Full-signature acceptance needs all relevant overloads and profiles; a family test cannot certify every member. Keep expected and observed results separately. A known discrepancy must remain failing conformance even when the harness correctly reproduces it.

The editable M19 corpus executes through the ordinary Engine compiler/runtime and project/resource APIs. It observes object/hierarchy, mathematics, time, physics, resources and scene behavior. It records confirmed reference-equality/deferred-destruction discrepancies for M20/M22. The harness gate checks execution, exact discrepancies and authoring restoration; **a passing harness is not a passing Unity conformance suite**. No Unity executable or live account is used by these tests. An actual Unity6.3 comparison run is a distinct oracle profile, not fabricated from a newer installed editor.

## Cross-product boundary

Platform owns accounts, generic services, installations and project sessions. Engine owns this reference, C#/scene/domain tools and compatibility observations. No Unity DLL is linked into the game runtime to simulate implementation. Preserve human reviewed Apply, project revision checks and isolated agent proposals.
