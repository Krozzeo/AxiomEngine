# M30 — Gráficos, cámaras, materiales y recursos GPU

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M21, M23, M24.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Renderer, Mesh, Material, Shader, Texture/RenderTexture, cámaras y conversiones de coordenadas.
- Luces, sombras, command buffers, dibujo y compute/readback asignados; decidir compatibilidad de shaders/pipelines mediante ADR y corpus.
- Propiedad y liberación GPU, layouts/formatos, capacidades/tier y comportamiento Null explícito.

## Subtandas previstas

- 30.1 Mesh/texturas/materiales y cámaras.
- 30.2 Shaders, dibujo, luces y render targets.
- 30.3 Compute/readback, recursos y tiers.

## Criterios de cierre

- [ ] Pruebas visuales y de datos comprueban resultados del render y no solo propiedades del Inspector.
- [ ] Crear/reemplazar/liberar recursos y perder capacidades no producen fugas ni éxito ficticio.
- [ ] Cada modo de shader/pipeline tiene soporte, traducción o bloqueo declarado; las diferencias impiden contar equivalencia completa.

## Demo editable requerida

Rendering Conformance Lab con materiales, cámaras, render textures y compute.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
