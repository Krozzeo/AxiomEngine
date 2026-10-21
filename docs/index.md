# Documentación de Axiom Game Engine

Estado vigente sobre 0.0.52 / SDK 8. Los informes por milestone y documentos archivados son evidencia de sus respectivas entregas; no sustituyen este estado.

| Necesidad | Referencia |
| --- | --- |
| Informe de P0 | [Entrega y límites](reports/PLATFORM_P0_REPORT.md) |
| Familia Axiom y separación P0 | [Transición a Platform](architecture/PLATFORM_TRANSITION.md) |
| Instalación y arranque | [README](../README.md) |
| Estado real, límites y pendientes | [Implementación](architecture/IMPLEMENTATION_STATUS.md) |
| Retomar el desarrollo | [AI handoff](AI_HANDOFF.md) |
| Recuperación, ramas y flujo de contribución | [Mantenimiento](REPOSITORY_MAINTENANCE.md) |
| Milestones nativas en GitHub | [Correspondencia y límites](NATIVE_GITHUB_MILESTONES.md) |
| Plan de compatibilidad | [Roadmap M19–M40](architecture/ROADMAP_M19_M40.md) |
| Shaders y físicas GPU | [Plan](architecture/GPU_PHYSICS_AND_SHADERS_PLAN.md) |
| API propia y referencia generada | [Scripting API](scripting-api/README.md) |
| GitHub de proyectos de juego | [Plan M18.4](architecture/M18_4_PLAN.md) y [guía](../demos/M18_4_GUIDE.md) |
| Decisiones arquitectónicas | [ADRs](adr/README.md) |
| Informe de la última entrega | [M18.4.1](reports/M18_4_1_REPORT.md) |
| Corrección de Inspector/render | [M18.3.12](reports/M18_3_12_REPORT.md) |
| Cambios publicados | [Changelog](../CHANGELOG.md) |
| Informes por milestone | [Directorio de informes](reports/) |
| Estado previo a la consolidación | [Archivo completo](archive/pre-restructure-0.0.52/README.md) |

Orden de lectura para continuar: estado → handoff → mantenimiento → plan de la siguiente entrega. Los contratos específicos del motor, daemon, persistencia y renderer permanecen en `architecture/`; no se eliminan ni se reinterpretan como funciones nuevas.
