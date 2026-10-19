# M38 — API de editor, assets, extensiones y builds

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M20, M23, M24, M30, M33, M37.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Puente UnityEditor para Editor/EditorWindow, SerializedObject/Property, CustomEditor, PropertyDrawer, Undo y herramientas asignadas.
- AssetDatabase/importadores, inspección, selección, gizmos/handles, prefabs y callbacks; extensiones reales sobre Axiom.
- BuildPipeline/settings, pruebas, profiling/diagnóstico y gestión de paquetes; producir builds de Axiom según el contrato de compatibilidad.

## Subtandas previstas

- 38.1 Extensiones y serialización del editor.
- 38.2 AssetDatabase/importadores y herramientas.
- 38.3 Builds, pruebas y paquetes.

## Criterios de cierre

- [ ] Un paquete de extensiones crea ventana, Inspector y herramientas desde código público compatible.
- [ ] Importar/reimportar, Undo/Redo, renombrar y guardar preservan referencias y proyectos.
- [ ] Un proyecto se exporta/construye y ejecuta fuera del editor; no se confunde igualdad de API con producir binarios de Unity.

## Demo editable requerida

Editor SDK Lab con custom Inspector, importador y build reproducible.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
