# M16.1 — Editor & Ambient Lab

Desde PowerShell, en la carpeta del motor:

```powershell
npm.cmd ci
npm.cmd run demo
npm.cmd run dev
```

Se crean dos proyectos nuevos sin borrar los anteriores. En **File → Projects · Create / Open**, selecciona **Demo · M16.1 3D Editor & Ambient Lab** o **2D Editor & Ambient Lab** y pulsa Open.

## 3D

Verás cámara, luz direccional, cubo, esfera y cápsula. Las caras opuestas a la luz siguen siendo visibles por el relleno ambiental. **Config → Ambient light** permite cambiar R/G/B y aplicar el cambio; prueba `[0,0,0]` y luego `[0.12,0.16,0.24]`. No hace falta Play para editar iluminación. Undo/Redo y Save conservan esta configuración.

En **Project**, abre Scripts/Gameplay y haz doble clic en el archivo C#. Se abre **IDE**, después de Scene y Game en el centro. Edita el código, prueba Find y Tab para sangría. **Save file** guarda el texto en el borrador; **Ctrl+S** guarda también el proyecto. La modificación del texto no compila ni adjunta automáticamente el script: el compilador y la propiedad Script siguen siendo los mecanismos de gameplay. Este laboratorio demuestra edición, no un controlador interactivo nuevo.

Scripts/Examples está disponible para mover y copiar archivos. Crear un script con el mismo nombre en otra carpeta produce un error y mantiene el nombre editable. Las copias reciben nombres únicos. Assets/EmptyFolder sirve para comprobar eliminación directa de carpetas vacías; los archivos y carpetas con contenido piden confirmación.

Usa el icono de volver o Backspace cuando Project tenga el foco para subir de carpeta. Arrastra archivos sobre carpetas y observa el resaltado del destino. Rename actualiza el Inspector. **Copy Path** entrega la ruta absoluta de una exportación del borrador en disco; editar esa exportación externamente no reimporta los cambios.

Seleccionar un archivo deselecciona las entidades y viceversa. Esc y hacer clic en un espacio vacío deseleccionan. Borrar una entidad deja el Inspector sin entidad seleccionada. Cierra IDE con X y recupéralo desde **Panels → IDE**. Se puede reubicar como los demás paneles.

## 2D

Verás cámara ortográfica, luz 2D y cuadrado. Ambient light modifica el relleno RGB de la escena 2D y no activa el renderer HDR 3D. El segundo script sirve para practicar el mismo flujo de IDE y archivos.

## Guardado

El nombre del proyecto se muestra gris y adquiere negrita y `*` cuando hay cambios pendientes, incluido texto pendiente en IDE. Ctrl+S vacía el buffer del IDE hacia una transacción canónica y guarda el proyecto. Play no sustituye a guardar ni compilar.
