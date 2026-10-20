# ADR-0035 — Hub imports, automatic GitHub settings and project defaults

Accepted by explicit user request, 2026-10-20. Revision M18.4.1 / 0.0.52 / SDK 8.

The Hub groups creation, adding projects and storage settings in expandable sections. Every local path has a native folder chooser; Windows uses a local STA WinForms FolderBrowserDialog. A selected project folder is copied into persistent Project Storage, preserving the original. GitHub import reads a commit-pinned canonical Axiom publication and asset originals, validates identity/path/size, stages privately, then uses the same import path. This is an import, not continuous Git synchronization.

A GitHub account credential remains in daemon memory for the whole session, independent of project selection. Repository/branch, publication preferences, mode/name/message drafts and history are scoped to project UUID. Creating a repository is an explicit user action; it now selects/configures the returned repository automatically. Repository selection, branch and preference changes save automatically. Failed configuration preserves the previous valid binding and displays the reason; divergence remains a hard stop.

The user explicitly requests both publication preferences ON by default. This supersedes the OFF defaults of M18.4 for new configurations. Persisted preferences remain unchanged, including a user's later OFF choice. Automatic milestone publication still requires a newly delivered, saved milestone; agent publication still requires a valid saved MAIN plan and is blocked by disabling its independent preference. Enabling does not publish historical milestones. No repository is chosen or created merely by connecting the account.

Opening the panel automatically reviews saved MAIN only when the existing publication guards permit it. One primary action reviews if no plan exists and publishes if a current plan exists. A separate dialog lists changed files. The project history journal retains all recorded events outside project sources and supports pages of 100 events. History includes binding/preferences/reviews/creation/publication/account events and failures without storing token contents. Journal-write failures are surfaced in status and do not rewrite remote history.

Indicators mean disconnected (strike), connected with no configured matching project destination (red), connected with a configured matching destination (green). With no project, only the account matters. A green indicator does not assert that the remote head is unchanged: review checks the expected head before publishing.

ADR-0034's live-account verification deferral remains in force. Local adapter tests are not a claim that a real PAT, OS dialog, account permission or external repository creation was exercised. General pull/merge/LFS and the Rust daemon's broader project-authoring parity remain outside this revision; the normal editor uses the Node daemon and the existing Rust/Wasm runtime.
