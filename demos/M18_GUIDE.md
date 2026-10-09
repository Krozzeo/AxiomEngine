# Demos M18 — 0.0.32

Ejecuta `npm.cmd run demo:m18` y luego `npm.cmd run dev`. Los proyectos anteriores
se conservan. En File → Projects Create / Open, abre un proyecto **Demo · M18**.
Las demos C# requieren .NET 10 SDK y wasm-tools; los errores reales aparecen en IDE.

## Script Component Lab

Al abrirlo se compilan automáticamente sus archivos C#. Selecciona Cube en
Hierarchy: InspectorMover muestra Speed, Direction, Mode y Enabled, además de
Frames, que es de solo lectura. La flecha del encabezado pliega el componente.
Arrastra horizontalmente el nombre Speed o edita su valor. También puedes separar
Inspector en otra ventana. Sin una entidad seleccionada, Transform y Add Component
desaparecen; seleccionar un archivo de Project muestra información del archivo.

Play enfoca Game. Cambia Speed a 0 mientras se ejecuta: Cube deja de moverse y
Frames sigue avanzando y muestra su valor actual. Transform muestra en tiempo
real la posición, rotación y escala del mundo en ejecución. La esfera tiene su propia instancia y continúa moviéndose.
Stop enfoca Scene y descarta los valores cambiados durante Play. También puedes
editar Transform y valores de otros componentes ya agregados; para cambiar la
estructura de entidades o componentes debes detener la ejecución.

Abre InspectorMover.cs desde su enlace en Inspector o con doble clic en Project.
IDE sigue siendo editable durante Play. Ctrl+S guarda el archivo actual; Save All
guarda todos los buffers abiertos. Guardar código durante Play conserva la versión que se está ejecutando.
Compile*, el botón del IDE, Ctrl+D y la API de compilación están bloqueados
mientras Play esté activo. Al detener, Compile* o Ctrl+D compila los cambios; el
siguiente Play utiliza la nueva versión. Si Auto está marcado, los cambios C#
guardados durante Play se compilan inmediatamente después de Stop. Durante la
edición detenida, Auto compila al guardar, no en cada pulsación. No guarda por su
cuenta los buffers pendientes de otras pestañas.

Si falla, Error muestra los diagnósticos y volver a editar habilita Compile*.
Se conserva el último build válido. Volver al código de una compilación válida
puede reutilizar ese resultado. Play compila primero los cambios que lo necesiten.
El ● del nombre del proyecto es un marcador del título.

## Autonomy Position Repair

Target comienza en X=0 y el objetivo guardado exige X=2. Abre AI → AI proposal,
busca Autonomy loop y pulsa Run objective. La primera prueba falla; la reparación
de posición corrige la diferencia dentro de una propuesta aislada. Después vuelve
a probar y ejecuta dos verificaciones medidas en mundos recién inicializados.
La lista conserva el intento fallido.

Al llegar a completed / ready-for-review, MAIN sigue en X=0. Selecciona la propuesta
resultante, usa Review differences y luego Accept reviewed changes si quieres
publicarla. Save es explícito y Undo revierte la publicación. Export evidence
descarga los recibos de los intentos.

## Autonomy Compiler Repair

RepairMover.cs carece deliberadamente de un punto y coma. Error al abrir este
proyecto es esperado. Ejecuta su objetivo desde el mismo Autonomy loop. El primer
intento de compilación falla; el parche exacto incluido repara esa línea. La
siguiente compilación y la prueba de movimiento de 30 frames pasan, seguidas de
dos ejecuciones nuevas. El archivo original de MAIN se conserva hasta que aceptes
la propuesta revisada.

Las políticas incluidas reparan diferencias de posición o parches exactos de
código. Resolver objetivos arbitrarios en lenguaje natural requiere un cliente
AI externo que proporcione un plan estructurado por la API semántica. Estas demos
no conectan ni cobran un modelo automáticamente. Cancelar o agotar los límites de
tiempo, intentos o comandos conserva MAIN y retiene la propuesta sin verificar y
su evidencia. Las mediciones incluyen el puente, la simulación de paso fijo y la
presentación; no son una garantía de rendimiento de una GPU física.
