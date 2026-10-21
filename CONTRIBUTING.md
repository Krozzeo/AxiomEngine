# Contribuir a Axiom Game Engine

Partir del `main` actualizado y crear una rama corta por cambio. Cada PR apunta a `main`; evitar cadenas de PR dependientes como flujo habitual. Conservar la recuperación 0.0.52 y no mover sus etiquetas.

Describir el problema, comportamiento resultante, alcance y verificación real. Distinguir pruebas con adaptadores controlados de servicios/cuentas reales y Null de WebGPU. Mantener visibles límites, fallos y verificaciones aplazadas. No versionar tokens, proyectos personales, dependencias instaladas ni compilados generados.

Ejecutar `npm run check`; para Rust, `npm run check:native`. Elegir los recorridos `test:browser:*` afectados y comprobar el CI completo antes de declarar una entrega verde. No eliminar asserts ni aumentar timeouts para ocultar fallos. Las actualizaciones de bindings y referencias generadas se realizan mediante los scripts del repositorio.

Actualizar el estado y la guía correspondiente si cambia el comportamiento. Registrar decisiones arquitectónicas en ADRs y cambiar milestones únicamente con alcance y criterios explícitos. Informes anteriores se conservan como evidencia histórica.

Tras integrar una rama, verificar que su SHA es ancestro de `main` antes de retirarla. Para recuperar una entrega usar una rama desde la etiqueta y revisar el cambio; consultar [recuperación](docs/REPOSITORY_MAINTENANCE.md).

Para la separación de la familia, consultar [P0](docs/architecture/PLATFORM_TRANSITION.md). Contratos comunes en AxiomPlatform, dominio/adaptador aquí. MIT según LICENSE; licencias de terceros conservadas.
