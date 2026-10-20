# M18.4 — Dos demos de publicación en GitHub

Estado: M18.4 cerrada según ADR-0034. La validación nativa de las demos con cuenta real queda aplazada, sin bloquear el cierre. TestRepo es exclusivamente un repositorio de pruebas sintéticas; no se usa como destino de estas demos.

`npm run demo:m18-4` crea **dos proyectos independientes** en el almacenamiento configurado del Hub; no reemplaza proyectos existentes. Se puede pasar una carpeta de pruebas a `node demos/create-m18-4-projects.mjs <carpeta>`. Cada ejecución crea UUIDs nuevos. El cubo, cámara, luz, JSON de ejemplo y PMD son editables mediante las funciones normales del editor. Ninguna demo conecta cuentas ni selecciona destinos automáticamente.

| Demo en Hub | Recorrido | Señal para reconocer sus fuentes |
|---|---|---|
| **Demo · M18.4 GitHub · Create Repository** | Conectar cuenta, crear un repositorio desde Axiom y publicar allí | `Create Repo Cube` a X=-1; `Scripts/DemoMode.json` con `mode: "create"`; milestone `GH-CREATE` |
| **Demo · M18.4 GitHub · Existing Repository** | Conectar cuenta y publicar en el repositorio creado manualmente | `Existing Repo Cube` a X=1; JSON con `mode: "existing"`; milestone `GH-EXISTING` |

La conexión actual utiliza un token introducido en el panel, no inicio de sesión mediante navegador. Publicar es un envío hacia GitHub: todavía no hay descarga de cambios remotos ni resolución automática de conflictos.

## Obtener el token y conectar Axiom, paso a paso

Para un repositorio ya existente, usar un token fine-grained limitado a ese destino:

1. Iniciar sesión en GitHub. Abrir la foto de perfil → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**. [Formulario directo](https://github.com/settings/personal-access-tokens/new).
2. Nombre: `Axiom Engine`. Elegir una expiración, por ejemplo 30 días. En **Resource owner**, elegir la cuenta propietaria del repositorio, por ejemplo `Krozzeo`.
3. En **Repository access**, marcar **Only select repositories** y seleccionar el repositorio del juego. `TestRepo` queda reservado a pruebas, no a las demos.
4. En **Repository permissions**, configurar **Contents: Read and write**. Conservar **Metadata: Read-only**. Para publicar archivos y crear una rama en ese repositorio no hace falta dar acceso a Actions, Issues ni administración general.
5. Pulsar **Generate token** y copiar el resultado en ese momento. Introducirlo únicamente en el campo de contraseña del panel GitHub de Axiom; no en el PMD ni en este chat. [Referencia oficial de tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).
6. Abrir el proyecto en Axiom → icono GitHub de la barra superior → pegar en **GitHub access token** → **Connect**. El campo debe vaciarse y el estado mostrar la cuenta conectada. La conexión de GitHub es independiente de la del agente de IA.
7. Pulsar **List my repositories**, seleccionar el destino, o escribir `propietario/repositorio`. Escribir una rama existente, por ejemplo `main`, o una nueva y marcar **Create this branch…**. Pulsar **Use this destination**.
8. Guardar el proyecto y detener Play. Pulsar **Review saved changes**, comprobar destino/archivos y luego **Publish reviewed changes**. **Last publication** abre el commit resultante.

Para **crear repositorios desde Axiom**, el token necesita además **Repository creation: Write**, o alternativamente **Administration: Read and write**, según los permisos disponibles en GitHub. El acceso del token también debe abarcar los nuevos repositorios: **All repositories** los incluye, pero amplía el alcance a todos los repositorios de esa cuenta. Un token limitado a repositorios existentes no debe suponerse válido para publicar en uno nuevo. Si preferís mantener acceso restringido, creá el repositorio manualmente y usá el recorrido B. [Permisos oficiales del endpoint de creación](https://docs.github.com/en/rest/repos/repos#create-a-repository-for-the-authenticated-user).

El token permanece en memoria hasta desconectar o cerrar el daemon; al reiniciarlo hay que volver a conectarse. Si expira o GitHub rechaza permisos, generar/actualizar uno y reconectar. La conexión nativa con token sigue pendiente de verificación manual: las pruebas conectadas de esta entrega usaron el conector, según el informe.

## Demo A — Crear el repositorio desde Axiom

1. Abrir **Create Repository** en Hub y pulsar el icono GitHub. Conectar desde el campo de contraseña del panel. El token debe permitir operar sobre el repositorio y, para este recorrido, crear repositorios en la cuenta. Si tu credencial no permite crearlos, utilizá la demo B; no es un fallo de publicación del proyecto.
2. Desplegar **Create a game repository**, escribir un nombre de juego de prueba que no exista y mantener **Private repository** marcado. Pulsar **Create repository**. Esta acción crea un repositorio real cuando estás conectado a GitHub real.
3. El campo de destino se completa con el repositorio creado, pero **todavía hay que seleccionarlo explícitamente** mediante **Use this destination**. Para probar también la creación de rama, escribir `axiom-demo-create`, marcar **Create this branch…** y pulsar ese botón.
4. Pulsar **Review saved changes**. Comprobar cuenta, repositorio, rama y presencia de `Scripts/DemoMode.json`. Publicar con resumen `Demo A: primer proyecto publicado`. El enlace al commit debe apuntar al repositorio que acabás de crear.
5. Verificar `mode: "create"`, el cubo y los archivos originales. Continuar con la comprobación común de reapertura indicada abajo.

## Demo B — Usar tu repositorio creado manualmente

1. Crear en GitHub **un repositorio de juego de prueba**, inicializado con un **README**. Puede ser privado. Anotar su dirección `propietario/repositorio` y la rama predeterminada. Un repositorio vacío sin primer commit todavía no sirve para este recorrido.
2. Abrir **Existing Repository** en Hub, pulsar GitHub y conectar la cuenta. Pulsar **List my repositories** y seleccionar el que creaste, o escribir su `propietario/repositorio` si no aparece en el listado inicial. **No pulsar Create repository** en esta demo.
3. Para la prueba más directa, escribir la rama predeterminada existente y dejar desmarcada **Create this branch…**. Pulsar **Use this destination**. También podés elegir una rama nueva de publicación marcando explícitamente su creación.
4. Revisar y publicar con resumen `Demo B: proyecto en repositorio existente`. El commit debe contener `mode: "existing"` dentro del prefijo `axiom/<UUID>/`. El README original de la raíz debe seguir intacto: Axiom añade su contenido en su propio directorio.
5. Modificar la posición del cubo desde Inspector, guardar, revisar y publicar otra vez. Debe aparecer un segundo commit con la modificación y actualizarse **Last publication**. Continuar con reapertura.

## Comprobaciones comunes y resultados esperados

1. Pulsar el icono GitHub de la barra. Conectar con un token introducido en el campo de contraseña del editor; nunca pegar credenciales en un chat, PMD o archivo del proyecto. Se mantiene en memoria hasta desconectar o cerrar el daemon. Se necesita acceso al repositorio elegido y permiso Contents de lectura/escritura. Para crear repositorios, la credencial debe admitir esa operación; también se puede crear el repositorio en GitHub y escribir `propietario/repositorio`.
2. Elegir **un repositorio de juego de prueba** o crearlo desde el panel. Elegir una rama existente o marcar explícitamente la creación de una rama desde la predeterminada. El repositorio debe estar inicializado. Pulsar **Use this destination**. Elegir la cuenta y destino es responsabilidad humana; no se elige automáticamente el repositorio de Axiom.
3. Guardar MAIN y detener Play. **Review saved changes** muestra archivos añadidos, modificados y borrados. Revisar el destino y pulsar **Publish reviewed changes**. El enlace **Last publication** debe abrir el commit resultante. El punto de cambios pendientes se apaga; desconectar vuelve gris y tachado el icono, sin confundirlo con los cambios pendientes.
4. Verificar en GitHub el directorio `axiom/<UUID>/`: JSON canónico, originales `.assets`, fuentes legibles, README y manifiesto. Descargar/clonar su contenido y elegir `axiom/` como carpeta de proyectos del Hub; abrir el proyecto UUID conservando su directorio hermano de assets. Los recursos derivados se reconstruyen. Las copias legibles de Scripts/Scenes son de consulta: el JSON es la fuente canónica para reabrir.
5. Opcionalmente activar **Automatically publish newly delivered milestones after saving**, guardar la preferencia y completar/guardar una milestone nueva del PMD. Solo transiciones nuevas a `delivered` cuentan; habilitar la opción no publica entregas históricas. **Allow publication when the AI agent requests it** es un permiso distinto, desactivado por defecto. El agente utiliza `github.preview` y `github.publish` desde MAIN guardado; primero hay que aplicar sus propuestas.
6. Una preview activa, cambios sin guardar, Play o trabajos pendientes deben impedir publicar. Cambiar un archivo en GitHub en la rama seleccionada debe detener la siguiente publicación por divergencia, preservando su historial. Se puede elegir explícitamente otra rama; no hay merge ni force-push automático.
7. Ante una respuesta no confirmada, **Check an unconfirmed publication** busca el identificador persistente en los últimos 50 commits. **Retry the same publication** recupera el commit existente o reintenta exactamente el mismo snapshot y condición de cabecera. Si el proyecto o la rama cambiaron, se detiene y explica el motivo.

Evidencia para la validación manual posterior, no exigida para cerrar M18.4: URL del commit de juego, cuenta/repositorio/rama seleccionados (sin token), confirmación de reapertura y resultado observado de desconexión/reintento. La prueba `npm run test:browser:m18-4` cubre el recorrido con un adaptador controlado; no sustituye esta verificación con GitHub real.

| Comprobación | Demo A: crear desde Axiom | Demo B: repositorio manual |
|---|---|---|
| Flujo automatizado | 5/5 grupos aprobados | 5/5 grupos aprobados |
| Cuenta/repositorio/rama reales | Pendiente de elegir en el panel | Pendiente de crear/elegir en el panel |
| Enlace al primer commit real | Pendiente | Pendiente |
| Reapertura del proyecto publicado | Pendiente con cuenta real | Pendiente con cuenta real |

Para la demo B, basta con que compartas la dirección del repositorio de prueba que vas a crear; la conexión se realiza dentro de Axiom. La demo A utilizará otro nombre de repositorio elegido explícitamente al pulsar Create. Ninguna prueba automatizada genera repositorios externos reales.

Límites: Node daemon local; GitHub.com; máximo 32 destinos locales por perfil, 2.048 archivos/16 MiB de fuente por publicación, listado inicial de 100 repositorios (también admite destino escrito), repositorios remotos con listado completo no truncado. Credenciales, conversaciones del PMD, previews, cachés y compilaciones se excluyen; las fuentes que escribe el usuario se publican tal como están y deben revisarse. No hay colaboración Git general, LFS, merge ni integración GitHub Enterprise en esta tanda.
