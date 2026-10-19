# M31 — Animación, rigging y Playables

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M22, M23, M30.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Animation/AnimationClip, Animator/controllers, parámetros, estados, transiciones, eventos y root motion.
- Skinning, Avatar/humanoid, retargeting, IK y constraints asignados con evaluación real.
- Playables/graphs, sincronización, blending y ciclo de vida; Timeline se versiona como paquete en M39.

## Subtandas previstas

- 31.1 Clips/controllers y eventos.
- 31.2 Rigging, root motion y humanoid/IK.
- 31.3 Playables y mezclas.

## Criterios de cierre

- [ ] Poses, transiciones y eventos coinciden con resultados de referencia a tiempos definidos.
- [ ] Pausa, mezcla, cambio de escena y destrucción liberan grafos y recursos.
- [ ] La aceptación comprueba movimiento/pose renderizada y coste de evaluación, además de parámetros.

## Demo editable requerida

Animation & Playables Lab con personaje, IK, root motion y mezclas de clips.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
