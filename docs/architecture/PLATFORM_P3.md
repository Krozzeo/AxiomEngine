# P3 — AI compartida y revisión

Entrega candidata feat/p3-platform-ai, sobre d6aad38 de P2. El usuario pidió avanzar P3; #55 y la integración P2 siguen pendientes. No se mueve main/recovery ni se cambia scripting SDK 8/formato de proyecto 1.

## Cambio

OpenAiAssistant hereda AiRuntime del proveedor Axiom Platform 017e54168f87ea5a0d5b97adfbb2314673bc298d, instalado por HTTPS con integridad. Transporte/modelos/límites/consumo, ciclo de tarea y turnos salen de la clase de juegos. El registro/validador, diff/hashes/gates humanos y codec de journal también se consumen del proveedor.

Se conservan contexto/instrucciones de escenas, C#, PMD, aprobación y aceptación de dominio; work schemas, preflight, selección de herramientas, WorkOrderStore como adaptador del payload, conciliación de efectos, recursos y transacción/rollback de MAIN. El controlador de autonomía determinista sigue siendo específico del motor. Se mantienen aliases/nombres y formatos históricos.

Alojado: el adaptador crea SharedAiProvider por IPC. Host retiene la clave y fija el scope de contabilidad; el producto no hereda OPENAI_API_KEY. Una clave introducida desde su UI transita al host y no se retiene en el proveedor IPC. Cuenta compartida; modelo/límites/confirmaciones/tareas por proyecto, sin privilegios nuevos. Cerrar un producto no desconecta los demás. Desconectar/epoch cancela tareas; una respuesta tardía no llama herramientas. Arranque directo mantiene transporte común y cuenta propia.

La configuración recuerda modelo; al reabrir debe probarse la conexión. Las ubicaciones y formatos de configuración/journals existentes se conservan, sin una migración destructiva. El ledger del host es adicional a los presupuestos por proyecto: informa tokens y consumo desconocido, no dinero ni límites de cuenta.

## Validación

npm run check: 445/445. Enfoque AI/work orders/propuestas: 95/95. Platform: 21 tests incluyendo tres integraciones reales con aprobación, aislamiento, aplicación/reapertura, cancelación/tardía/429 y conflictos sin overwrite. Browser P3 prueba el mismo recorrido desde UI. HTTP AI controlado; Null; ninguna clave o aceptación de modelo real. [Guía P3](https://github.com/Krozzeo/AxiomPlatform/blob/feat/p3-ai-and-changes/docs/P3_GUIDE.md).

P3 se entrega con PR base feat/p2-platform-services; no integrar con checks fallidos ni atribuir #55 a esta extracción sin evidencia. P4/P5 y M19–M40 (Unity/shaders/GPU) siguen independientes.
