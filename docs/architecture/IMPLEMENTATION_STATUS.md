# Estado de implementación

Base funcional vigente: **0.0.52 / SDK 8**, integrada en `main` el 2026-10-20 por decisión del usuario. Referencia fija: `recovery/pre-restructure-0.0.52` → `e264ca835de14daf4fe964be6a78be5e4646ad14`.

| Área | Estado confirmado | Límite o trabajo pendiente |
| --- | --- | --- |
| Editor y Hub | Escenas 2D/3D, recursos, Inspector múltiple, dock, entrada/importación local/GitHub | Estabilizar regresiones completas de navegador |
| Renderer | WebGPU, ruta Null y corrección de primera apertura M18.3.12 | Null no acredita calidad visual GPU; prestaciones acotadas por sus contratos |
| Scripting | Runtime C#, SDK 8 y bindings propios documentados | No hay paridad completa con Unity; auditoría y denominador completo pendientes M19 |
| Físicas | Implementación CPU/Wasm 2D/3D y demos de stress | Rendimiento físico denso sigue pendiente; GPU no implementada |
| IA | Herramientas semánticas, propuestas aisladas, revisión/aceptación, PMD y autonomía acotada | Validaciones con modelo conectado y límites de cada contrato siguen explícitos |
| GitHub de juegos | Cuenta por sesión, configuración por proyecto, autosave, revisión/publicación e historial | Validación nativa manual con cuenta real aplazada; TestRepo solo para pruebas |
| Shaders/compute y físicas GPU | Plan aprobado y dependencias documentadas | 0% de aceptación de la ampliación; implementación futura M25/M26/M28/M30/M39/M40 |

## Evidencia y aceptación

Entrega local 0.0.52: 438 pruebas Node, 44 Rust y 18 grupos de navegador. Los recorridos GitHub y selector usan adaptadores controlados; no equivalen a aceptación de PAT real o diálogo de Windows operado manualmente. M18.4 cerrada en su alcance acordado por [ADR-0034](../adr/0034-m18-4-closure-and-deferred-native-account-check.md).

CI 320 sobre la entrega: 42/45 trabajos aprobados; fallos de detach Inspector (M18), traza del workspace tras Stop (M18.2) y sincronización Hub al recargar (M7). [Seguimiento y recuperación](../REPOSITORY_MAINTENANCE.md). El último CI completo verde anterior fue CI 315 sobre 0.0.49; no valida retrospectivamente 0.0.52.

El rendimiento denso medido en M18.3.11 (~5,1 FPS del editor local Null con 1.024 cuerpos dinámicos densos) sigue siendo un pendiente, no un objetivo cumplido. El benchmark de física CPU aislada no representa FPS ni rendimiento GPU.

## Mantenimiento posterior a la entrega

PR #50 conserva la base y las etiquetas fijas; corrige sincronización atrasada del bridge con tres regresiones deterministas y 441/441 Node aprobadas. M7/M18/M18.2 pasaron localmente antes de esa corrección; el CI remoto del PR decide el cierre de sus incidencias. Hay 22 milestones nativas, release de recuperación publicada y reglas activas para main/recovery, sin bypass. Consultar el [mantenimiento](../REPOSITORY_MAINTENANCE.md).

## Planificación

45 milestones principales, 23 cerradas y 22 pendientes M19–M40. El siguiente trabajo de producto es M19 tras la estabilización y la reestructuración que defina el usuario. [Roadmap](ROADMAP_M19_M40.md) y [GPU/shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md) conservan alcance y gates. Las estimaciones anteriores por familia de Unity no constituyen una auditoría; porcentaje global ampliado sin cuantificar hasta M19.

Fuentes: [M18.4.1](../reports/M18_4_1_REPORT.md), [M18.3.12](../reports/M18_3_12_REPORT.md), [M18.3.11](../reports/M18_3_11_CURRENT_REPORT.md). [Estado histórico completo](../archive/pre-restructure-0.0.52/docs/architecture/IMPLEMENTATION_STATUS.md).

## Actualización de P0 — 2026-10-21

Producto Axiom Game Engine y repositorio AxiomGameEngine; licencia MIT en esta rama. [Separación aprobada](PLATFORM_TRANSITION.md), todavía documental. Platform conserva P0–P5 propios; ninguna función se ha extraído ni se acredita cobertura nueva. Base consolidada 871a72f: mismo árbol que e2eebc5, aprobado CI 329 46/46 con 441 Node. Las referencias a CI 320 anteriores son históricas. #48/#49 cerradas; #47 intermitente sigue abierta. Los checks del nuevo PR deben verificarse por separado.

## CI posterior de la base: pendiente #51

Verificado durante P0: el [run posterior sobre main 871a72f](https://github.com/Krozzeo/AxiomGameEngine/actions/runs/39507425121) terminó con fallo de M17 y del gate agregado (44/46 trabajos aprobados). La aserción de posiciones de runtime en tests/browser/m17.mjs:13:643 encontró valores sin cambio; compilación completada y diagnóstico de script vacío no establecen la causa. [Seguimiento #51](https://github.com/Krozzeo/AxiomGameEngine/issues/51). El CI 329 aprobado del mismo árbol sigue siendo evidencia histórica, pero la base no se declara íntegramente verde. Este fallo precede a publicar la rama P0 y no se corrige por documentación o renombrado.

## P1 en rama — 2026-10-21

Host/Hub propios en Platform y adaptador de este producto, ciclo de vida con revisión/buffers/lease, formato intacto. Local 443/443 Node y aceptación conjunta de navegador Null aprobados. [Detalle](PLATFORM_P1.md). No equivale a integración en main, CI remoto ni aceptación de los pendientes anteriores. P2–P5 y M19–M40 conservan su alcance.

## P2 candidata — 2026-10-21

P1 aceptada por usuario y CI, integrada en main 400fec0. P2 extrae servicios y configura cuenta compartida/metadatos por proyecto; [contrato](PLATFORM_P2.md). Las referencias a estados P0/P1 previas son históricas. M19–M40, #47/#51 y aceptación nativa/modelo/rendimiento permanecen independientes.
