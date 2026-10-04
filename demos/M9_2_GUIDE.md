# M9.2 — demos y controles del editor

Extraé el paquete y ejecutá en su carpeta:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

En Archivo → Proyectos · Create / Open, actualizá Saved projects, seleccioná una
demo **M9.2** y pulsá Open. Las nueve demos creadas usan los caminos normales del
motor. Cada ejecución crea proyectos nuevos; conserva los anteriores. Para llevar
los tuyos desde otra versión, copiá toda la carpeta `.axiom/projects`.

## Demo · M9.2 Editor Workshop

Se usa con Play detenido. Incluye las nueve primitivas, un padre con dos hijos,
una entity vacía, piso y luces. Esferas y cápsulas nuevas tienen sombreado exterior;
las primitivas originales M9.1 también se corrigen al reconstruir su recurso
derivado, sin cambiar su archivo ni ID.

| Función | Interacción | Resultado |
| --- | --- | --- |
| Selección simple | Click en Hierarchy o una geometría | Selección y resaltado sincronizados |
| Selección múltiple | Ctrl + click (o Cmd); Shift + click en Scene | Agrega/quita una entity |
| Rango en Hierarchy | Click inicial y Shift + click final | Selecciona el rango visible, respetando las ramas contraídas |
| Jerarquía | Flechas de Scene root y Assembly | Expande/contrae ramas |
| Agrupar | Arrastrá filas seleccionadas sobre otra entity | Se convierten en hijos; conservan su posición mundial |
| Desagrupar | Arrastrá las filas sobre Scene root | Vuelven a ser entidades raíz |
| Ordenar | Arrastrá a la línea entre dos filas | Inserta como hermano en esa posición, con Undo |
| Transform en grupo | W/E/R y arrastre de flecha/anillo/caja | Move/Rotate/Scale actúan sobre la selección; una sola operación de Undo |
| Inspector múltiple | Escribí un eje de Position/Rotation/Scale y Apply | Aplica ese valor a todos; los ejes en blanco Mixed conservan sus diferencias |
| Componentes | Seleccioná Empty; buscá abajo con una letra y Add component | Sugiere componentes por prefijo y permite agregarlos |
| Física modular | Add Collider, después Add RigidBody | Secciones y formularios independientes |
| Atajos | Ctrl+Z; Ctrl+Y o Ctrl+Shift+Z; Supr | Undo, Redo y eliminación de la selección |
| Cancelar | Escape durante un arrastre | Descarta la vista previa |
| Paneles | Arrastrá los bordes entre las barras laterales/centro o sobre el panel inferior | Ancho/altura se guardan automáticamente por proyecto |
| Archivos | Project → Assets en el árbol; click en un icono | Vista compacta de carpetas, iconos y archivo seleccionado |
| Menús | Archivo → Create 3D/2D → Primitives | Cada nivel abre un panel lateral |
| Iluminación | Mové Point light o rotá Sun | Vista previa en tiempo real; dirección derivada de la rotación |

La selección activa sirve como pivote común para los gizmos de grupo. El nombre y
los componentes se editan solo con una entity seleccionada; Transform admite
selección múltiple. Usá escala uniforme en los padres: el motor rechaza shear que
no puede representar como TRS.

Alt + arrastre queda reservado para la cámara; ya no selecciona varias entities.
F encuadra, botón derecho y arrastre orbita, central desplaza, rueda acerca/aleja,
y derecho + WASD/QE vuela. Click en XYZ alinea con los ejes globales. Game muestra
la cámara guardada sin iniciar Play; navegar Scene no modifica esa cámara.

Los atajos no interfieren con campos de texto. Supr no elimina el proyecto ni sus
archivos fuente. El tamaño de los paneles se guarda sin guardar ni descartar cambios
pendientes de la escena y sin ocupar el historial de Undo de la escena.

## Demo · M9.2 Angular Contacts 2D / 3D

Pulsá Play. El cuerpo amarillo descentrado golpea el borde del pedestal, gira y
cae al piso; el centrado permanece apoyado. Stop restaura la escena original.
En Diagnostics → Frame diagnostics → physics, observá `rotation`,
`angularVelocity` y `contacts[].point`. La velocidad angular vuelve a casi cero
cuando el cuerpo queda apoyado; su rotación acumulada permanece.

Con Play detenido, cambiá masa, fricción, restitución o Freeze rotation en la
sección RigidBody y compará. Collider conserva forma, dimensiones, capa y máscara.
Estas demos se interactúan editando cuerpos; no tienen personaje controlable.

La física permanece discreta, con cajas orientadas y círculos/esferas; no incluye
CCD ni joints. Cápsula/cilindro/pirámide son geometrías, no nuevos colliders.
El explorador abarca archivos del proyecto, y C# usa un único GameScript compilado.
