# Demos M16 — edición de archivos y rendimiento

En PowerShell, desde la carpeta de M16:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

El generador conserva los proyectos existentes. File → Projects → Refresh list,
selecciona una demo y Open. Conserva .axiom/projects con todos sus assets/scripts al
pasar a otra carpeta de milestone. Game muestra la cámara; Play inicia la simulación.
Crear/ver scripts no exige .NET; compilarlos requiere .NET 10 y wasm-tools.

## Editor & File Workshop

Verás un cubo, una esfera y una cápsula, una Camera editable y Directional Light.
Config → HDR Rendering tiene Environment RGB 0.12, 0.16, 0.24: esa iluminación de
relleno evita caras totalmente negras. El proyecto 3D nuevo usa Environment = 0;
por eso sus caras sin luz directa quedan negras. Puedes configurar el relleno o
crear otra luz. No se agregó una luz global oculta.

Project contiene Scripts/Gameplay/WorkshopController.cs y
Assets/Examples/Settings.json. Click derecho en el área de iconos → New Folder o
New C# Script; escribe el nombre y Enter, o cambia el foco. Escape cancela.
Create → C# Script usa la carpeta abierta. Renombrar un script actualiza su clase;
su plantilla tiene OnStart, OnUpdate(double) y OnStop vacíos, sin APIs de Unity.

Arrastra archivos/carpetas entre iconos y árbol, dentro de un directorio o hacia
Project para llevarlos a la raíz. Un segundo click lento renombra. Ctrl+C/V copia;
Supr pide confirmación. Assets/Scripts/Scenes son raíces protegidas. Un asset aún
referenciado no permite eliminar su último archivo. Copiar assets conserva una
referencia a sus datos inmutables. Save/Undo/Redo cubren las operaciones de archivos.
Copy Path entrega la ruta relativa portable. Show in Explorer abre una exportación
del borrador; editar esa exportación no actualiza automáticamente el proyecto.

Hierarchy → click derecho: Rename, Locate, Copy, Eliminate y Create. Create sobre
una entidad crea un hijo; Ctrl+C/V duplica entidades/hijos con IDs nuevos. Locate
encuadra la entidad en Scene. Inspector delimita componentes con recuadros y X;
Transform es fundamental. Click derecho permite copiar componentes, pegar valores
en el mismo tipo, agregar un componente copiado o removerlo. Los números/textos se
aplican al dar Enter/cambiar foco; checks/opciones al cambiar. Save* y el icono de
guardado indican cambios pendientes; Ctrl+S guarda.

## Low-End Instance Grid

Verás 256 cubos estáticos compartiendo un único asset. Desplázate hasta el último
en Hierarchy: solo se montan las filas visibles, manteniendo la escena completa.
La demo usa calidad Low, culling CPU, resolución 50%, sin bloom ni sombras.
No es una demo de caída/física.

Abre Game, activa Play y marca Debug: FPS aparece arriba a la derecha y desaparece
con Stop. Config → HDR Rendering → Render scale permite 50%, 75%, 100%; el 50%
reduce deliberadamente la resolución y puede verse menos nítido. Los modos de
calidad superiores y 100% siguen disponibles. Profiler/Diagnostics muestran las
mediciones. npm.cmd run benchmark:m16, después del build, mide CPU/Wasm localmente.

## Límites y comprobación específica de Windows

Los archivos del proyecto son rutas virtuales canónicas. Explorer muestra una
exportación, no una carpeta con importación automática. Pueden crearse varios
scripts, pero el runtime conserva un único contrato de fuente/clase compilada.
Las pruebas con GPU de software verifican funciones; no garantizan FPS en tu equipo.

Solo falta la comprobación específica de tu integración con Windows: en Project,
click derecho sobre un archivo → Show in Explorer y verifica que Explorer lo
seleccione; una carpeta debe abrirse. Si falla, comparte el último trace de Structured
Console. Exportación, contenido, rutas y argumentos de lanzamiento están cubiertos
por pruebas automáticas; no necesitas repetir las pruebas de edición, C# o física.

Evidencia completa: docs/reports/M16_CURRENT_REPORT.md.
