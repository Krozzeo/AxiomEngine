# Contexto vigente para continuar

Fecha de consolidación: 2026-10-20. Base funcional: **0.0.52 / SDK 8**, commit `e264ca835de14daf4fe964be6a78be5e4646ad14`. El usuario pidió integrar la última entrega en `main` y conservarla como punto de recuperación antes de reestructurar el proyecto. Esta instrucción reemplaza las advertencias históricas de no fusionar automáticamente para esta consolidación concreta.

## Qué es y cómo está construido

Editor en navegador (`apps/editor`), núcleo Rust/Wasm (`engine`), daemon Node de producción y daemon Rust de alcance acotado (`daemon`), protocolo semántico (`protocol`), scripting C# y bindings generados (`scripting`, `scripts`). WebGPU y Null son rutas distintas; una prueba Null no acredita píxeles GPU ni rendimiento de hardware. Las propuestas del agente operan en workspaces aislados; revisión y aceptación humana preceden a modificar MAIN del juego.

## Última entrega

Hub agrupa Create project, Add Project y Settings. Importación local conserva el original; importación GitHub usa publicación canónica. Selector nativo Windows junto a rutas. Hierarchy conserva título/Always active a la izquierda y candado/X a la derecha; Inspector se crea desde una única acción Panels y soporta hasta ocho instancias. Los campos compatibles se resaltan durante drag y más intensamente al hover. Corregida la configuración faltante de primera apertura de escenas en 0.0.51.

GitHub: credencial en memoria durante la sesión del daemon, configuración/borradores/preferencias por proyecto, iconos desconectado/vinculado/sin destino, creación con progreso y error visible, vinculación automática, autosave y flujo Review/Publish. Detalles de cambios e historial paginado en diálogos separados. Defaults nuevos de publicación ON por petición explícita; preferencias guardadas se respetan (ADR-0035).

## Qué está confirmado

- La entrega local aprobó 438 pruebas Node, 44 Rust y 18 grupos de navegador con transporte GitHub y selector controlados.
- M18.3.12 aprobó la comparación WebGPU de primera apertura/revisita en CI 319: diferencia de píxeles 0; ese CI general tuvo otro fallo.
- CI 320: 42/45 trabajos aprobados. Fallaron M18, M18.2 y M7; [seguimiento](REPOSITORY_MAINTENANCE.md). No atribuirles una causa definitiva sin reproducción.
- M18.4 cerrada según [ADR-0034](adr/0034-m18-4-closure-and-deferred-native-account-check.md), con validación nativa manual aplazada por el usuario. Hub y GitHub renovados documentados en [M18.4.1](reports/M18_4_1_REPORT.md).
- TestRepo es solo para pruebas. Dos demos GitHub independientes. No solicitar ni publicar tokens por chat ni guardarlos en el proyecto.

## Consolidación y verificación actual

PR #50 organiza documentación, historial e inventario. 22 milestones nativas M19–M40 creadas; ocho etiquetas adicionales conservan las diez existentes. Release exacta 0.0.52 publicada y tags recovery protegidos contra cambio/borrado. Main exige PR y All required checks de GitHub Actions, sin bypass; ramas integradas se retiran automáticamente. Las tres regresiones del bridge llevan npm run check a 441/441. Confirmar el CI del PR antes de dar por cerrados #47/#48/#49; el respaldo exacto e264 permanece intacto. [Detalles y reglas](REPOSITORY_MAINTENANCE.md).

## Plan que se conserva

45 milestones principales; 23 cerradas y 22 pendientes M19–M40. M19 audita el alcance público objetivo de Unity 6.3 LTS y fija denominadores, prioridades y equivalencia funcional. M20–M39 implementan por familias y verifican conformidad; M40 conserva el hardening final. Meta futura: al menos 95% de firmas core objetivo y 100% de P0, con excepciones visibles. No es cobertura actual medida.

Shaders/compute WGSL y físicas GPU opcionales permanecen planificados en M25, M26, M28, M30 y M39, con hardening M40. Aceptación de esa ampliación: 0%; las físicas actuales son CPU/Wasm. No traducir el antiguo 94% del MVP a avance del alcance ampliado.

## Estado posterior y reestructuración aprobada

Base consolidada 871a72f, recovery/pre-restructure-stable-2026-10-20. El candidato e2eebc5, con el mismo árbol, aprobó CI 329 46/46; no extrapolar a runs nuevos. #48/#49 cerradas; #47 intermitente abierto. Las menciones a CI 320 anteriores son evidencia histórica, no el estado final de consolidación.

Nombre Axiom Game Engine, repositorio AxiomGameEngine. MIT sustituye ADR-0013 para esta rama (ADR-0037). AxiomPlatform público/MIT aloja P0–P5 y contratos comunes; este repo conserva dominio/adaptador y M19–M40. [Transición](architecture/PLATFORM_TRANSITION.md). No hay código extraído ni formato migrado en P0; no asumir este PR integrado hasta comprobarlo.

## Próxima secuencia

1. Verificar integración de la rama documental P0 y sus checks; preservar referencias de recuperación.
2. Comenzar P1 mediante contrato/adaptador y un recorrido de apertura del motor, sin extracción masiva.
3. Mantener pendientes de #47, rendimiento denso, modelo conectado y validación nativa manual aplazada.
4. M19 continúa como siguiente milestone de producto; coordinar interfaces con P1 sin esperar todo P5 ni cambiar alcance/API.

[Mapa documental](index.md) · [Estado](architecture/IMPLEMENTATION_STATUS.md) · [Roadmap](architecture/ROADMAP_M19_M40.md) · [Historial anterior completo](archive/pre-restructure-0.0.52/docs/AI_HANDOFF.md).

## CI posterior de la base: pendiente #51

Verificado durante P0: el [run posterior sobre main 871a72f](https://github.com/Krozzeo/AxiomGameEngine/actions/runs/39507425121) terminó con fallo de M17 y del gate agregado (44/46 trabajos aprobados). La aserción de posiciones de runtime en tests/browser/m17.mjs:13:643 encontró valores sin cambio; compilación completada y diagnóstico de script vacío no establecen la causa. [Seguimiento #51](https://github.com/Krozzeo/AxiomGameEngine/issues/51). El CI 329 aprobado del mismo árbol sigue siendo evidencia histórica, pero la base no se declara íntegramente verde. Este fallo precede a publicar la rama P0 y no se corrige por documentación o renombrado.
