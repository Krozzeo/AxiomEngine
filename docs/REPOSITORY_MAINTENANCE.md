# Repository maintenance and recovery

Owner authorized latest0.0.52 as main and recovery before restructuring on2026-10-20. Main advanced from 16c065c88f51780d489bf60082c73873a60db31d to e264ca835de14daf4fe964be6a78be5e4646ad14 retaining304 commits. Later changes go through review PRs, not history rewrites.

| Fixed reference | Commit | Purpose |
| --- | --- | --- |
| recovery/pre-restructure-0.0.52 | e264ca835de14daf4fe964be6a78be5e4646ad14 | Exact delivered product |
| recovery/old-main-2026-10-20 |16c065c88f51780d489bf60082c73873a60db31d | Previous M0/main |

Retain archive/main-before-0.0.52-2026-10-20 and archive/pre-restructure-0.0.52-2026-10-20 as extra backups. Never move/reuse recovery tags. [Source recovery ZIP](https://github.com/Krozzeo/AxiomGameEngine/archive/refs/tags/recovery/pre-restructure-0.0.52.zip) contains source, not installer/user projects. Fetch tags and create a separate recovery branch; copy complete user projects/resources separately. Git refs do not preserve ignored files, external data or credentials. Restore through reviewed changes rather than forcing main.

Historical inventory had46 branches/45 openPRs (23drafts); all heads were verified ancestors of the recovered delivery before consolidation/removal. Preserve any branch with unique changes. [Original inventory](archive/pre-restructure-0.0.52/github-inventory.json) retains names/SHAs/URLs. Current/historical docs remain separate.

Main requires PR/up-to-date branch/All required checks with no bypass, force-push or deletion; zero outside approvals for sole-maintainer workflow. Recovery rule blocks ref update/deletion/force-push.22 nativeM19–M40 milestones, classification labels, auto-delete merged branches and recovery prerelease were configured via user-authenticated browser without extracting Git credentials. [Main rule](https://github.com/Krozzeo/AxiomGameEngine/rules/25508502), [recovery rule](https://github.com/Krozzeo/AxiomGameEngine/rules/25508420). Administrative state is historical, not a fresh audit here.

CI 320 (42/45) exposed Inspector detachM18(#47), preview-after-StopM18.2(#48) and reloadHubM7(#49). Local passes did not close intermittent remote failures. Stale editor-sync replies were reproduced and guarded by snapshot/generation checks with 3 deterministic tests/441 Node. Later browser-state synchronization corrected misleading preview waits; historicalCI 329 (46/46) and #48/#49 closures remain evidence of that slice. A later same-base run failedM17(#51); P3CI 336 (43/46) retainsM17/M18.3.11(#55)/aggregate failures. Current status/report determines new closure; never weaken assertions/timeouts to hide a regression.

Dense physics, real model/account/native-dialog acceptance and GPU roadmap remain independent. Exact original chronological investigation/results are retained in [the original-language source](archive/original-language/docs__REPOSITORY_MAINTENANCE.md.txt); consult it for detailed provenance rather than treating these summaries as new tests. Main/recovery refs are unchanged by P4.
