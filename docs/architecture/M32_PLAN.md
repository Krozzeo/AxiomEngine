# M32 — Audio, mezcla y procesamiento

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M22, M24.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar AudioSource/Listener/Clip, programación temporal, carga/streaming y dispositivos.
- AudioMixer, grupos, snapshots, efectos/filtros y procesamiento DSP asignado con backends reales.
- Espacialización, prioridades, virtualización y liberación; distinguir Null de sonido efectivo.

## Subtandas previstas

- 32.1 Clips, streaming y scheduling.
- 32.2 Mixer, efectos y DSP.
- 32.3 Espacialización, dispositivos y memoria.

## Criterios de cierre

- [ ] Se verifica salida de audio mediante muestras/medidas y programación temporal, no solo flags.
- [ ] Cambio de dispositivo, activación del navegador, underruns y fallos tienen estados observables.
- [ ] Runtime/Stop/restauración no contaminan los datos authored y liberan voces/buffers.

## Demo editable requerida

Audio Conformance Lab con scheduling, mezcla, filtros y streaming.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
