# M33 — UI, texto, layout y eventos

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M22, M23, M29, M30.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Canvas/RectTransform, controles/layout y sistema de eventos del alcance uGUI fijado; navegación y raycasting UI.
- UI Toolkit: árbol visual, estilos, binding, foco, paneles y controles asignados; texto y fuentes con edición/selección.
- Persistencia y extensibilidad de UI, escalado/DPI, accesibilidad y uso por scripts; paquetes de texto se fijan en M39.

## Subtandas previstas

- 33.1 Canvas, layout y eventos.
- 33.2 UI Toolkit y data binding.
- 33.3 Texto, fuentes, accesibilidad y escalado.

## Criterios de cierre

- [ ] Un menú y HUD se construyen mediante APIs públicas y responden a teclado/mouse/touch/gamepad.
- [ ] Layout, foco, captura, navegación y destrucción se verifican en varias resoluciones y ventanas.
- [ ] La UI del propio editor no se usa como evidencia de una API de UI de gameplay inexistente.

## Demo editable requerida

UI Application Lab con menú, HUD, inventario y formularios accesibles.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
