# M27 — Física 2D: geometrías y consultas

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M20, M21, M22.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Capsule, Polygon, Edge, Composite y demás Collider2D asignados; materiales y geometría de TilemapCollider coordinada con M34.
- Completar Physics2D, ContactFilter2D, casts, overlaps, distancias, contactos y escenas físicas.
- Alinear escala, rotación, profundidad, normales y unidades; representación nativa y puente C#.

## Subtandas previstas

- 27.1 Geometrías y materiales.
- 27.2 Consultas/filtros y contactos.
- 27.3 Integración y precisión.

## Criterios de cierre

- [ ] Polígonos, bordes y cápsulas colisionan y se consultan con resultados medidos.
- [ ] Filtros de capa/profundidad/normal/triggers y sobrecargas tienen cobertura.
- [ ] Casos degenerados y límites preservan el estado y reportan errores útiles.

## Demo editable requerida

2D Collider & Query Lab con polígonos, bordes, filtros y sweeps.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
