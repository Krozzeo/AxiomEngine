# M18.4 — GitHub de proyectos de juegos

Fecha: 2026-10-19. Versión: **0.0.50**, SDK **8**. Estado: **en progreso**, implementación para revisión; aceptación externa pendiente. No fusionar automáticamente.

## Resultado

El editor incorpora un panel GitHub independiente del asistente de IA. Permite conectar una cuenta mediante token temporal, listar o crear un repositorio, seleccionar explícitamente repositorio/rama, revisar diferencias y publicar MAIN guardado. El icono conectado/desconectado es independiente del punto de cambios pendientes. Se informa destino, cuenta, errores y enlace al último commit confirmado.

El token vive exclusivamente en memoria del daemon Node. Desconectar/cerrar lo elimina; reiniciar requiere reconectar. Destinos, preferencias y recibos se guardan en `github-session.json` del perfil local de Axiom, fuera de los proyectos. No hay tokens en comandos, herramientas, proyectos, PMD, almacenamiento del navegador ni contexto del modelo. Los tests usan rutas temporales explícitas. El panel no implementa OAuth ni una bóveda persistente de credenciales.

Se publica el estado durable de MAIN dentro de `axiom/<UUID>/`: JSON canónico del proyecto, originales de assets, fuentes legibles y manifiesto. Se excluyen previews, compilación, recursos derivados, configuración de cuentas, historial/conversación del PMD y preferencias del editor ajenas al documento. Se conservan PMD y documento maestro; las dimensiones mínimas requeridas por el formato se normalizan. Los archivos fuente del usuario no se inspeccionan para borrar secretos escritos por él: la revisión previa incluye ese contenido tal como está.

La operación se serializa con los comandos del editor. Se valida que el proyecto durable coincida con la revisión guardada, descontando metadata de caché reconstruible al abrir. La copia canónica se comprueba con reapertura y reconstrucción de assets originales. Las copias legibles de fuentes son de consulta; las ediciones externas deben incorporarse al proyecto canónico, no se importan automáticamente desde Git.

## Integridad y automatización

- El destino se vincula a la identidad de cuenta y proyecto. Selección/creación son acciones humanas desde rutas dedicadas; las herramientas del agente no pueden cambiar destino, conectar, crear repositorios ni habilitar preferencias. Se rechaza expresamente el repositorio del motor como destino de juego.
- Solo se acepta MAIN aplicado, guardado, detenido y sin trabajos activos. Preview activa, revisión obsoleta o cambios posteriores a revisar impiden publicar. Una solicitud del asistente no crea un nuevo workspace de autoría para publicar; una propuesta existente debe aplicarse antes de iniciar esa solicitud desde MAIN.
- Cada commit usa `createCommitOnBranch` con `expectedHeadOid`: comprobación y actualización atómicas. Se compara además el manifiesto de fuentes previas y los blobs remotos. No se sobrescriben archivos remotos sin propiedad de Axiom; los archivos fuera del prefijo se conservan. Se detiene cualquier divergencia, sin merge, force-push ni reescritura.
- Antes del envío se persiste identificador, hash y cabecera esperada. Si la respuesta se pierde o el recibo no puede guardarse, se mantiene resultado no confirmado. Conciliación busca el identificador/hash en los últimos 50 commits y comprueba su manifiesto. El reintento conserva identificador, snapshot y condición de cabecera; nunca supone que un error implica ausencia del commit. Si el estado cambió, se detiene.
- **Auto-publicar nuevas milestones entregadas** requiere una preferencia persistente explícita. Solo compara IDs `delivered` en PMD durable; habilitarla no publica entregas históricas. **Permitir solicitudes del agente** es otra preferencia independiente. Ambas están desactivadas por defecto. En ausencia de autorización el agente recibe un error, no una publicación implícita.

## Aceptación y porcentaje

Se desglosa el alcance original en diez grupos requeridos de igual peso. No se descuentan criterios externos del denominador.

| Grupo requerido | Estado | Evidencia y límite |
|---|---|---|
| Conexión independiente, desconexión, expiración y errores saneados | Passed (automatizado) | Adaptador HTTP y flujo del panel; cuenta real en grupo 10 |
| Selección/creación explícita de repositorio y rama por usuario | Passed (automatizado) | Panel y validaciones de destino; permisos GitHub reales en grupo 10 |
| Fuentes durables completas y reapertura/reconstrucción | Passed | Proyecto con script, JSON y asset original reabierto desde bundle |
| Credenciales y estado de cuenta fuera del proyecto/modelo/eventos | Passed | Tests de archivos de perfil, almacenamiento y eventos; token solo en memoria |
| Exclusión de preview/Play/dirty/jobs y revisión obsoleta | Passed | Guardas de servicio y prueba HTTP/editor |
| Diff, propiedad de archivos y detención por divergencia | Passed | Manipulación de fuente publicada y cabecera; archivos ajenos conservados |
| Commit condicionado y recuperación/reintento sin duplicados | Passed | Respuesta perdida antes/después, diario recargado tras reinicio y adaptador HTTP |
| Automatización por entrega y solicitud del agente separadas | Passed | Transiciones durables, opt-in, no retroactividad y solicitud sobre MAIN |
| Interfaz, demo editable, documentación y regresión automatizada | Passed | 427 Node, 44 Rust, diez grupos de navegador M18.4 y dos demos normales |
| Cuenta real, repositorio de juego elegido, publicación y reapertura | **Blocked / no ejecutado** | Requiere conexión local del usuario y destino explícito; guía de aceptación |

Corte automatizado: **9/10 = 90%**; regresión local aprobada. No equivale a GitHub real verificado. **M18.4 permanece abierta** hasta el grupo 10. El porcentaje global ampliado y la cobertura Unity no se cuantifican antes de M19; 94% sigue siendo una referencia histórica del MVP.

## Evidencia automatizada

- `tests/github.test.mjs`: **11/11**; reapertura de script/JSON/asset, estado guardado, revisión obsoleta, divergencia, recuperación tras reinicio, reintento, archivos ajenos, permisos de agente, transición de milestone, contrato atómico y expiración.
- `tests/openai-assistant.test.mjs`: nueva aceptación de publicación sobre MAIN sin workspace de autoría.
- `tests/browser/m18-4.mjs`: flujo real del editor contra adaptador controlado, con dos demos normales y diez grupos de aceptación. Incluye publicación, respuesta perdida, divergencia y ausencia de token en eventos/storage. Evidencia local en `.axiom/browser-m18-4-evidence/`.
- Catálogo generado: **92 herramientas semánticas**; schema, arquitectura y paridad de daemon comprobados. Versiones de protocolo y SDK sin cambios.
- `npm run check`: **427/427 Node**, compilación del editor/kernel, catálogo de herramientas, bindings, 18 schemas, tres reglas de arquitectura y paridad de daemon aprobados localmente. `npm run check:native`: **44/44 Rust**, formato y clippy aprobados. Navegador M18.4: **10/10 grupos (cinco por cada modo)**, cero errores de página. La matriz CI de esta versión amplía a 34 grupos de navegador / 43 jobs y se informa por separado cuando termina; no se presume aprobada. Las cifras de CI315 de 0.0.49 son antecedentes, no resultados de este cambio.

## Ampliación de demos — ambos modos

`npm run demo:m18-4` genera dos proyectos independientes: **Create Repository** y **Existing Repository**, con UUIDs, nombres de cubo, posición, PMD y archivo `Scripts/DemoMode.json` distintos. La primera prueba crea un repositorio privado desde el panel y publica en ese mismo destino; la segunda selecciona un repositorio preexistente sin invocar creación. Cada modo usa su propio servidor/adaptador durante aceptación, publica sus fuentes identificables, conserva el README original, prueba dirty/reintento/divergencia y desconexión. **10/10 grupos locales**, cero errores de página. No se ha ejecutado todavía ninguno con la cuenta real.

CI316 del corte anterior (`afd88bb`) terminó con **42/43 jobs aprobados**, incluido M18.4; falló M13 por una carrera al abrir Hub durante la adopción inicial del proyecto tras recargar. Se ajusta el helper de aceptación para esperar la inicialización de los controles antes de decidir abrir Hub. No se atribuye ese resultado a la nueva revisión ni se presenta CI316 como completamente aprobado. La nueva revisión ejecuta su propia matriz.

El intento local adicional de M13 no completó su aceptación: esta máquina usa Null y la aserción de muestras GPU de ese recorrido requiere el entorno Vulkan de CI. No se registra como aprobado ni se cambia la aserción para ocultarlo. La aceptación local M18.3.11 sí pasó sus siete grupos, con C# SDK8.

## Gate que requiere al usuario

No hace falta repetir compilación, pruebas unitarias ni navegador automatizado. Solo la prueba que necesita su cuenta: abrir la demo, conectar desde el campo de contraseña del panel, elegir un repositorio de juego de prueba y publicar/reabrir siguiendo [M18_4_GUIDE](../../demos/M18_4_GUIDE.md). No enviar el token por chat. Evidencia: enlace al commit y resultado de reapertura/recuperación, sin credenciales. No se ha elegido ni publicado silenciosamente ningún repositorio de juego durante el desarrollo.

## Límites y continuidad

Node daemon local y GitHub.com; token temporal, listado inicial de 100 repositorios y destino manual alternativo, hasta 32 configuraciones locales, 2.048 archivos y 16 MiB por publicación. Repositorio inicializado y árbol remoto completo; no LFS ni árboles truncados. Conflictos, historial más antiguo que 50 commits o un snapshot modificado mientras hay publicación pendiente requieren resolver el estado explícitamente; no existe descarte automático del diario ni sincronización bidireccional.

M18 completa **no se declara cerrada**. Siguen las solicitudes previas de Hierarchy/Inspectors/resaltado de referencias, el bug de primer render de escena (causa sin confirmar), el objetivo de fluidez física densa (~5–6 FPS locales Null en el corte previo con 1.024 dinámicos) y gates de modelo/cuenta real. Esta tanda no los presenta como resueltos. El plan M19–M40 conserva implementación funcional de la Scripting API de Unity, compute/shaders y físicas GPU opcionales; CPU/Wasm permanece vigente. No hay nuevos miembros de scripting ni física GPU implementados en M18.4.

Referencias de contrato: [GitHub GraphQL commits](https://docs.github.com/en/graphql/reference/commits), [repositorios REST](https://docs.github.com/en/rest/repos/repos), [tokens de acceso](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
