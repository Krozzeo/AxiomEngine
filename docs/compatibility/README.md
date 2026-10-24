# M19 compatibility baseline

Engine0.0.57 / SDK8 / native formats1. This is a measured audit and an executable observation harness, not new Unity API implementation.

| Independent scope | Frozen records | Interpretation |
| --- | ---: | --- |
| Unity6000.3.27f1 declared managed profile | 49,471 | Public/protected declared signatures,94 assembly sources; no duplicated inherited/accessor methods |
| Published6000.3 ScriptReference | 40,126 | Named documentation contracts/overloads/messages; overlaps the ABI, never add totals |
| External package API UIDs | 75,743 | 126 package recommendations; 29 blocked inventories; separate denominator |

1,120 ABI records have an alias owner/name candidate in SDK8. **0% exact native Unity source signatures and0% full behavior signatures are formally certified.** This is a new strict measurement baseline, not evidence that existing working SDK functions disappeared. Aliases, float/double differences and behavior gaps prevent certification. The corpus has25 successful observations and2 known discrepancies, not27 compatible signatures.

- [Compatibility contract](CONTRACT.md), [profiles/GPU thresholds](PROFILES_AND_GPU.md), [relative scope weights](SCOPE_WEIGHTS.md).
- [Frozen ABI manifest](native-snapshot.json), [published manifest](snapshot.json), [SDK mapping](coverage.json), [packages](packages.json), [inheritance](inheritance.json), [6.6 type-only delta](unity-6.6-type-delta.json).
- [Demo instructions](../../demos/M19_GUIDE.md), [M19 report](../reports/M19_REPORT.md), [reproduction tools](../../scripts/compatibility/README.md).

Open **Help → Compatibility Observatory** in a connected editor. Select declared ABI, published reference or packages; search signatures and filter assignment/priority/status. The authenticated read-only endpoint is `/v1/compatibility`, with bounded pagination. Files are immutable baseline facts; SDK mappings evolve separately. Future implementations must attach exact IDs/overloads and behavior evidence before changing status.

The main implementation target includes both runtime and editor. Windows/Android/iOS metadata is an explicitly captured profile, not proof of every device/platform. The complete published catalog remains alongside it. M37 resolves platform deltas and M39 cannot close on a favorable profile alone. Missing package indexes/versions stay blocked until pinned; they are not removed to improve coverage. The6.6 TOC artifact measures type navigation names only, not API additions/removals.
