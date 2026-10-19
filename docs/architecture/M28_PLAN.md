# M28 — Física 2D CPU/GPU: joints y simulación avanzada

Plan vigente desde 2026-10-19; ampliación explícita de físicas GPU/shaders. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M27, M25.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json) · [Plan GPU y shaders](GPU_PHYSICS_AND_SHADERS_PLAN.md)

## Alcance requerido

- Completar Rigidbody2D, interpolación, sleeping, CCD, efectores y configuración de simulación.
- Implementar familias Joint2D del inventario, motores, límites, roturas y colisiones conectadas.
- Validar plataformas, vehículos y cadenas 2D, integración con animación/tiles y rendimiento estable.
- Implementar backend GPU 2D con shaders WGSL propios sobre la infraestructura M25.0, solver/constraints 2D e integración Physics2D/Rigidbody2D; selección CPU/GPU/Auto, fallback y comparación funcional/rendimiento. No depende de cerrar GPU 3D en M26.

## Subtandas previstas

- 28.1 Solver y efectores.
- 28.2 Joints, motores y límites.
- 28.3 Mecánicas y estrés.
- 28.4 Integración, broadphase y contactos GPU 2D para el conjunto de formas acordado.
- 28.5 Solver GPU 2D, fricción/restitución, sleeping, joints, motores y efectores del alcance.
- 28.6 Integración API/consultas/eventos, lifecycle y estrés CPU/GPU con métricas y diagnósticos.

## Criterios de cierre

- [ ] Cada familia asignada tiene un escenario de fuerzas/limitación/rotura y resultados verificables.
- [ ] Pausa, cambio de body type, desactivación y destrucción no dejan constraints huérfanas.
- [ ] La simulación y las consultas mantienen consistencia entre C# y kernel a diferentes pasos fijos.
- [ ] Los shaders físicos 2D producen resultados reales y consistentes con la CPU dentro de tolerancias, conservan el plano 2D y cubren consultas/eventos/constraints del contrato.
- [ ] La comparación CPU/GPU y la recuperación/fallback pasan en la matriz de hardware M19 con demos y mediana/P95; las funciones no aceleradas siguen visibles y no completan el alcance GPU mínimo.

## Demo editable requerida

2D Mechanics Lab con plataformas, péndulos, cadenas y suspensión. Extender Stress Physics 2D y CPU/GPU Physics & Shader Lab, sin solver especial de demo.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 8 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
