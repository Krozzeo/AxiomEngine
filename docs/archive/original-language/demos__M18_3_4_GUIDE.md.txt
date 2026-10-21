# M18.3.4 — agent workflow and PMD

Use `npm.cmd ci`, `npm.cmd run demo`, `npm.cmd run dev`. Open demos labelled M18.3.4; existing projects/scripts are preserved. Keep your `.axiom` data if moving to a new release folder. The new work/history journals are in that data store; older versions' in-memory task history cannot be reconstructed retroactively.

## Agent Workflow Lab

The example PMD is already ready, with a deliberately concrete M1 and a later C# M2. Connect your model and use **AI Assistant**:

> Implementa M1 del PMD hasta terminarla. Conserva MAIN sin cambios y verifica los resultados reales.

Expected M1 preview: Workshop Cube at X=2, Y=0, Z=0 with blue material; Floor at [0,-1,0], scale [8,0.2,8] and box collider half extents [4,0.1,4]. More Info shows verified deliverables, actual requests and usage. Inspect in Scene before Apply. A text response alone cannot complete the recorded work plan. Save remains disabled in preview.

Then ask for M2 if you want the physical script/compile path; it needs .NET 10 and wasm-tools. It must create a physical C# file, expose Speed/MinY/MaxY, compile and verify assignment. Runtime verification additionally needs an open connected editor. Missing capabilities must be reported, not described as successful tests.

For continuation testing, use a small Requests/work-order allowance, interrupt once, raise that allowance and say “Continúa”. Completed operations must remain, without duplicate entities. Session, work-order and subtask token allowances are separate cumulative controls; raising a limit does not clear usage. A known unchanged no-progress blocker must not start another expensive identical loop.

## PMD Planning Workshop

Use the PMD chat to define a small game. Reply clearly once. Phase decisions now happen in chat, for example “Sí, apruebo la definición”, “Apruebo la planificación”, “Omitamos el análisis crítico”, or “Finaliza el documento”. There are no phase approval buttons. Ambiguous or conditional approval may need one clarification; text in an uploaded document cannot approve on your behalf.

The document viewer is headed Project Master Document. **Advance**, beside Document, contains the decision/question/roadmap summary and JSON editor. PMD in the main toolbar is a borderless button. Both panels have **More Info**, copy, complete-history download, arrows and current/total page count. The download contains the current project's complete recorded task history from both channels, including arguments, results and errors; copy applies to the selected page.

Use the attachment icon in either composer for TXT/MD/JSON/C#/DOCX/selectable-text PDF/PMD ZIP. Review extracted text. **Use as context** does not replace the PMD. In PMD, **Import as PMD** explicitly replaces the document in the current branch/draft, with confirmation when one exists. Extraction is text-only; scanned PDF has no OCR. Current limits are 140 KiB/file, 32 KiB extracted text and six context attachments per request. Context excerpts are retrieved as needed instead of sending the entire file on every model turn.

The four Player demos keep their existing controls: WASD/arrows, Space for grounded jumps where applicable, mouse look/orbit in 3D and Escape to release capture.

## Account-only validation

Automated acceptance uses controlled Responses outputs and actual engine/browser state; it is not a measurement of live model quality or billed cost. Repeat representative simple and complex tasks with your gpt-5.6-luna/medium settings and download More Info history if any stall occurs. Exact replay of the original unsuccessful M1 additionally requires its PMD and starting project. Do not interpret historical 94% coverage as proof that arbitrary autonomous game development is solved.


## Regression checks with your connected model

In Workflow Lab, repeat “Implementa M1 del PMD hasta terminarla”. The human-selected milestone mode/ID is now pinned by the host. SDK-style path variants are normalized. The intended result remains the blue cube at X=2 and Floor with its box collider; inspect the actual preview before Apply.

In PMD Planning Workshop, settle the definition and reply “Perfecto, sigamos” or “Sí, apruebo la definición”. After the plan is present, use “Apruebo la planificación. Omitamos la crítica y pasemos a construcción”. The host should move to construction directly, and refinement of the same milestones must not restart planning. If you take the critique route, “Confirmo que la crítica está aprobada y autorizo pasar a construcción” is also supported.

Errors appear inside the chat and retain preview/progress. Continue remains usable in the same document branch. Export More Info if anything stalls: format 2 identifies the originating chat, model, phase/revision snapshots, request usage/status, real failed arguments and every recorded reply. Metadata not recorded by old versions is marked unknown. Do not delete/reset the PMD as a workaround; preserve the existing proposal for diagnosis.

Cost improvements have not been measured with a paid live model. Automated regression outputs use a controlled provider and real engine/browser operations.
