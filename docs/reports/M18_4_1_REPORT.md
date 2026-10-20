# M18.4.1 — Hub y publicación GitHub

Versión 0.0.52 / SDK 8. Cambios solicitados implementados; no cambia el roadmap M19–M40 ni el cierre acordado de M18.4.

| Área solicitada | Resultado |
| --- | --- |
| Hierarchy: título y Always active a la izquierda, candado/X al extremo derecho | Passed, medición geométrica del navegador |
| Hub: Create, Add Project, Settings desplegables e iconos | Passed |
| Open Project / agregar carpeta y rutas con selector Windows | Passed funcional y contrato Win32; copia persistente con original preservado |
| Importar un proyecto Axiom desde GitHub | Passed, descubrimiento, commit fijado, copia, reapertura y limpieza ante errores |
| Tooltip Auto, Config → GitHub, icono compacto y etiqueta AI | Passed |
| Cuenta conectada compacta, Refresh/Disconnect y lista automática | Passed |
| Destino nuevo/existente, sugerencia de nombre y vinculación al crear | Passed |
| Carga al crear, X y razón ante error, bloqueo de doble creación | Passed con respuestas controladas lentas/fallidas/exitosas |
| Cuenta por sesión; ajustes por proyecto; estados tachado/verde/rojo | Passed, también sin proyecto abierto y al cambiar proyectos |
| Ambas preferencias ON por defecto; sin Save/Use | Passed; preferencias persistidas conservadas |
| Historial persistente en ventana separada | Passed, páginas de 100 con acceso a eventos anteriores; separación por UUID |
| Revisión automática al abrir; botón único Review/Publish y detalles separados | Passed, con los guards previos de MAIN guardado/Play/propuestas |
| X habitual y título GITHUB — GAME PROJECT ampliado | Passed |

## Verificación

- `npm run check`: 438 pruebas Node aprobadas; build, herramientas, bindings, esquemas, arquitectura y paridad aprobados.
- `npm run check:native`: formato, Clippy y 44 pruebas Rust aprobados.
- `test:browser:m18-4`: 12 grupos, dos modos independientes, sin errores de página. Incluye revisión/publicación, preferencias, historial, error y carga al crear, recuperación de respuesta perdida, divergencia y ausencia de credenciales en eventos/storage.
- `test:browser:m18-4-1`: seis grupos de Hub/interfaz; importación local y GitHub, sesión sin proyecto, aislamiento entre proyectos y geometría de Hierarchy.
- [Evidencia local](m18-4-1-local.json). No se han realizado llamadas pagas, creado repositorios externos ni reutilizado un token del usuario.

## Criterios de implementación y límites

Los ajustes se guardan al cambiar/salir del campo, sin botón Save. Los borradores de nombre/visibilidad/mensaje se encolan para que salir del input no consuma el primer clic en Create/Publish. Una operación remota deshabilita sus controles e informa resultado. La creación explícita devuelve el destino, cambia de modo y lo configura; si se creó pero falló la configuración, el panel informa esa distinción y conserva el nombre para recuperarlo sin volver a crear.

La causa exacta del fallo observado con el PAT real no se puede confirmar sin esa sesión. Se corrigieron la ausencia de progreso/feedback y el paso manual posterior; los errores de creación ahora distinguen permisos y nombre duplicado/inválido. Según [GitHub](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user), crear requiere Administration write o Repository creation write con un token fine-grained y acceso adecuado al destino. Publicar continúa requiriendo Contents write. Una respuesta no confirmada no se interpreta como creación fallida segura para repetir: se indica refrescar repositorios.

Importar desde carpeta copia un único proyecto al banco del Hub; no registra una ubicación externa editable. Importar desde GitHub exige una publicación Axiom con JSON UUID y originales; no convierte repositorios de código arbitrarios. Reimportar un UUID existente no sobrescribe su copia local. No hay pull, merge ni force-push.

El selector nativo se verificó mediante su invocación Win32 sin interpolar rutas en código y mediante el endpoint autenticado con callback de prueba. No se abrió automáticamente un diálogo real que necesitara intervención humana. La conexión/publicación con PAT real sigue aplazada por decisión previa del usuario (ADR-0034); no se presenta como validada por estos adaptadores.

No se solicita repetir las pruebas automatizadas ni enviar credenciales. Las dos demos siguen independientes y TestRepo no se usa como demo. [Guía vigente](../../demos/M18_4_GUIDE.md), [decisión de defaults/flujo](../adr/0035-hub-and-github-project-workflow.md). Próxima milestone principal: M19; GPU física y cobertura Unity API no avanzan por esta revisión.
