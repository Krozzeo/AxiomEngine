# M18.1 — OpenAI Assistant Workshop

Version 0.0.33 (development; see current report for executed acceptance).

Preserve the complete `.axiom` folder when upgrading. Run:

```powershell
npm.cmd ci
npm.cmd run demo:m18-1
npm.cmd run dev
```

The command adds **Demo · M18.1 AI Assistant Workshop** without deleting existing projects. Open it from File → Projects. It starts with Workshop Cube, a Camera with listener, a directional light and ambient fill. Notes/Workshop.json contains suggested requests. No connected model or deterministic repair is launched automatically.

## Connect your own account

AI → Config AI assistant: enter your OpenAI API key locally, Load available models, choose a text/function-calling model available to your account, then Connect and test. Model listing does not prove function-call compatibility; the explicit test does. The test makes one small billable Responses request. Task requests are billed by your OpenAI API account, not your ChatGPT subscription. Never send the API key in chat or add it to project files.

The key stays only in daemon memory. Browser refresh preserves the daemon connection; daemon restart requires reconnection. Alternatively set OPENAI_API_KEY in the daemon's environment before starting it. No key is written by Axiom to project files, exports or browser storage. Disconnect cancels the active task and clears the daemon credential. There is no persistent encrypted credential vault in this release.

Configure requests, tool calls, token budget, output tokens and seconds per task. Token reservation conservatively counts input bytes plus maximum output; actual reported usage is shown separately. These application limits are not an account-wide monetary spending cap. Configure account-level spending separately. No fixed model price is embedded or promised.

## What to ask and see

Connection automatically opens AI Assistant in the center. Talk to AI assistant or Panels → AI Assistant reopens/focuses it. It docks, closes and detaches like other panels. The toolbar shows blue AI Agent when tested/connected, gray crossed icon when disconnected, and AI Working with spinner during work. PMD indicates whether the current manual master document is loaded. AI Master remains disabled `(planned)`.

Ask:

> Inspect Workshop Cube, move it to X=2, change its material to blue, create a floor and verify the authored result. Keep MAIN unchanged and summarize actual checks.

The model chooses multiple sequential semantic-tool actions. Expand Task steps and usage to inspect actual calls, failures and reported tokens. A task may query documentation/schema, edit entities or physical project scripts, compile and inspect errors, then correct them and verify. It has no shell or engine-source access. Runtime tests require the connected editor and real proposal preview; unavailable evidence is not a pass. Capability limitations or budgets may stop the task with a partially edited proposal retained for review/discard.

The original scene remains unchanged while the assistant works. Press **Review proposal** to open the existing AI proposal menu, review differences, then Preview/Return to source or Accept reviewed changes/Reject. Accept affects the draft; explicit Save persists it. This release retains stale-source rejection; replacement-based Apply and editable/automatic preview arrive in M18.2.

Before accepting, keep Continue pending proposal checked and ask:

> In the same pending proposal, move Workshop Cube to X=5 and verify its position.

It should adjust the existing proposal rather than creating another. The result depends on your model; verify the actual differences before accepting. Use Cancel task to stop work; cancellation does not accept or save anything. Chat/task histories survive browser reload only while the same daemon is running; pending proposals are already persisted separately.

## Verification boundary

Automated acceptance uses controlled Responses payloads with the real daemon, command bus, proposal journal and browser UI. It verifies multistep orchestration and isolation without API charges. It does not establish availability, credentials, quotas, live API compatibility or natural-language task quality for your account. The account-specific check is to connect locally and run the workshop request once; report the visible error if it fails, never the key.
