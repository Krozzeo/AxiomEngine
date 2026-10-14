# M18.3.5 demo guide

Run npm ci, npm run demo, then npm run dev. Demo creation uses the Hub's configured persistent root (Documents/Axiom by default), so fresh demos appear in Hub. Projects from earlier release folders can be copied with Import previous projects; originals remain unchanged. Each project row displays its creation/save versions and full path. Select the M18.3.5 labels, not earlier duplicates.

## Agent Workflow Lab

Open the fresh lab and connect your model. Set bounded limits rather than Limitless. Send “Implementa M1 del PMD hasta terminarla”. Preview should contain Workshop Cube at X=2, blue, plus a physical Floor. MAIN must remain unchanged until Apply. Inspect/Play if desired, Stop and Apply, then Save.

Send “Genial, continua con M2”. The lab requires a physical Scripts/WorkshopMotion.cs with Speed, MinY and MaxY, compiled and attached to Workshop Cube. Open Game so runtime checks are possible. Compare actual Inspector assignment/compiled state and Play behavior with the agent's reported checks. Compilation errors and unavailable runtime must be explicit; a status message alone is not proof.

More Info shows task checks/progress and usage. Export the complete history on failure. Existing code does not guarantee a live model's token budget or success; this release addresses host contracts and bounded recovery.

## PMD Planning Workshop

Describe a small puzzle, settle ambiguities and approve definition/plan in chat. Critique is optional. Request construction. The viewer shows committed sections as they arrive, keeps expanded sections visible and reports Sections X/4. The roadmap section comes from your approved milestones; the agent writes overview, requirements and technical design and may add further sections within the existing document budget.

The host finishes when required sections and roadmap checks are satisfied. You should not need another message containing “finalizar”. A real change to the approved roadmap returns to planning for approval. Cancellation preserves committed sections/chat. Review and Apply remain separate from construction readiness.

## Hub / persistent project exercise

Without an open project the Hub is shown. Create a disposable 2D/3D/Empty project, close it through File and reopen it from Hub. Check folder/version display. Cancel a delete prompt and confirm that the project remains; delete the disposable project when finished.

Configure a storage root while no project/proposal is active. This selects another repository of projects; it does not move previous ones. On Windows the default resolves the OS Documents folder, including redirection. Enter the older release’s .axiom/projects folder in the import path and copy with Import previous projects, then open one. Older/unknown versions warn before opening; opening itself does not migrate or rewrite it.

## Optional measured live evaluator

The evaluator makes paid calls only when explicitly opted in. Keep a disposable Lab/Workshop open, saved and stopped on MAIN; connect the model and leave the editor open. PMD case starts with an approved plan in critique/construction. M2 requires the real .NET compiler and connected editor.

PowerShell:

```powershell
$env:AXIOM_SESSION_TOKEN = 'local daemon session token'
npm.cmd run eval:agent -- --allow-paid --case=scene --max-tokens=50000
# Other cases: --case=m2 or --case=pmd
Remove-Item Env:AXIOM_SESSION_TOKEN
```

This is the token printed in the local editor URL, not your OpenAI API key. Reports are written to .axiom/live-evaluation. The harness bounds each run and restores configured limits without resetting token usage. It exports evidence and discards only its own isolated proposal. Custom --objective and repeated runs are available, but compare equivalent tasks/models; report completion and cached/uncached usage separately from actual dollars. Do not put API keys or local tokens in a Git repository.

## Player labs

The four existing Player demos remain available with fresh M18.3.5 labels. Their movement, physics and camera checks were covered previously; this correction does not require repeating those manual checks.
