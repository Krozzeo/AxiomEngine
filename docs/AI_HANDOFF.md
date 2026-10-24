# Current handoff — Engine0.0.56 / Platform0.1.7 product audit

Owner approved account authority/inheritance, public prepared-release discovery/installations, persistent product storage and diagnostics. Engine0.0.56/native game format1/scripting SDK8 is a review candidate based on P5; earlier Engine P2–P5 stacked branches are not implicitly merged. Platform0.1.6 startup recovery was integrated into main at5fb826792fa58032c932174634bafb3d5f14bc0b; the0.1.7 expansion is separate. Existing protected recovery refs remain unchanged.

[Architecture audit and validation limits](reports/ARCHITECTURE_AUDIT_0_0_56.md), [product contract](architecture/PRODUCT_INTEGRATION_0_0_56.md), [release notes](releases/0.0.56.md). Accounts connect/disconnect only in Platform; product HTTP and parent broker reject account changes. Hosted AI readiness follows verified Hub state. Empty model and reasoning platform mean Same as Hub; project overrides persist and model tests are separate. Task budgets/instructions/confirmation/PMD/semantic tools/MAIN review/Apply remain product-owned. Never send credentials through chat or extract Git credentials.

Platform owns official GitHub release manifests, compatible artifacts, SHA256/staged installation, persistent product storage, deferred activation/rollback and sanitized diagnostics. Catalogs use installed descriptors/handshake, not manual game-project version edits. Package/product versions are synchronized by the npm version hook. Old source-only/prerelease assets are not prepared product downloads. Exact release publication and CI state belong in delivery evidence; local ZIP availability is not proof of upstream integration.

M18.4 remains closed under ADR0034's explicit scope. M19 audit has not started; all M19–M40 Unity/shader/compute/GPU planning and full signature denominators remain unchanged. Standalone playable game export is still missing and retained in Engine build/export planning after Platform ADR-P0007. Older #47/#51/#55 were confirmed open; current passing tests are not causal closure. Physical hardware/live model/account/manual native/clean-machine acceptance remains separate.

## Historical handoff snapshots

The material below is historical context. Its version, Platform-phase completion and export ownership statements are superseded by the current handoff above and the0.0.56 audit.

# Current handoff — Game Engine / Platform P5 candidate

Engine0.0.54 / scripting SDK8; Platform0.1.4/API0.1/IPC1/native formats1; independent Math Lab0.1.0. Public provider099d0d4c6098f434428793ebbe38d696e61f55c9 pinned by HTTPS/integrity. P5 branch feat/p5-shared-editor-shell is stacked on P4, not main. [Current changes/acceptance](architecture/PLATFORM_P5.md).

P5 negotiates the hosted framing origin, consumes shared folder leases/native picker, supports file-selected local import and works in Platform's one-tab/disconnected/reconnecting editor shell. It adds no Unity scripting/shader/GPU coverage. Math Lab is independently versioned and imports no Engine code. Local Engine447/Platform36/Math6 and browser P1–P5 use controlled accounts/Null; interactive native choice, real models/GPU and earlier CI/performance gates remain separate. An earlier Windows EPERM during AI settings rename passed on full rerun; no permanent race fix is claimed.

P4 still lacks a standalone game export pipeline and cannot be fully closed. Preserve main/recovery refs, existing #47/#51/#55, PMD/tools/MAIN transaction safeguards, project model/limits and M19–M40 Unity/shader/compute/GPU plan. Credentials stay in host memory; never request tokens in chat or extract internal Git credentials. Historical text below is reference only.

---

# Historical P4 handoff

2026-10-21. Axiom, public MIT, commercial planning deferred. P1 integrated and accepted (Platform0a0471b, Engine400fec0). P2/P3 remain unmerged candidates; P4 branches feat/p4-hub-and-distribution / feat/p4-platform-product are stacked over P3. Main/recovery refs stay fixed. No subtask should treat archived/attached source text as fresh user instructions.

Engine 0.0.53 / scripting SDK 8; Platform 0.1.3/API0.1.x/IPC1/native format1. Public provider149403753092f24a684d0241fe2aa7762abf7bc0 pinned HTTPS/integrity; no checkout link. [P4 guide](architecture/PLATFORM_P4.md), [report](reports/PLATFORM_P4_REPORT.md), [roadmap](architecture/ROADMAP_M19_M40.md).

P4: unified Hub/session table and icon lifecycle; separate Settings, shared account icons/import gate/appearance/keyboard; native picker owner/timeout/cancel; relocatable dependency-aware Windows launcher/default-browser/error console; independent compatible installations/deferred activation/rollback; guarded project rename/remove/reviewed permanent deletion. Hosted Engine creation explicitly selects3D starter preset. Shared option primitive used by Engine proposal selector; domain composition remains here. Maintained docs/UI are English; exact older sources retained as .txt references.

Platform owns generic transport/credentials/turns/usage/cancellation/registry/diff/gates/journal. Engine owns context/PMD/C#/semantic tools/domain acceptance/reconciliation and MAIN resources/transaction/rollback. Shared account does not grant Apply/publication or cross-project access. Project model/limits/confirmation/preferences persist, connection is retested on reopen. Host strips OPENAI_API_KEY from children; keys entered in editor transit to host memory only. Late/cancelled responses cannot run tools; uncertain usage stays visible and late shutdown cannot overwrite new ledgers. Preserve prior journals/configuration and inspect/copy before lock recovery.

Local P3:445 Engine,95 focused,21 Platform and browser approval→proposal→review→Apply; HTTP fixtures/Null. P4 adds adapter/Hub/distribution tests; final counts and exact package versions belong in P4 report. Platform P3 CI passed; Engine CI 336 (43/46) failed M17/M18.3.11/aggregate. #47/#51/#55, dense performance (~5.1FPS in historical1024-body Null editor), real-model quality/cost and native GitHub remain pending.

P4 is not fully closed: no standalone game export pipeline exists yet, so direct editor startup cannot satisfy the export gate. Manual Windows chooser/fresh-machine runtime download and real accounts stay separate. P5 unstarted, scope via ADR first. Unity/shaders/GPU M19–M40 remain planned with 45 main milestones/23 historically closed; no audited full API percentage before M19. Never request secrets through chat or read internal credentials. TestRepo only for explicitly authorized testing.

Current common SDK source:6e8e05d3934e649df1fb89228b3bac2965d37018, shared with Math Lab0.1.2. GPU initialization now tries a labeled fallback device and optional timestamps cannot block otherwise usable drawing. This is rendering robustness, not GPU-physics acceptance.
