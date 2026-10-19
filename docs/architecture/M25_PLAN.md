# M25 — Física 3D: geometrías, consultas e infraestructura compute

Plan vigente desde 2026-10-19; ampliación explícita de físicas GPU/shaders. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M20, M21, M22, M24.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [Plan GPU y shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Alcance requerido

- Completar colliders primitivos, cápsulas, compuestos, mallas/convexos y terreno; materiales físicos y transformaciones de colliders.
- Raycasts, sweeps, overlaps, filtros, contactos y sobrecargas asignadas, incluyendo consultas sobre escenas físicas.
- Definir backend, unidades, tolerancias y presupuestos; extender o sustituir solver mediante ADR con evidencia.
- Entregar infraestructura WebGPU compute/WGSL compartida: buffers/layouts, dispatch, sincronización/readback, caché/diagnóstico de shaders, capacidades y pérdida de dispositivo. Medir/reducir sincronización C#/JS; mantener CPU/Wasm como base.

## Subtandas previstas

- 25.0 Infraestructura compute WGSL, contrato de recursos/sincronización y benchmark CPU/puente; no depende de completar M30.
- 25.1 Backend, geometrías y materiales.
- 25.2 Consultas y filtros.
- 25.3 Contactos, escenas y rendimiento.

## Criterios de cierre

- [ ] Las consultas verifican distancias, normales, capas y triggers en geometrías de referencia.
- [ ] Escala/rotación/parenting y límites generan resultados documentados o errores explícitos.
- [ ] Pruebas nativas, Wasm y C# cubren los mismos casos y registran precisión/coste.
- [ ] M25.0 ejecuta kernels WGSL reales de prueba con resultados verificados, recursos liberados, fallos explícitos y baseline CPU/C#/JS; su infraestructura se reutiliza en M26/M28/M30 sin ciclo de dependencias.

## Demo editable requerida

3D Collider & Query Lab con cápsulas, mallas, compuestos y sweeps.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 8 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
