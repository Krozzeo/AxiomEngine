# Changelog

## P2 — Servicios comunes · 2026-10-21

Catálogo/ajustes persistentes, selección e importación, cuenta/transporte GitHub compartidos con destinos por proyecto; proveedor fijado HTTPS con integridad, configuración nativa adoptada selectivamente. P1 aceptada por usuario e integrada con CI. P2 candidata en ramas; pruebas nativas/reales diferenciadas.


## P1 — Adaptador de Axiom Platform · 2026-10-21

Descriptor/IPC, puerto de ciclo de vida opcional, revisión y protección de buffers, arrendamiento por carpeta y apertura nativa conservada. Sin cambios de formato o extracción AI/GitHub. Entrega en rama con pruebas conjuntas y navegador Null; ver informe P1.


## P0 de Axiom Platform e identidad — 2026-10-21

- Producto/repo Axiom Game Engine / AxiomGameEngine; referencias activas y ayuda actualizadas, conservando nombres técnicos y formatos.
- [Separación P0](docs/architecture/PLATFORM_TRANSITION.md), ADR-0036 y ADR-0037; M19–M40 se conservan y Platform tiene P0–P5 propios. Sin extracción funcional.
- MIT por instrucción del propietario; metadatos y avisos propios coherentes, licencias de terceros e historia preservadas.
- Protección de publicación de juegos cubre nombre anterior, nuevo y Platform.
- Evidencia histórica de consolidación actualizada: CI 329 46/46 del árbol base; #48/#49 cerradas, #47 intermitente abierto. Checks del PR nuevo independientes.


## Mantenimiento del repositorio — 2026-10-20

- Última entrega 0.0.52 integrada en `main` conservando la cadena de commits.
- Dos etiquetas de recuperación: entrega 0.0.52 y `main` anterior.
- Documentación vigente separada del historial; inventario de ramas/PR y proceso de recuperación documentados.
- Enlaces de ayuda del editor apuntan a `main`.
- Helper de navegador espera la inicialización del Hub antes de decidir cómo acceder a cualquier control; corrección candidata al fallo M7, pendiente de confirmar con CI completo.
- Respuestas de sincronización tardías ya no deshacen cambios de preview/edición/proyecto ni se aplican después del cierre; tres regresiones deterministas y 441 pruebas Node aprobadas.
- Gate de CI agregado que exige todas las familias de pruebas; milestones nativas M19–M40, etiquetas y referencias de recuperación protegidas.
- Fallos CI M18/M18.2/M7 registrados sin alterar criterios ni declarar cierre anticipado.

## 0.0.52 — M18.4.1 · Hub y GitHub

Hub desplegable, entrada/importación de proyectos, selector nativo Windows, ajustes de Hierarchy/toolbar, cuenta GitHub por sesión, destinos y autosave por proyecto, creación con estado/error, Review/Publish y diálogos de cambios/historial. Defaults nuevos de publicación ON por petición del usuario; valores previos preservados.

[Informe y límites de validación](docs/reports/M18_4_1_REPORT.md).

## 0.0.51 — M18.3.12 · Inspector y escenas

Resaltado compatible de destinos, Inspector como acción única en Panels, jerarquía simplificada y configuración resuelta antes de primera apertura de escenas. [Informe](docs/reports/M18_3_12_REPORT.md).

## 0.0.50 — M18.4 · GitHub de proyectos

Creación/enlace de repositorios, revisión y publicación de MAIN guardado, preferencias y recuperación segura. Cerrada en alcance acordado con validación nativa manual aplazada: [ADR-0034](docs/adr/0034-m18-4-closure-and-deferred-native-account-check.md).

## Entregas anteriores

[Changelog histórico íntegro hasta 0.0.52](docs/archive/pre-restructure-0.0.52/CHANGELOG.md). Sus estados de revisión, pendientes y cifras corresponden a cada fecha; el [estado vigente](docs/architecture/IMPLEMENTATION_STATUS.md) prevalece.
