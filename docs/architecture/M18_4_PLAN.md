# M18.4 — GitHub integration

Status: not started. Depends on M18.1–M18.3. Integration concerns the user's game project, not automatic publication or modification of the Axiom engine repository.

Connect an account, select/create a repository, configure a publication branch and display repository/branch/last publication. Top-bar GitHub indicator uses the GitHub icon normally when connected, gray with diagonal strike when disconnected; show pending publication separately from authentication. Credentials stay outside projects, exports and model context.

Publish applied, persistently saved project state on explicit request, or when a milestone completes under an explicit persistent automatic-publication preference. "When the agent deems necessary" is a separate optional preference, never implied. Summarize changes and link the resulting commit. Pending previews cannot publish. Exclude credentials, temporary data and rebuildable compilation output; include enough canonical project content for reproducible reopening.

Local proposal branches are independent of Git branches. Do not force-push, rewrite history or silently overwrite incompatible remote changes. Stop with a clear status when the remote diverges; general merge/conflict resolution and broad collaboration are future work. Handle authentication expiry, network interruption and ambiguous publication results without duplicating or losing data.

Demo/acceptance: connect a test repository, publish a saved demo milestone, inspect changed files and last-publication status, show preview exclusion, remote-divergence stop and safe retry. Automated adapter tests supplement explicit account-specific verification; never publish to an unselected repository.
