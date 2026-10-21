# M23 — Serialización, ScriptableObject y prefabs

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M20, M22.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- ScriptableObject, atributos de serialización y callbacks; campos, arrays/listas, estructuras, referencias y grafos admitidos por Unity.
- Serialización polimórfica/managed references y JsonUtility según su semántica real; identidad de assets, ciclos y referencias faltantes.
- Prefabs, instancias, overrides y variantes asignadas; persistencia y migración de proyectos sin perder referencias ni Undo.

## Subtandas previstas

- 23.1 Modelo serializado y ScriptableObject.
- 23.2 Grafos, callbacks y JSON.
- 23.3 Prefabs, overrides y migración.

## Criterios de cierre

- [ ] Guardar/reabrir conserva valores, identidad y relaciones; se verifican casos anidados y polimórficos.
- [ ] Datos inválidos o incompatibles no corrompen el proyecto; versiones previas tienen migración probada.
- [ ] Las limitaciones de JsonUtility no se sustituyen por un serializador con comportamiento diferente sin declararlo.

## Demo editable requerida

Save Graph & Prefab Lab con ScriptableObjects compartidos, overrides y reapertura.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
