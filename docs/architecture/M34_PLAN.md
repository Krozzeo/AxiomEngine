# M34 — Mundos 2D/3D, partículas, terreno y vídeo

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M24, M25, M27, M30, M31, M32.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Sprite, atlases, tilemaps y colisión de tiles; LOD/culling y construcción de mundos.
- ParticleSystem, trails/lines, Terrain y vegetación, viento y Cloth asignados, con simulación/render real.
- VideoPlayer y sincronización audiovisual; separar paquetes VFX/Terrain externos cuando corresponda al inventario.

## Subtandas previstas

- 34.1 Sprites, tilemaps y LOD.
- 34.2 Partículas, Terrain, viento y Cloth.
- 34.3 Vídeo, sincronización y presupuesto.

## Criterios de cierre

- [ ] Editar y consultar tiles/terreno/partículas desde C# modifica la simulación y los píxeles esperados.
- [ ] Cloth y colisión, LOD y recursos se verifican en cargas representativas sin ocultar sus límites.
- [ ] Vídeo y audio respetan reproducción/seek/pausa/descarga; formatos dependen de backends declarados.

## Demo editable requerida

World Systems Lab con mapa 2D, terreno 3D, partículas, tela y vídeo sincronizado.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
