# M35 — NavMesh y navegación completa

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M21, M24, M25.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Construcción/horneado de NavMesh triangular, superficies, regiones, costes y consultas.
- NavMeshAgent, obstáculos/carving, avoidance, links y rutas completas/parciales con ownership de escenas.
- Actualizaciones, concurrencia, depuración visual y escalabilidad; la grilla existente conserva su identidad.

## Subtandas previstas

- 35.1 NavMesh y queries.
- 35.2 Agentes, links y obstáculos.
- 35.3 Actualización y multitudes.

## Criterios de cierre

- [ ] La aceptación usa malla de navegación real, pendientes y varios pisos, además de obstáculos.
- [ ] Agentes, rutas parciales, cambios de destino y descargas de escena tienen resultados verificables.
- [ ] Los presupuestos de horneado y multitudes se miden; una grilla no cuenta como equivalencia de NavMesh.

## Demo editable requerida

Navigation Crowd Lab con varios pisos, links, obstáculos dinámicos y agentes.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
