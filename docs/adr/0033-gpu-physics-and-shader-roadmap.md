# ADR-0033: planificación explícita de físicas GPU y shaders

## Contexto

El usuario solicita incorporar físicas GPU opcionales 2D/3D y el desarrollo de shaders al roadmap. ADR-0009 ya admite promoción medida a GPU y ADR-0006 establece WGSL. M30 incluye shaders/compute genéricos, pero no había etapas explícitas ni gates de aceptación para un backend físico GPU. La implementación verificada 0.0.49 / SDK 8 continúa usando CPU/Wasm para física; el intercambio C#/JS también limita las escenas densas.

## Decisión de alcance

Se incorpora el [plan de físicas GPU y shaders](../architecture/GPU_PHYSICS_AND_SHADERS_PLAN.md) como obligación futura de M25/M26/M28/M30, con auditoría M19, conformidad M39 y hardening M40. Se conservan las 45 milestones principales y M40 final; las nueve subtandas añadidas no son milestones principales nuevas. Su aceptación inicial es 0%.

M25.0 entrega infraestructura compute WGSL compartida antes de los solvers GPU, sin depender de completar M30. M26.4–26.6 implementan el backend 3D; M28.4–28.6, el 2D; M30.4 unifica shaders y sus APIs; M39.4 verifica conformidad CPU/GPU. M25 depende ahora de M24; M28/M30 reutilizan M25. No introducir una dependencia circular con gráficos.

Se mantiene la base CPU/Wasm y el principio de selección medida de ADR-0009. GPU es opcional, con contrato de sincronización, consultas, eventos, recursos y alternativa CPU verificable. WGSL de producción es la ruta inicial; no se selecciona CUDA/PhysX ni se incorpora un proveedor externo por esta decisión. La forma exacta de los kernels, algoritmos, formatos, tolerancias y perfiles queda sujeta al contrato M19 y a ADRs de implementación.

## Consecuencias y aceptación

Los nuevos gates son obligatorios para cerrar las milestones responsables. Se exigen comportamiento real, pruebas de fallos/fallback, integración con scripting y render, demos editables, benchmark completo y evidencia en GPU física. No se promete determinismo bit a bit entre GPU/fabricantes ni velocidad universal. El replay estricto CPU se conserva; las restricciones GPU se publican.

Planificar no implementa shaders ni física GPU, no modifica la release 0.0.49, no cierra las correcciones actuales y no suma cobertura de Unity. Los cambios de interfaz/render pedidos por el usuario permanecen pendientes y no se implementan en este commit de planificación.

## Estado

Aceptada como ampliación de alcance por solicitud del usuario del 2026-10-19. **Implementación pendiente**; complementa ADR-0006/0009 y no los sustituye.
