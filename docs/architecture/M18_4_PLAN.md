# Orden vigente — 2026-10-19

M18.4 está cerrada en su alcance acordado: nueve grupos aprobados; verificación nativa manual aplazada explícitamente por ADR-0034. Estabilización final se conserva en M40. [Roadmap](ROADMAP_M19_M40.md). La auditoría M19 puede prepararse sin dar por cerrados los gates externos de M18.4.

# M18.4 — GitHub integration

Status: complete (0.0.50; 9/9 agreed required groups; native live-account check deferred by ADR-0034). Depends on M18.1–M18.3. Integration concerns the user's game project, not automatic publication or modification of the Axiom engine repository.

Connect an account, select/create a repository, configure a publication branch and display repository/branch/last publication. Top-bar GitHub indicator uses the GitHub icon normally when connected, gray with diagonal strike when disconnected; show pending publication separately from authentication. Credentials stay outside projects, exports and model context.

Publish applied, persistently saved project state on explicit request, or when a milestone completes under an explicit persistent automatic-publication preference. "When the agent deems necessary" is a separate optional preference, never implied. Summarize changes and link the resulting commit. Pending previews cannot publish. Exclude credentials, temporary data and rebuildable compilation output; include enough canonical project content for reproducible reopening.

Local proposal branches are independent of Git branches. Do not force-push, rewrite history or silently overwrite incompatible remote changes. Stop with a clear status when the remote diverges; general merge/conflict resolution and broad collaboration are future work. Handle authentication expiry, network interruption and ambiguous publication results without duplicating or losing data.

Demo/acceptance: connect a test repository, publish a saved demo milestone, inspect changed files and last-publication status, show preview exclusion, remote-divergence stop and safe retry. Automated adapter tests supplement explicit account-specific verification; never publish to an unselected repository.


## Corte implementado — 2026-10-19

Ver [informe](../reports/M18_4_CURRENT_REPORT.md) y [guía](../../demos/M18_4_GUIDE.md). Autenticación: token de acceso con alcance al juego, conservado solo en memoria y reconexión tras reinicio. Configuración/recibos por proyecto y cuenta en el perfil local externo al almacenamiento de proyectos. Publicación remota aislada bajo `axiom/<UUID>/`; fuentes originales canónicas, sin salida compilada ni historial de conversaciones. Estado de MAIN se serializa con la cola de comandos mientras publica.

Se utiliza `createCommitOnBranch(expectedHeadOid)` para comprobar y actualizar la cabecera de manera atómica. Diario persistente antes del envío; conciliación por identificador/hash y manifiesto en los últimos 50 commits. Divergencia o snapshot cambiado requieren intervención explícita; no hay rebase, force-push ni resolución Git general. Nuevas entregas se detectan en PMD guardado, nunca en previews; la preferencia no publica entregas históricas al activarla.

Las pruebas automatizadas no acreditan autenticación nativa real. Su comprobación manual se aplaza por decisión explícita del usuario en ADR-0034 y no bloquea el cierre del alcance acordado.


La obligación original de cuenta real queda **Deferred por decisión explícita del usuario**, no Passed: [ADR-0034](../adr/0034-m18-4-closure-and-deferred-native-account-check.md). TestRepo se utiliza solo para pruebas conectadas sintéticas, no para demos.
