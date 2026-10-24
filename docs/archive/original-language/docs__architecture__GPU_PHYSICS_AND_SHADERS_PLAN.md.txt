# Físicas GPU y desarrollo de shaders — planificación

Decisión de alcance solicitada el 2026-10-19. **Planificada, no implementada; 0% de aceptación nueva.** Base ejecutable: 0.0.49 / SDK 8, código verificado en CI 315. Este documento no cambia el ejecutable, no habilita físicas GPU ni implementa los ajustes de interfaz solicitados en paralelo.

## Antecedentes y decisión

ADR-0009 ya preveía promover trabajo de física a GPU después de medir una base CPU/Wasm. ADR-0006 establece WGSL como lenguaje nativo. M30 contemplaba shaders y compute/readback en general. Faltaban responsables, subtandas y aceptación explícita para físicas GPU 2D/3D: esta ampliación los incorpora como trabajo requerido del roadmap.

Se conservan **45 milestones principales, 22 cerradas y 23 pendientes**. No se añade una milestone principal ni se renumera M19–M40; M40 continúa al final. Se añaden nueve subtandas dentro de M25, M26, M28, M30 y M39, y se amplían contratos/aceptación de M19, M27 y M40. Planificar shaders no suma cobertura API ni implementación física.

## Resultado esperado

Backend WebGPU opcional para físicas 3D y 2D, con compute shaders WGSL de producción, selección CPU/GPU/Auto y alternativa CPU/Wasm completa. La GPU se elige por capacidades, compatibilidad de la escena y beneficio medido; tener renderizado GPU no implica físicas GPU. No se exige CUDA ni una marca de GPU. Un backend nativo adicional, si se decide, se tratará en M37 con su propia evidencia.

La implementación CPU sigue siendo necesaria para equipos sin GPU compatible, escenas pequeñas, funciones todavía no aceleradas y el modo de replay estricto. Una escena incompatible permanece en CPU con motivo visible. No se separan cuerpos que deban colisionar entre dos mundos CPU/GPU sin un algoritmo de interacción verificado.

## Ubicación y orden de desarrollo

| Etapa | Entrega exacta | Prerrequisitos y cierre |
| --- | --- | --- |
| M19.3, ampliada | Contrato CPU/GPU: funciones acelerables, consultas/eventos, precisión, selección y matriz de hardware. Congelar workloads, umbrales y presupuestos. | Auditoría M19; no fijar porcentajes o FPS sin medición. |
| **M25.0, nueva** | Infraestructura compute compartida: buffers, layouts, dispatch, sincronización, ownership, lectura asíncrona, límites, pérdida de dispositivo, caché y diagnóstico WGSL. Medir y reducir el puente C#/JS. | M19, M21, M22 y M24; se entrega antes de las fases GPU de M26/M28. No depende de completar M30. |
| **M26.4, nueva** | Prototipo 3D limitado: gravedad, integración de velocidad/rotación y cuerpos simples con un suelo. Primeros kernels WGSL y selección explícita CPU/GPU. | Base CPU de M25/M26 y M25.0. Es un prototipo parcial; no se declara solver completo. |
| **M26.5, nueva** | Broadphase GPU, generación de parejas/contactos y narrowphase para el conjunto 3D acordado. Manejo de capacidad y filtros. | M26.4 y geometrías CPU verificadas. CPU fallback explícito para formas aún no aceleradas. |
| **M26.6, nueva** | Solver 3D: respuesta de contacto, fricción, restitución, inercia, sleep/islas y constraints del alcance GPU. Integración de CCD, joints/controladores según matriz; consultas, callbacks y scripting coherentes. | M26.5 y las subtandas CPU de M26. Tolerancias, escenarios estables y benchmark completo aprobados. |
| **M28.4, nueva** | Backend 2D y kernels propios: integración, broadphase/contactos de círculos, cajas y formas del contrato, respetando el plano 2D. | M27 y la infraestructura de M25; no requiere cerrar el solver GPU 3D de M26. |
| **M28.5, nueva** | Solver 2D, fricción/restitución, sleeping, joints, motores, límites y efectores del alcance acelerado. | M28.4 y subtandas CPU de M28. No asumir que los kernels 3D producen semántica 2D equivalente. |
| **M28.6, nueva** | Integración Physics2D/Rigidbody2D, consultas, eventos, creación/destrucción/activación, comparación CPU/GPU y estrés. | M28.5; misma escena y corpus en ambos backends. |
| **M30.4, nueva** | Unificar el sistema de shaders del motor: recursos compartidos render/compute, caché, variantes, validación, diagnóstico, recompilación segura en desarrollo y pruebas. Exponer las APIs Shader/ComputeShader asignadas por M19. | Reutiliza M25.0; M30 conserva sus shaders gráficos y su contrato de compatibilidad de lenguajes/pipelines. |
| **M39.4, nueva** | Conformidad cruzada CPU/GPU del inventario físico y de shaders; publicar funciones aceleradas, parciales, CPU fallback y bloqueadas. | M26, M28 y M30 aceptadas. Un backend parcial no gana crédito por compilar nombres. |
| M40.2, ampliada | Hardening de GPU: equipos/tiers reales, dispositivos ausentes/perdidos, memoria, sesiones prolongadas, instalación y recuperación. | No cerrar M40 con gates GPU pendientes ni usando Null como prueba de aceleración. |

M25 adquiere dependencia de M24 por el ciclo de vida de recursos y sincronización. M28 y M30 adquieren dependencia de M25 por la infraestructura compartida. La dependencia principal de M25 es conservadora: M25.0 puede entregarse antes que las geometrías restantes; las tareas CPU independientes pueden avanzar mientras tanto. No existe dependencia inversa M25 → M30, evitando un ciclo.

El orden inmediato no cambia: terminar las correcciones de editor/render y el rendimiento CPU/puente actualmente pendientes, M18.4, M19, y luego las etapas anteriores según dependencias. Planificar GPU no posterga ni da por resuelta la lentitud actual. El prototipo se evalúa por separado antes de ampliar el solver.

## Shaders que se deben desarrollar

- Gestión de cuerpos activos y datos de simulación; integración de fuerzas, velocidades, posición y orientación.
- Límites espaciales, clasificación/estructura de broadphase, generación y compactación de parejas y contactos con contadores acotados.
- Narrowphase de las formas 2D/3D incluidas en el contrato; filtros, triggers y materiales físicos.
- Solver iterativo de contactos y constraints, con estrategia de paralelización, orden, barreras y concurrencia definida. Incluye sleep/despertar e islas cuando corresponda.
- Consultas y extracción de resultados/eventos que efectivamente se asignen a GPU; no prometer una consulta GPU si la ejecuta el espejo CPU.

Cada kernel tiene fuente WGSL versionada, layout y variantes registrados, límites de trabajo/memoria, diagnóstico asociado a fuente y pruebas funcionales. Los kernels de físicas no reemplazan los shaders gráficos existentes. M30 desarrolla la capa general y sus APIs; no se promete traducción automática universal desde HLSL/ShaderLab ni Shader Graph por añadir compute.

## Contrato con scripting, render y replay

- C# conserva una fachada funcional común y el paso fijo; documentar las opciones de backend de Axiom como extensiones, sin atribuirlas a Unity. Las propiedades y consultas síncronas deben corresponder al estado del tick establecido, no a datos atrasados ocultos.
- Mantener los datos de simulación en GPU cuando sea viable y reutilizarlos para dibujar. Reducir snapshots JSON, asignaciones y lecturas completas por fase; medir también el coste C#/JS, no solo los kernels.
- Readback de callbacks/consultas acotado y sincronización definida. Si un modo no conserva el contrato, usar CPU para esa escena o registrar el bloqueo; no devolver éxito con información ficticia.
- Cambios de backend en un límite seguro de tick, con snapshot de cuerpos, velocidades, rotaciones, constraints y estado requerido. No duplicar eventos ni reiniciar silenciosamente la simulación.
- Registrar backend real, motivo de selección/fallback, capacidades, memoria, dispatch, tiempos CPU/GPU y readback. Respetar presupuestos combinados; no ofrecer cantidades ilimitadas de cuerpos o contactos.
- Definir tolerancias de precisión y estabilidad. No prometer identidad bit a bit entre fabricantes o entre CPU/GPU. El replay estricto conserva CPU/Wasm; registrar backend, configuración, versión/hash de kernels y política de comparación para replay GPU.
- Device loss: recuperar en CPU desde un estado coherente comprobado o pausar con diagnóstico si no puede garantizarse. Probar Play/Stop, cambio de escena, Always active, activación y destrucción durante la simulación.

## Pruebas, demos y aceptación

Extender las demos editables **Stress Physics 2D & 3D API Lab** y añadir **CPU/GPU Physics & Shader Lab** usando las rutas reales del motor. Deben permitir comparar el mismo escenario, semilla y paso fijo, mostrar backend/motivo y conservar la autoría al detener Play. Las demos no tendrán un solver especial que el motor público no utilice.

- Cargas iniciales: 16, 64, 256, 1.024 y 4.096 cuerpos, hasta donde permitan los presupuestos declarados. Caída dispersa, pilas densas, contactos sostenidos, joints, objetos rápidos, triggers, raycasts y cambios de topología.
- Comparar CPU y GPU con el mismo render, scripts y calidad física. Medir física aislada y editor/juego completo: tiempo por fase, FPS, mediana/P95, creación/eliminación, memoria y transferencia. No reducir iteraciones o precisión de forma oculta para presentar aceleración.
- Fijar en M19 duración, calentamiento, repeticiones, hardware/tiers y umbrales de mejora/estabilidad antes de evaluar. La selección Auto necesita una mejora demostrada en cargas declaradas; un shader compilado no satisface rendimiento.
- GPU física: al menos un equipo con integrada y otro con dedicada, de fabricantes diferentes, dentro de la matriz soportada. CI con WebGPU de software aporta regresión pero no sustituye las mediciones físicas. Hardware no disponible significa gate bloqueado, no prueba aprobada.
- CPU forzada y GPU ausente/incompatible, límites de memoria, shader inválido, dispositivo perdido y fallos de recuperación tienen pruebas negativas. Null solo acredita fallback/funcionalidad CPU.
- C# desarrollo/AOT/Windows, kernel nativo/Wasm y corpus de consultas/eventos/lifecycle deben pasar según cada perfil. El alcance GPU mínimo acordado no puede cerrarse desviándolo íntegramente a CPU; las funciones fuera de ese alcance permanecen visibles.

No se fija aquí una fecha ni se promete un multiplicador de FPS. M19 y el prototipo medirán esfuerzo y beneficio. M26/M28 no cierran sus nuevas obligaciones GPU si faltan funcionalidad, estabilidad, evidencia o hardware.

## Referencias y seguimiento

- [Roadmap](ROADMAP_M19_M40.md) y [manifest](roadmap-v2.json).
- [ADR-0009: CPU-first measured hybrid physics](../adr/0009-cpu-first-hybrid-physics.md).
- [ADR-0006: WGSL native shaders](../adr/0006-wgsl-native-shaders.md).
- [ADR-0033: planificación explícita de físicas GPU y shaders](../adr/0033-gpu-physics-and-shader-roadmap.md).
- [WebGPU](https://www.w3.org/TR/webgpu/).
- [Mediciones actuales de CPU/Wasm](../reports/M18_3_11_CURRENT_REPORT.md): no son resultados del backend GPU planificado.
