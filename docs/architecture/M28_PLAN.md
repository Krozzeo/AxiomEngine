# M28 — Física 2D: joints y simulación avanzada

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M27.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Rigidbody2D, interpolación, sleeping, CCD, efectores y configuración de simulación.
- Implementar familias Joint2D del inventario, motores, límites, roturas y colisiones conectadas.
- Validar plataformas, vehículos y cadenas 2D, integración con animación/tiles y rendimiento estable.

## Subtandas previstas

- 28.1 Solver y efectores.
- 28.2 Joints, motores y límites.
- 28.3 Mecánicas y estrés.

## Criterios de cierre

- [ ] Cada familia asignada tiene un escenario de fuerzas/limitación/rotura y resultados verificables.
- [ ] Pausa, cambio de body type, desactivación y destrucción no dejan constraints huérfanas.
- [ ] La simulación y las consultas mantienen consistencia entre C# y kernel a diferentes pasos fijos.

## Demo editable requerida

2D Mechanics Lab con plataformas, péndulos, cadenas y suspensión.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
