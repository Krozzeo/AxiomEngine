# M18.2 Editable Preview Workshop

Run `npm.cmd run demo` once, start `npm.cmd run dev`, then File → Projects → Refresh list → **Demo · M18.2 Editable Preview Workshop** → Open. Existing projects are preserved. The scene starts with Workshop Cube, a camera and explicit lighting. Notes/Workshop.json contains the exercise. No AI request runs automatically.

Connect your model through AI → Config AI assistant. Use the same model/settings as your previous test and send:

> Inspect Workshop Cube, move it to X=2, change its material to blue, create a floor and verify the authored result. Keep MAIN unchanged and summarize actual checks.

After completion preview opens automatically, without starting Play. You should see a blue cube and floor, the Preview indicator and Save locked. Actual results depend on the model; check its summary/diff rather than assuming the prompt succeeded.

- Review changes opens the diff in chat. Close review and use Scene/Inspector normally.
- Preview toggles to MAIN and back. MAIN retains its original cube; the floor exists only in the proposal.
- Move Cube to X=5 in preview, then Apply: X=5 stays. Apply exits preview and leaves a dirty MAIN draft; Save persists it.
- In a separate run, leave a proposal at X=2, exit preview and change MAIN X=5 (add an unrelated object too). Return and Apply. Confirm replacement: final Cube is X=2 and the unrelated MAIN addition disappears. Restore pre-Apply MAIN recovers both as an unsaved draft.
- Play/Stop in preview checks the proposal without publishing runtime movement. Discard leaves MAIN intact.
- Send another chat request to improve the pending proposal; it uses the same branch.
- Task steps and usage: Requests X/Y plus up/down arrows browse previous/current task cards. Inspect every request's input/cache/output/reasoning totals.

Only the live model's actual request/token improvement needs account-specific checking. Controlled CI covers branch editing, Play/Stop, Save lock, Apply/Discard/recovery, reload/restart, scripts/resources and task history. Do not share your API key.
