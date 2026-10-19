# M18.3.11 — 0.0.49 / SDK 8

Corrección solicitada antes de M18.4 y del roadmap M19–M40. No cambia las 23 milestones principales pendientes ni atribuye cobertura de Unity a etapas futuras.

## Entregables

- Referencias: valida el tipo durante hover (incluye el modo protegido del drag), rechaza un componente incompatible y resuelve un componente al soltar su GameObject. Conserva referencias por proyecto y metadatos tipados, incluyendo 2D y scripts propios.
- Project: breadcrumb por segmentos; escenas sin preview JSON; Open in IDE; advertencia al eliminar una escena abierta o su carpeta.
- Inspectors: ocho como máximo; cerrar un adicional destruye su panel, controles, ventana y registro de layout; libera ID y plaza; Panels agrupa los inspectores en submenú y vuelve a entrada única al quedar uno.
- Escenas: abrir desde Project expande; cerrar todas muestra No active scene; orden de encabezados por arrastre; Create > Scene cierra el menú; escena nueva usa cubo, Camera y Directional Light con el mismo importador y ajustes del proyecto 3D.
- Play: por defecto carga solo la activa. El candado azul marca Always active y guarda el modo. Estas escenas se cargan juntas, conservan encabezados/propietarios separados y comparten objetos/scripts. LoadScene(Single) conserva las escenas marcadas; para descargarlas explícitamente hay que quitar antes la marca. Stop restaura autoría.
- SDK 8: GameObject.scene; Scene.alwaysActive; SceneManager.SetSceneAlwaysActive/IsSceneAlwaysActive. El modo Always active es una extensión propia de Axiom, no una API de Unity.
- Componentes: checkbox antes de X para scripts, cámara, renderable, collider, luz, audio, animator y componentes 2D aplicables. Estado compartido con C# .enabled en las fachadas soportadas. Transform/Rigidbody no reciben enabled. Campos show-only sin cajas de edición negras; títulos y Transform compactados. AudioListener conserva su campo de datos por compatibilidad y muestra un único control.
- Física: actualización de poses por lote con padres resueltos una vez; índices Map en lugar de búsquedas repetidas; AABB precalculado y eje de barrido adaptativo; evita agregación de contactos redundante con un solo substep; grounded se deriva de contactos nativos completos, sin raycast por objeto/fase; snapshots de física reutilizados hasta la siguiente mutación. Las colisiones 2D siguen ignorando profundidad.
- Capacidades finitas: 65.536 entidades/cuerpos/draws, 4.000.000 vértices de escena; 65.536 quads/batches 2D. Siguen los demás límites explícitos: 32 scripts, 128 operaciones por respuesta, 32 voces, 16 escenas, 32 MiB de petición y 16 MiB de respuesta SDK; el archivo de proyecto conserva 4 MiB y los documentos de escena 32 MiB. Alcanzar el máximo depende de los presupuestos combinados y del hardware.
- FPS: también visible en Game separado mientras Scene es la vista principal.
- Windows: cancelar compilación usa cierre directo del hijo si falla el cierre del árbol de procesos; evita dejar trabajos de prueba esperando indefinidamente.

## Evidencia local

- `npm run check`: 415 tests Node, esquemas, catálogo de herramientas, bindings y reglas de arquitectura/paridad pasan.
- `npm run check:native`: formato, clippy sin warnings y tests Rust pasan.
- `tests/browser/m18-3-11.mjs`: siete grupos reales, con C# publicado y ejecutado: hover protegido y referencias tipadas, ciclo de ocho Inspectors, breadcrumb/IDE, Play activo, checkbox live, Managers persistente y FPS en Game separado.
- Regresión M18.3.10: ejecución final pendiente. CI remoto: pendiente; no se da por aprobada una ejecución pendiente.
- El navegador local usó Null por falta de adaptador WebGPU. Prueba lógica/C#/Wasm; no demuestra renderizado en GPU física. CI conserva su ruta de WebGPU de software.

## Rendimiento medido

Benchmark reproducible: `npm run benchmark:m18-3-11`. Veinte actualizaciones después de tres de calentamiento, cuerpos separados cayendo, sin scripts, UI ni draws. Datos antes/después en [m18-3-11-physics.json](m18-3-11-physics.json).

Con 255 cuerpos: antes ~31 ms por actualización; después ~0,69 ms (2D) y ~0,48 ms (3D) en esta máquina. Con 2.048 cuerpos: ~5,38 ms en 2D y ~4,84 ms en 3D. Esto mide el cuello de botella corregido; no equivale a FPS del editor, ni predice pilas densas, renderizado o creación de objetos. El solver continúa siendo CPU/Wasm, con coste dependiente de contactos y densidad. No se promete capacidad ilimitada ni 60 FPS al máximo.

Prueba completa del editor: `npm run test:browser:m18-3-11-stress`. C# crea 1.024 cuerpos dinámicos (1.025 con el suelo) en 17,18 s, sin errores ni bloqueo por el antiguo tope. A los 1,5 s de completar la creación se midieron 5,1 FPS, ~185 ms de trabajo por frame, ~77 ms en pasos fijos de física y ~87 ms de ida/vuelta de scripts; son ámbitos anidados, no deben sumarse entre sí. Backend local Null, sin GPU física. **La fluidez de miles de cuerpos densos sigue pendiente**: el aumento de capacidad y el benchmark aislado no cumplen por sí solos ese objetivo. Faltan optimizaciones del intercambio C#/JS y del solver con muchos contactos; medir nuevamente en GPU y CI. Se conservan las 12 iteraciones del solver y el reloj fijo (verificado mediante FixedSeconds), sin rebajar precisión para aparentar FPS.

Además del cambio de barrido, se reutilizan inercia, ejes y matrices de respuesta por contacto; se evita sincronizar entidades repetidas en fases sin cambios y se agrupan ticks fijos sin observadores conservando el tiempo acumulado.

## Continuidad

Revisión sobre la rama de planificación de PR #41. Mantener los PRs apilados sin fusionar automáticamente. Después de la aceptación de esta corrección: M18.4 → M19 (inventario y contrato medible) → M20–M39 → M40. Cobertura global ampliada de Unity sigue sin denominador auditado; no convertir una lista de miembros o una stub en paridad funcional.
