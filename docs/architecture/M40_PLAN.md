# M40 — Estabilización final, producto y aceptación integral

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M18.4, M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38, M39.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Trasladar íntegramente el antiguo M19: estabilidad, performance, documentación, ejemplos, onboarding, safe mode, crash recovery, migraciones, project health y tiers.
- Cerrar regresiones de toda la expansión, incluyendo el timeout intermitente de Apply observado en M18.2; instalaciones limpias, datos dañados/interrumpidos y recuperación.
- Ejecutar la aceptación integral del documento maestro: sample 2D/3D y propuesta IA revisada de enemigo que sigue/recibe daño/emite feedback, con tests y evidencia de principio a fin.

## Subtandas previstas

- 40.1 Instalación, recuperación y migraciones.
- 40.2 Rendimiento, estabilidad y matriz multiplataforma.
- 40.3 Sample integral, flujo IA, documentación y release.

## Criterios de cierre

- [ ] M18.4 y M19–M39 están aceptadas con evidencia; ninguna exclusión pendiente se disfraza de prueba aprobada.
- [ ] El sample completo funciona en capacidades/tiers declarados, con builds reproducibles, estabilidad y mediciones representativas.
- [ ] El agente inspecciona/edita/compila/ejecuta/verifica/repara/mide y presenta una propuesta revisable; las verificaciones de cuenta/hardware necesarias tienen evidencia real.

## Demo editable requerida

Axiom End-to-End Sample original de las secciones 138–139 del documento maestro, ampliado con conformidad del SDK.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.

## Plan de estabilización original conservado

La siguiente especificación se conserva como antecedente y obligación de M40. Su numeración M19 y sus dependencias antiguas están sustituidas por el roadmap vigente anterior.

# Plan original — MVP Hardening

Status: not started; scheduled after M18.1–M18.4 (see M18_EXTENSIONS_ROADMAP.md). Master specification sections 138–139. This document is a
plan, not an implementation or an acceptance claim.

Turn the completed subsystems into a coherent product: stability, performance,
documentation, examples, onboarding, safe mode, crash recovery, schema migrations,
project health and Tier compatibility. Preserve bounded resource use, semantic
authority and explicit human review of proposals.

Begin with a reproducible clean-install/onboarding and project-health inventory.
Exercise damaged/interrupted project writes, unavailable capabilities, recovery
and migration paths; define evidence and safe defaults before introducing changes.
Measure representative workloads rather than claiming physical GPU performance
from software WebGPU CI. Keep lower capability tiers usable and explain actual
fallbacks in the UI.

Close with the master specification's end-to-end acceptance sample built through
Axiom: a 3D scene with player, physics, lighting/PBR, animation, audio and C# gameplay;
a 2D scene with tilemap, sprites, physics, animation and UI; and a reviewed AI
proposal for an enemy that follows the player, receives damage, supplies visual
and audio feedback and includes behavioral tests. The AI workflow must inspect,
edit, compile, execute, verify, repair, measure and present its change set before
the user accepts it. Do not equate M18's two narrow repair policies with this
general gameplay objective.

Require clean cross-platform gates, representative editable demos, synchronized
guides/state and retained acceptance evidence. Report remaining limitations and
only manual checks that cannot be covered equivalently by available automation.
