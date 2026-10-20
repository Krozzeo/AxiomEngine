# Consolidación del repositorio — 2026-10-20

El usuario autorizó que la última entrega fuera `main` y punto de recuperación antes de reestructurar. `main` se adelantó desde `16c065c88f51780d489bf60082c73873a60db31d` hasta `e264ca835de14daf4fe964be6a78be5e4646ad14`, conservando la cadena de 304 commits. Los cambios de mantenimiento posteriores se revisan por PR sobre esa base.

## Recuperación

| Referencia fija | Commit | Propósito |
| --- | --- | --- |
| `recovery/pre-restructure-0.0.52` | `e264ca835de14daf4fe964be6a78be5e4646ad14` | Última entrega funcional exacta, previa a esta limpieza |
| `recovery/old-main-2026-10-20` | `16c065c88f51780d489bf60082c73873a60db31d` | `main` anterior, M0/0.0.6 |

Ambas etiquetas se publicaron y verificaron. También se conservaron ramas `archive/main-before-0.0.52-2026-10-20` y `archive/pre-restructure-0.0.52-2026-10-20` como respaldo adicional. Las etiquetas de recuperación no se mueven ni se reutilizan.

[Descarga del código fuente de recuperación](https://github.com/Krozzeo/AxiomEngine/archive/refs/tags/recovery/pre-restructure-0.0.52.zip). No contiene un instalador ni los proyectos personales del usuario.

Para inspeccionar o recuperar esa versión sin cambiar el trabajo posterior:

```powershell
git fetch origin --tags
git switch -c recovery/restore-0.0.52 recovery/pre-restructure-0.0.52
```

Guardar también una copia completa de los proyectos de juego y recursos fuera del checkout. La referencia de Git conserva el código del motor, no credenciales, archivos ignorados ni datos externos. Si se decide restaurar `main`, preparar una rama/PR con los cambios que corresponda; no reescribir el historial por defecto.

## Ramas y PR históricos

[Inventario previo](archive/pre-restructure-0.0.52/github-inventory.json): 46 ramas y 45 PR abiertos, de los cuales 23 eran borradores. Se verificó localmente que **todos sus SHA son ancestros de la entrega de recuperación**. Por eso sus cambios ya están en `main`; los PR históricos se cierran como consolidados y las 45 ramas de trabajo anteriores se retiran. Los títulos, bases, SHA y enlaces quedan en el inventario, además del historial de GitHub.

Se conservan `main`, ambas ramas de respaldo y la rama activa de mantenimiento mientras tenga un PR abierto. Futuras ramas parten de `main`, con un cambio acotado por PR. El retiro siempre exige verificar alcance y ancestry; una rama con cambios exclusivos se preserva.

## Documentación

README, handoff, estado y changelog tienen una única lectura vigente. Sus contenidos anteriores completos se conservan en [el archivo 0.0.52](archive/pre-restructure-0.0.52/README.md), con enlaces relativos convertidos a la revisión original para no perder referencias. Los informes y planes específicos permanecen en su sitio.

El roadmap mantiene M19–M40 y el plan Unity API + shaders + físicas GPU. Solo se corrigen referencias a la base actual y el total pendiente tras el cierre de M18.4. El antiguo 94% pertenece al MVP histórico.

## Calidad pendiente antes de reestructurar

CI 320: [ejecución](https://github.com/Krozzeo/AxiomEngine/actions/runs/39455470602), 42/45 trabajos aprobados. No se declara una base verde por crear una etiqueta.

| Prioridad | Incidencia | Hecho confirmado | Hipótesis / siguiente comprobación |
| --- | --- | --- | --- |
| Alta | [#47 M18](https://github.com/Krozzeo/AxiomEngine/issues/47) | Timeout esperando popup de Inspector tras scrub numérico | Investigar busy/persistencia; no causa confirmada |
| Alta | [#48 M18.2](https://github.com/Krozzeo/AxiomEngine/issues/48) | Traza no cambia al workspace esperado después de Stop | Reproducir sincronización de snapshot/renderer y generación |
| Alta | [#49 M7](https://github.com/Krozzeo/AxiomEngine/issues/49) | Hub se oculta durante el click de cierre al recargar | Helper espera inicialización para cualquier control; recorrido local M7 aprobado, confirmación CI pendiente |

No se quitan asserts ni se cambian los timeouts para declarar éxito. La consolidación no cierra estas incidencias sin evidencia. Verificación de mantenimiento: `npm run check` aprobado, 438/438 pruebas Node y checks de build/bindings/schema/arquitectura/paridad. M7 local aprobó sus siete grupos incluyendo Null y sin pageerrors; M18 sus ocho grupos y detach real; M18.2 sus catorce grupos; esto no demuestra resuelto el fallo intermitente de CI. CI 322 sobre main aprobó 44/45 trabajos, con el mismo fallo M18.2. Se amplía su diagnóstico de fallo con estado de renderer y frame-trace sin cambiar el assert. El CI del PR es la referencia para la regresión completa.

Otros pendientes conservados: rendimiento físico denso, validaciones con modelo conectado y validación nativa manual GitHub aplazada bajo ADR-0034. No forman parte de la limpieza documental ni se declaran cerrados.

## Publicaciones y configuración administrativa

El workflow Release publica notas y archivos fuente automáticos para futuras etiquetas `v*`, sin prometer binarios. La publicación de mantenimiento remite a la etiqueta exacta de recuperación y declara los límites de CI. No se eliminan releases anteriores.

Con sesión GitHub iniciada por el usuario se crearon las 22 milestones nativas M19–M40, planificadas y sin fechas inventadas, más ocho etiquetas de clasificación, conservando las diez existentes. Se activó el borrado automático de ramas integradas. `Preserve recovery baselines` protege las dos etiquetas `recovery/*` contra actualización, borrado y force-push, sin bypass. La release de recuperación exacta está publicada como pre-release con los límites de CI explícitos.

La regla activa `Main requires pull requests and complete CI` protege `main`: exige PR, rama actualizada y **All required checks** emitido por GitHub Actions; bloquea borrado y force-push, sin bypass. Cero aprobaciones externas requeridas para no bloquear al mantenedor único. El gate exige éxito en las cinco familias de jobs (incluidas todas sus matrices); rechaza fallos, cancelaciones y saltos. El workflow actual tiene 46 jobs contando este gate, frente a 45 de la entrega base. La integración de mantenimiento espera esa comprobación.

## Corrección de sincronización tardía

Los diagnósticos de CI 326 confirman renderer WebGPU detenido en MAIN/revisión 6 mientras el recorrido esperaba preview/revisión 9. Se reprodujo por separado que una respuesta atrasada de `/v1/editor/sync` podía sobrescribir un cambio humano de preview, una edición o cambio de proyecto. También podía aplicarse después de desconectar.

El bridge ahora solo adopta una respuesta si el snapshot que la pidió sigue siendo el actual, y descarta respuestas posteriores al cierre. El próximo poll reconcilia cambios externos con el estado actual. Tres pruebas deterministas: dos fallaban con el código anterior, las tres pasan con el corregido. `npm run check` completo: **441/441 Node**. La atribución final del fallo CI M18.2 exige aprobar su recorrido remoto; no se cierra solo por la reproducción unitaria.

Referencias administrativas verificadas: [regla main](https://github.com/Krozzeo/AxiomEngine/rules/25508502), [regla recovery](https://github.com/Krozzeo/AxiomEngine/rules/25508420), [milestones](https://github.com/Krozzeo/AxiomEngine/milestones), [etiquetas](https://github.com/Krozzeo/AxiomEngine/labels), [release fija](https://github.com/Krozzeo/AxiomEngine/releases/tag/recovery%2Fpre-restructure-0.0.52). Se usó la sesión de navegador iniciada por el usuario; no se extrajeron credenciales internas de Git.
