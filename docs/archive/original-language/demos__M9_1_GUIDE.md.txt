# M9.1 — guía de las demos

M9.1 está completa. Las tres demos nuevas usan las mismas operaciones, recursos,
renderer y físicas del editor. Todas sus interacciones principales pasaron las
pruebas automáticas. No hay pruebas manuales obligatorias pendientes.

## Abrir las demos

Extraé el paquete y abrí PowerShell dentro de `AxiomEngine-m9.1`:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

Abrí el enlace que imprime el daemon. En **Archivo**, actualizá la lista de
proyectos guardados, seleccioná una demo con **M9.1** en el nombre y pulsá Open.
Cada ejecución de `demo` crea nueve proyectos nuevos; conserva los anteriores.
Para llevar tus proyectos desde otra versión, copiá toda su carpeta
`.axiom/projects` a la nueva carpeta antes de crear las demos.

Se requieren Node 24+, Rust con el target `wasm32-unknown-unknown`; .NET 10 y
`wasm-tools` compilan el controlador de la demo anterior M7.1. Las tres demos
nuevas de M9.1 no necesitan scripts C# para sus funciones.

## Demo · M9.1 Editor Workshop

Se usa principalmente con **Play detenido**. Incluye las nueve primitivas,
una jerarquía con dos hijos, una entity vacía, un piso y dos luces.

| Acción | Cómo interactuar | Qué observar |
| --- | --- | --- |
| Seleccionar | Click en una geometría o su fila en Hierarchy | La selección y el resaltado coinciden |
| Selección múltiple | Alt + click en varias filas/objetos | Varias entities seleccionadas; sus propiedades se deshabilitan |
| Expandir jerarquía | Flecha de Assembly | Sus hijos se ocultan o reaparecen |
| Agrupar | Arrastrá las filas seleccionadas a otra entity, o elegí Parent y Set parent | Conservan su posición mundial; mover el padre mueve los hijos |
| Desagrupar | Unparent | Conserva la posición mundial |
| Componentes | Seleccioná Empty; elegí un componente y Add component | Solo aparecen las propiedades agregadas; Remove las quita |
| Scripts | Add component → Script | Permite compilar/adjuntar el GameScript existente y quitar la asociación |
| Mover/rotar/escalar | W / E / R y arrastre de los ejes/anillos | Rotate sigue el sentido del arrastre; soltar crea una operación de Undo |
| Deshacer/cancelar | Ctrl+Z; Escape durante un arrastre | Undo revierte la operación; Escape descarta la vista previa |
| Cámara Scene | F sobre una selección; botón derecho y arrastre, o Alt + arrastre | Orbita alrededor del punto de atención |
| Otros controles | Rueda; botón central; derecho + WASD/QE | Zoom, desplazamiento y vuelo |
| Ejes globales | Click en el widget XYZ inferior izquierdo | Alinea la cámara al eje elegido |
| Luz puntual | Seleccioná Point light y movela | La iluminación cambia durante el arrastre |
| Luz direccional | Seleccioná Sun y rotala | Cambia la dirección de iluminación |
| Crear primitivas | Archivo → Create 3D/2D → Primitives | Se agrega una geometría editable normal |
| Explorar proyecto | Pestaña Project, primera del panel inferior | Muestra escena, recursos importados y script cuando existe |

Game muestra la cámara guardada incluso sin Play. Navegar en Scene no modifica
la cámara de Game. Ajustes contiene las opciones globales del renderer.
Usá escala uniforme en los padres: combinaciones que requieren shear se rechazan.
La edición conjunta de propiedades permanece deshabilitada en selección múltiple.

## Demo · M9.1 Angular Contacts 2D / 3D

Pulsá **Play** y compará los dos cuerpos amarillos:

- **Offset box · corner torque** cae descentrado sobre el borde: gira, se inclina
  y cae al piso inferior por el momento del impacto.
- **Centered box · symmetric contact** cae centrado y queda apoyado.

Abrí **Diagnostics** en el panel inferior. En Frame Diagnostics → physics, cada
cuerpo incluye `rotation` y `angularVelocity`; los contactos incluyen `point` y
`normal`. La velocidad angular puede volver a casi cero cuando el cuerpo se apoya:
la rotación acumulada sigue visible.

**Stop** restaura la escena original. Con Play detenido podés cambiar posición,
masa, fricción, restitución o Freeze rotation en Collider / RigidBody y repetir.
Estas demos no tienen un personaje controlable; la interacción consiste en editar
los cuerpos y comparar sus resultados al ejecutar la simulación.

Las primitivas cápsula/cilindro/pirámide son geometrías; los colliders disponibles
siguen siendo cajas orientadas y círculos/esferas. La simulación es discreta,
sin CCD ni joints. El explorador se limita a los archivos del proyecto y C# usa
un único tipo GameScript compilado con asociaciones a múltiples entities.
