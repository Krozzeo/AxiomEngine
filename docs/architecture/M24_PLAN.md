# M24 — Escenas, recursos, carga asíncrona y memoria

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M22, M23.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Scene/SceneManager, escenas aditivas, ownership, activación, eventos y objetos persistentes.
- Resources, AsyncOperation y recursos binarios; carga asíncrona real, progreso y dependencias; gestión de bundles incluida en el inventario base.
- Descarga, handles, liberación de CPU/GPU/audio y reapertura; contratos de I/O navegador/daemon. Addressables se registra como paquete separado en M39.

## Subtandas previstas

- 24.1 Escenas y ownership.
- 24.2 I/O asíncrono y formatos de recursos.
- 24.3 Descarga, fallos y memoria.

## Criterios de cierre

- [ ] Carga y descarga repetidas ejercitan I/O real; no se cuenta LoadAsync residente como streaming.
- [ ] Referencias, eventos y objetos persistentes sobreviven o se invalidan en el momento correcto.
- [ ] Cancelación/fallo y presupuestos de memoria están probados sin assets huérfanos ni pérdida de authoring.

## Demo editable requerida

Streaming Scenes Lab con cambios de escena, recursos grandes y medición de memoria.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
