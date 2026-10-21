# M20 — Objetos, componentes y jerarquías compatibles

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M19.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Object, GameObject, Component, Behaviour y Transform: búsquedas, tags/layers, activación, parenting, clonación, destrucción y sobrecargas del inventario.
- Resolver igualdad/null de objetos destruidos, identidad, orden de componentes, referencias y vida útil; compatibilidad de código UnityEngine preservando Axiom.Gameplay.
- Corregir diferencias de transformaciones, espacios, convenciones y tipos numéricos según el contrato M19.

## Subtandas previstas

- 20.1 Identidad, null, creación y destrucción.
- 20.2 Consultas/componentes y clonación de grafos.
- 20.3 Transformaciones, namespaces y corpus de migración.

## Criterios de cierre

- [ ] Los scripts del corpus usan las firmas Unity asignadas sin adaptaciones ocultas.
- [ ] Jerarquías, referencias, destrucción diferida y activación producen el comportamiento de referencia y no filtran recursos.
- [ ] Stop, Undo y proyectos existentes conservan su contrato; todos los miembros asignados tienen pruebas o un bloqueo explícito que impide el cierre.

## Demo editable requerida

Object Lifecycle Lab con jerarquías, referencias destruidas, clones y cambios de activación.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
