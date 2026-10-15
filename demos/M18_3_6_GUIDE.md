# M18.3.6 / 0.0.44 demos

Run `npm.cmd ci`, `npm.cmd run demo`, then `npm.cmd run dev`. This command creates only **PMD Planning Workshop** and **Agent Workflow Lab**, using persistent Hub storage. It does not regenerate the validated player demos. Select the M18.3.6 labels; existing projects are preserved.

## PMD Planning Workshop

Connect your model. The phase circles show the actual document state: green completed, blue dotted current, blue outline upcoming. Define a small one-room puzzle, approve the definition and plan in chat, then say “Apruebo el plan; omitamos la crítica y construye el PMD por secciones, conservando el alcance aprobado”. The document fills section by section. It must end in `ready`, with overview, requirements, technical design and a roadmap matching the approved milestones. A textual promise is not completion. To change earlier decisions, say “Volvamos al diseño, quiero cambiar…” or “Quiero cambiar la planificación…”. Existing sections remain available while the corresponding approval is reopened. Apply and Save when satisfied.

No Limitless setting is required. A turn that hits the 16-request safety boundary reports an error and retains the document/chat. Export More info rather than repeatedly asking it to continue unchanged.

## Agent Workflow Lab

M1 creates the blue cube and physical floor. M2 creates/compiles/assigns the physical controller. If those steps are already accepted in your existing project, use that project directly rather than repeating them. Save and Stop before a new proposal. Send:

> Agrega cuatro paredes físicas alrededor del piso existente para que el cubo no se caiga. Conserva el controlador y verifica posiciones y colliders. Mantén MAIN sin cambios.

Preview must contain four walls surrounding the floor. Inspect/Play, then Stop. Apply preserves edits made inside preview; Save persists the result. Inspect More info for completed authored checks and actual token totals. You can also run `npm.cmd run eval:agent -- --allow-paid --case=walls` with the local daemon session token configured; this consumes your API budget and is optional.

## Hub and budgets

Click Axiom Engine or File → Hub without closing the project. Select a card to show Open, Delete/Close, Open Folder and Refresh icons; hover about one second for labels. Switching a dirty project offers Save and close by default, discard, or cancel. Dates and creation/save versions are visible in each card. Close Hub with X to return to the current project, or to a blank workspace if none is open.

AI budget/usage belongs to each project. Switch projects to see the corresponding meter and limit. Reset project counter in AI configuration clears that project's meter only; it does not reset OpenAI charges. Allow browser notifications on Send if you want desktop alerts; an in-app response alert remains available otherwise.
