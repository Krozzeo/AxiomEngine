# Transición a Axiom Platform

Decisión aprobada por el propietario, documentada el 2026-10-21. Nombre de producto: **Axiom Game Engine**. Repositorio renombrado de AxiomEngine a **AxiomGameEngine**, conservando historia, issues, milestones y recuperación. Los nombres técnicos existentes (paquete axiom-engine, namespaces y formatos) se conservan para no introducir una migración por branding.

## Fuentes canónicas

[Axiom Platform](https://github.com/Krozzeo/AxiomPlatform) contiene el [documento maestro](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/MASTER_PLAN.md), [matriz de propiedad](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/architecture/OWNERSHIP_MATRIX.md), [contrato](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/architecture/PRODUCT_CONTRACT.md), [migración](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/architecture/MIGRATION_PLAN.md) y [roadmap P0–P5](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/ROADMAP.md). Este documento define la consecuencia para el motor, sin duplicar la especificación completa.

## Propiedad

Platform recibirá Hub/catalogación, configuración común, sesiones, servicios locales, infraestructura de cuentas/GitHub, orquestación AI, contratos y primitivas de UI comprobadas. El motor conserva editor especializado, escenas, componentes, assets de juego, C#/SDK, renderer, shaders, físicas, audio, animación, pruebas de juegos y exportación. Los archivos mixtos de daemon, agent, workspaces y protocol se dividen mediante interfaces; no se trasladan completos.

El adaptador de Game Engine vive en este repositorio y consume contratos públicos de Platform. Platform no importa tipos del motor. La entrada habitual será Platform; se conserva arranque directo técnico y automatización. Los juegos exportados no requieren Platform/editor/AI.

## Estado de esta entrega

P0 es documental. No se han extraído servicios, cambiado formatos, instalado Platform ni publicado un SDK común. Solo se actualizan documentación, nombre visible/referencias y licencia, junto con la protección imprescindible de destino GitHub tras el cambio de nombre. Mantener bloqueo del nombre histórico y añadir el nuevo y Platform para evitar publicar un juego encima de repositorios de infraestructura.

## Roadmap preservado

45 milestones principales del motor; 23 cerradas y M19–M40 pendientes. M19 audita la API objetivo Unity 6.3 LTS y fija denominadores; M20–M39 implementación/conformidad y M40 hardening. Compute y físicas/shaders siguen en M25/M26/M28/M30/M39/M40. P0–P5 no sustituyen ni renumeran estas etapas. P1 es la siguiente tanda de reestructuración; no se necesita terminar P5 para avanzar M19 cuando no haya dependencia técnica.

## Recuperación y verificación

Base inspeccionada `871a72f6d2c720e99e0a8d1598c0f35af69c4d78`, tag `recovery/pre-restructure-stable-2026-10-20`. No mover tags ni reescribir historia. El árbol del candidato e2eebc5 aprobó CI 329 (46/46); corresponde al mismo árbol de la base, pero no garantiza otros runs. #48/#49 quedaron cerradas; #47 conserva el fallo intermitente de Inspector abierto. Validación nativa manual GitHub, modelo conectado y rendimiento denso siguen pendientes.

Actualizar remotos locales a `https://github.com/Krozzeo/AxiomGameEngine.git`. Enlaces activos usan el nombre nuevo; informes y ADRs históricos conservan su procedencia. La rama de P0 se revisa por PR sin alterar directamente main.

## Licencia

MIT por instrucción posterior del propietario, que sustituye la elección Apache-2.0 para esta nueva entrega. [ADR-0037](../adr/0037-mit-license-and-repository-identity.md). No se reescriben versiones previas ni avisos/licencias de terceros. El modelo comercial permanece pendiente.

## CI posterior de la base: pendiente #51

Verificado durante P0: el [run posterior sobre main 871a72f](https://github.com/Krozzeo/AxiomGameEngine/actions/runs/39507425121) terminó con fallo de M17 y del gate agregado (44/46 trabajos aprobados). La aserción de posiciones de runtime en tests/browser/m17.mjs:13:643 encontró valores sin cambio; compilación completada y diagnóstico de script vacío no establecen la causa. [Seguimiento #51](https://github.com/Krozzeo/AxiomGameEngine/issues/51). El CI 329 aprobado del mismo árbol sigue siendo evidencia histórica, pero la base no se declara íntegramente verde. Este fallo precede a publicar la rama P0 y no se corrige por documentación o renombrado.
