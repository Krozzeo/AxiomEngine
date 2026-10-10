# M18.2.1 Script Efficiency Workshop

Run `npm.cmd run demo`, then `npm.cmd run dev`. Open **Demo · M18.2.1 Script Efficiency Workshop** from Saved projects. Existing projects remain intact. The workshop starts with a cube, camera and lighting; no AI calls occur until you send a request.

Connect your model in AI → Config AI assistant. Keep the same model and reasoning settings as your previous measurement, then send:

> Crea un script y asignalo al Workshop Cube, que haga que el cubo se mueva en Y de forma sinusoidal entre y=1 y y=2. Compila y verifica el resultado. Mantén MAIN sin cambios.

The authored preview should contain a physical C# file and one Script component on the cube. Completion requires a successful build of those sources. **Play** should oscillate the cube between Y=1 and Y=2; Stop restores the authored scene. Preview / Exit preview compares MAIN and the isolated proposal. Apply adopts the entire proposal and retains the current panel; save explicitly afterwards.

**More info…** holds the usage history, review and pre-Apply MAIN recovery. Requests and actual input/cache/output/reasoning tokens are provider-reported. Compare totals with the prior 425,505-token, 99-request attempt; automated adapters do not measure live model quality or cost. Limitless removes a selected local cap and persists, but cannot remove provider limits, compiler timeouts, cancellation or tool validation. It increases exposure to billable work; use finite limits unless needed.

No manual UI or runtime acceptance is required after CI. Only the same-account/model token comparison cannot be performed without the user's API account.
