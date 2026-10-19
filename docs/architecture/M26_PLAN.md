# M26 — Física 3D CPU/GPU: solver avanzado y controladores

Plan vigente desde 2026-10-19; ampliación explícita de físicas GPU/shaders. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M25.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [Plan GPU y shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Alcance requerido

- Completar Rigidbody, centros de masa, inercia, interpolación, sleep automático, CCD y configuración del solver.
- Joints y articulaciones del inventario, CharacterController y WheelCollider/vehículos con comportamiento real.
- Separar creación/topología de simulación estable, medir estabilidad y throughput; Cloth se implementa en M34 con integración física.
- Implementar backend físico WebGPU opcional con kernels WGSL propios, desde cuerpos simples hasta broadphase, contactos, solver y constraints del contrato. Integrar C#, consultas/eventos y render con selección medida CPU/GPU/Auto y fallback explícito.

## Subtandas previstas

- 26.1 Dinámica e interpolación/CCD.
- 26.2 Joints y articulaciones.
- 26.3 Personajes, vehículos y estrés.
- 26.4 Prototipo GPU 3D: gravedad, integración, rotación y cuerpos simples; consume M25.0.
- 26.5 Broadphase/narrowphase GPU, parejas/contactos, filtros y presupuestos para formas 3D del contrato.
- 26.6 Solver GPU 3D, fricción/inercia/sleep/islas/constraints, integración API y benchmark estable CPU/GPU.

## Criterios de cierre

- [ ] Escenarios de joints/controladores/vehículos tienen aserciones de comportamiento y estabilidad.
- [ ] Los casos rápidos y angulares validan los modos CCD implementados y sus límites.
- [ ] El estrés mide simulación estable, memoria y regresiones; no deduce FPS universal de la capacidad máxima.
- [ ] El alcance 3D acelerado ejecuta física real en GPU y coincide con el corpus CPU dentro de tolerancias, incluyendo consultas, eventos, activación y cambios de topología; fallback y límites son visibles.
- [ ] La demo compara el mismo escenario CPU/GPU, muestra backend/motivo y aporta mediana/P95 del sistema completo y evidencia en hardware físico según el contrato M19; el mínimo GPU no se sustituye íntegramente por CPU.

## Demo editable requerida

3D Mechanics Lab con ragdoll, personaje, vehículo y banco de estrés. Extender Stress Physics 3D y CPU/GPU Physics & Shader Lab con selección CPU/GPU/Auto y mediciones reproducibles.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 8 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
