# M19 measured scope and relative implementation weight

These are declared signature counts, not implemented percentages, hours or complexity. Cross-cutting GPU/shader/export gates add work beyond these counts. No conversion to historical MVP points is valid. Whole-project effort remains unestimated until vertical batches supply measured throughput.

| Area | Declared signatures | Share of profile | P0 | Partial name candidates | Verified source / behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| M20 | 311 | 0.63% | 311 | 119 | 0 / 0 |
| M21 | 1245 | 2.52% | 1100 | 147 | 0 / 0 |
| M22 | 1165 | 2.35% | 499 | 65 | 0 / 0 |
| M23 | 336 | 0.68% | 45 | 16 | 0 / 0 |
| M24 | 282 | 0.57% | 282 | 53 | 0 / 0 |
| M25 | 588 | 1.19% | 527 | 153 | 0 / 0 |
| M26 | 458 | 0.93% | 0 | 64 | 0 / 0 |
| M27 | 2565 | 5.18% | 694 | 180 | 0 / 0 |
| M28 | 173 | 0.35% | 0 | 0 | 0 / 0 |
| M29 | 538 | 1.09% | 0 | 95 | 0 / 0 |
| M30 | 6339 | 12.81% | 0 | 29 | 0 / 0 |
| M31 | 1387 | 2.80% | 0 | 29 | 0 / 0 |
| M32 | 556 | 1.12% | 0 | 13 | 0 / 0 |
| M33 | 1551 | 3.14% | 0 | 3 | 0 / 0 |
| M34 | 2260 | 4.57% | 0 | 4 | 0 / 0 |
| M35 | 312 | 0.63% | 0 | 30 | 0 / 0 |
| M36 | 367 | 0.74% | 0 | 67 | 0 / 0 |
| M37 | 2848 | 5.76% | 0 | 24 | 0 / 0 |
| M38 | 17285 | 34.94% | 0 | 0 | 0 / 0 |
| M39 | 8905 | 18.00% | 0 | 29 | 0 / 0 |

Implementation priority: first M20 object identity/lifetime and M21 numeric contracts, then M22 scheduling, M23 serialization and M24 scenes/resources. Follow roadmap dependencies for physics, renderer, devices and editor APIs. A large signature share is not a priority override.

M20 first batches: Object equality/null/destroyed wrappers and instance IDs; GameObject/Component ownership/lookups; Transform hierarchy and parenting. Reproduce and close the two corpus discrepancies before widening claims. Keep batches around20–40 audited signatures with exact overloads, bridge, tests and editable examples.
