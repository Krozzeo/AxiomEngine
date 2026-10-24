# M18.4 — Hub y dos demos GitHub · interfaz 0.0.52

M18.4 permanece cerrada según ADR-0034. Esta revisión M18.4.1 actualiza el flujo; la validación con un PAT real sigue aplazada por decisión del usuario. TestRepo se reserva para pruebas sintéticas y no es destino de las demos.

`npm run demo:m18-4` crea dos proyectos nuevos sin reemplazar existentes:

| Demo | Recorrido |
| --- | --- |
| Demo · M18.4 GitHub · Create Repository | Crear y vincular un repositorio desde Axiom; cubo Create Repo Cube, X=-1 |
| Demo · M18.4 GitHub · Existing Repository | Elegir un repositorio ya inicializado; cubo Existing Repo Cube, X=1 |

## Hub

- Create project despliega nombre y plantilla 3D/2D/Empty.
- Add Project → Open Project from a folder permite escribir la ruta o elegirla con el botón de carpeta. Seleccionar la carpeta que contiene el JSON UUID del proyecto. Add Project crea una copia en Project Storage y conserva el original; elegir después el icono Open de su tarjeta.
- Add Project → Import a project from GitHub: abrir GitHub account para conectar la sesión, escribir owner/repository y rama (vacía usa la predeterminada), Find projects, elegir el proyecto Axiom y luego Import project. Se admiten las publicaciones Axiom, no cualquier repositorio de código. Una copia con UUID ya existente no se reemplaza.
- Settings contiene Project Storage e importación de versiones anteriores. Cada ruta tiene un selector de carpeta en la misma línea. Cambiar el banco no mueve proyectos y requiere cerrar el actual.

En Windows el selector es un diálogo nativo. Si no está disponible, se puede escribir la ruta. El proceso de pruebas usa un adaptador; no se declara aquí una interacción humana con ese diálogo.

## Cuenta y token

1. En GitHub: Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token. Elegir propietario, vencimiento y repositorios accesibles.
2. Para publicar se necesita Contents read/write; Metadata es de lectura. Para crear repositorios se necesita Administration write o Repository creation write. Elegir un alcance que permita acceder también al nuevo repositorio; limitar el token a un repositorio existente puede impedir configurar el recién creado. [Permisos oficiales de creación](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user).
3. Introducir el token únicamente en el panel GitHub de Axiom, nunca en el chat. Pulsar Connect. El input desaparece y Account muestra confirmación, Refresh y Disconnect; la lista de repositorios se actualiza automáticamente.
4. La cuenta permanece conectada al cambiar proyectos, hasta Disconnect o cerrar el daemon. El token no se guarda en proyectos, fuentes, historial ni storage del navegador. Los ajustes son independientes por UUID de proyecto.

El panel abre desde el icono superior o Config → GitHub. El icono es tachado sin cuenta, rojo con cuenta pero sin destino de proyecto y verde con destino configurado para esa cuenta. Sin proyecto abierto se muestra verde al conectar. Verde no garantiza que el remoto no haya cambiado: Review lo comprueba.

## Demo A — crear

1. Abrir Create Repository, detener Play y guardar los cambios del proyecto con el control de guardado habitual del editor.
2. Conectar la cuenta. Destination → Create a new repository. El nombre sugerido es Axiom-Game-[nombre del proyecto]; modificarlo si se desea. Elegir privacidad.
3. Pulsar Create Repository. Mientras trabaja aparece el indicador de carga y se bloquea la creación repetida. Ante un error se muestra una X y su motivo. Si GitHub no confirma la respuesta, refrescar repositorios antes de volver a crear.
4. Al crear correctamente cambia a Use existing repository y vincula el nuevo repositorio y su rama predeterminada. No hay un paso Use/Save. Si el repositorio se creó pero su configuración falló, el panel distingue ambos hechos: recuperar ese destino sin crear otro.
5. La revisión automática muestra un resumen como “2 changed files · owner/repository / branch”. Review changes abre la lista en otra ventana. Cerrar con X y usar Publish changes para enviar el plan revisado.

## Demo B — existente

1. Crear/inicializar el repositorio de juego en GitHub, por ejemplo con un README. Abrir Existing Repository y conectar la cuenta si hace falta.
2. Destination → Use existing repository. Elegir el repositorio del desplegable; su rama predeterminada se configura automáticamente. El botón Refresh está junto al desplegable. También se puede escribir owner/repository y rama.
3. Para una rama nueva, marcar Create this branch if it does not exist y escribir el nombre. Los cambios se guardan al cambiar/salir del campo; no hay botones Use this branch o Save.
4. Revisar el resumen, abrir Review changes si se desea inspeccionar la lista y pulsar Publish changes. Last publication abre el commit; el README ajeno se conserva y el estado canónico se publica dentro de axiom/UUID/.

## Preferencias, revisión e historial

Ambas preferencias están ON por defecto en nuevas configuraciones, por solicitud del usuario. Las preferencias ya guardadas se conservan. Cambiarlas guarda automáticamente: la primera habilita publicación de nuevas entregas de milestones guardadas; la segunda permite solicitudes de publicación del agente. Deshabilitar una no altera la otra. Habilitar no publica milestones históricas.

Al abrir el panel, una cuenta/destino correctos revisan automáticamente MAIN si está guardado y no hay Play, preview o trabajo incompatible. El único botón primario dice Review saved changes si aún no hay plan y Publish changes después de revisarlo. Cero cambios deja Publish deshabilitado. La lista solo aparece en la ventana Review changes; History abre otra ventana con los eventos del proyecto y páginas anteriores. X cierra cada ventana.

Las credenciales de cuenta son globales a la sesión; destino, preferencias, nombre/privacidad/mensaje e historial son por proyecto. Crear/configurar no elige el repositorio del engine. Una divergencia remota detiene el envío sin force-push. Los controles Check unconfirmed publication / Retry the same publication aparecen si una publicación quedó sin confirmar y permiten recuperar su identificador sin duplicar commits.

## Pruebas y límites

`npm run test:browser:m18-4` cubre ambos modos con transporte controlado (12 grupos). `npm run test:browser:m18-4-1` cubre Hub, importaciones, cuenta por sesión, preferencias por proyecto y alineación de escenas (6 grupos). No crean repositorios reales ni validan un PAT real.

El flujo usa el daemon Node y GitHub.com. Máximo 32 destinos locales, 2.048 archivos y 16 MiB de fuentes por publicación/importación; árboles remotos completos. La lista inicial muestra hasta 100 repositorios; se puede escribir otro destino. Las fuentes canónicas y originales se reabren/reconstruyen; se excluyen credenciales, conversaciones, previews y compilaciones. No se añaden pull, merge, LFS ni colaboración Git general. Plan Unity API/shaders/físicas GPU sin cambios.
