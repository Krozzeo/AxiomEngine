# M18.3.12 — Inspector, Hierarchy y apertura de escenas

Versión 0.0.51 / SDK 8. Revisión correctiva posterior al cierre acordado de M18.4, sin cambiar el alcance de M19–M40. Implementación completa; validación funcional local y comparación de píxeles WebGPU aprobadas. El CI general continúa en curso; se informa separado de los trabajos ya completados.

## Resultado y aceptación

| Solicitud | Resultado |
| --- | --- |
| Always active a la izquierda del candado | Passed: orden DOM y presentación comprobados en navegador |
| Título de escena con ancho natural, a la izquierda | Passed: sin crecimiento flex; conserva truncado para títulos que no caben |
| Quitar ayuda de selección/arrastre del Hierarchy | Passed: elemento eliminado |
| Quitar línea Demo/Saved/revision del Hierarchy | Passed: estado interno oculto; barra superior conserva el guardado |
| Todos los campos compatibles se resaltan y el hover es más intenso | Passed: entidades, componentes de scripts, archivos, documentos separados, solo lectura, incompatibilidad y proyecto incorrecto; limpieza al soltar/cancelar |
| Una sola acción Panels → Inspector; ninguna en Create | Passed: crea/restituye un lugar de Inspector con foco actual; ocho simultáneos, cierre libera lugar, sin submenú de instancias |
| Corregir primera apertura de Scenes & Resources | Passed funcional: HDR desde la primera apertura, mismos ajustes tras revisitar/cerrar/reabrir/guardar; configuración explícita y modos 2D/3D preservados |

## Causa del render incorrecto

Arena se genera con entidades pero sin ajustes de renderizado. La apertura anterior eliminaba el ajuste global `rendering`, seleccionando la ruta legacy, con fondo oscuro y sombreado distinto. Al activar otra escena, `syncSceneDocuments` copiaba ajustes ausentes hacia documentos inactivos. Arena recibía entonces HDR y se veía diferente al volver.

[Reproducción antes/después](m18-3-12-render-reproduction.json) contra el código padre `74261599ff7336a229d4827a4ba3c8fc18c5f20a`: antes `legacy → hdr`; después `hdr → hdr`. Es evidencia de selección de ruta, no de píxeles GPU.

Ahora se resuelven los ajustes omitidos antes de activar un documento recién abierto y se incorporan al documento de trabajo. Save los persiste. La sincronización conserva los ajustes de documentos inactivos. Se respetan valores explícitos y no se hereda el modo 2D sobre uno 3D explícito, ni viceversa.

## Verificación ejecutada

- `npm run check`: 431 pruebas Node aprobadas; build, herramientas, bindings, esquemas, arquitectura y paridad aprobados.
- `npm run check:native`: formato, Clippy y 44 pruebas Rust aprobados.
- `npm run test:browser:m18-3-11`: nueve grupos aprobados, sin errores JavaScript; controles, factory de Inspector, matriz de referencias y documentos separados.
- `npm run test:browser:m18-3-10`: doce grupos aprobados, sin errores JavaScript; laboratorios reales, referencias ejecutadas por C# y regresión de Arena.
- `npm run test:browser:m18-3-12`: tres grupos funcionales aprobados, sin errores JavaScript; primera apertura de la demo real, revisita y reapertura.
- [Evidencia local resumida](m18-3-12-local.json). Entorno Windows con Null Renderer: no se declara aprobada una comparación visual WebGPU local.

La suite nueva compara los PNG del canvas en WebGPU: diferencia media inferior a un nivel RGB y menos del 1% de píxeles con diferencia mayor de 15 niveles RGB sumados. En Null registra explícitamente indisponibilidad. Se añadió al trabajo de navegador de GitHub Actions; resultado remoto se registra separado de esta evidencia local.

### WebGPU remoto aprobado

[CI 319](https://github.com/Krozzeo/AxiomEngine/actions/runs/39422253864), código `915940d2e953ab07892bb4cef891a70f8f246b4e`, árbol `801e9247560790881d1a71b12e8c1ac1f371813f`: trabajo `browser-milestones (m18-3-12)` aprobado, cuatro grupos, con WebGPU obligatorio en CI. Las capturas de primera apertura y revisita registraron **diferencia media RGB 0 y fracción de píxeles diferentes 0**. También está aprobado el trabajo de Inspector `m18-3-11`.

[Evidencia remota y snapshot de trabajos](m18-3-12-remote.json). Ubuntu con Vulkan de software; esto verifica píxeles WebGPU, sin acreditar rendimiento en GPU física. La ejecución general tiene 44 trabajos y sigue en curso al registrar esta evidencia: no se declara verde ni se hereda el resultado de una revisión anterior. El commit posterior de documentación no modifica el código ejecutable probado.

El CI anterior 318 terminó con 42/43 trabajos aprobados; falló `browser-milestones (m18-2)`. Ese resultado histórico no verifica esta revisión ni se presenta como verde.

## Demos y continuidad

[Guía de demostración](../../demos/M18_3_12_GUIDE.md). `npm run demo` crea proyectos nuevos sin reemplazar existentes; los nombres de los labs conservan M18.3.10. Las correcciones forman parte de los controles y escenas normales del editor, sin implementación exclusiva para las demos.

No se solicita al usuario repetir las pruebas automatizadas. La comprobación de colores en WebGPU ya pasó en el trabajo remoto; no se confunde con rendimiento en GPU física.

M18.4 permanece cerrada según ADR-0034. La validación nativa de cuenta GitHub sigue aplazada explícitamente por el usuario. Fluidez de físicas densas y pruebas de modelo conectado continúan pendientes. Esta revisión no añade cobertura de Unity API ni físicas GPU; el próximo hito principal es M19. No hay fusión automática.
