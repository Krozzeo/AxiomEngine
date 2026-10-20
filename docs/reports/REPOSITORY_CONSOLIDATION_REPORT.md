# Verificación de mantenimiento del repositorio

Fecha: 2026-10-20. Base e264ca835de14daf4fe964be6a78be5e4646ad14. Cambios en PR #50.

`npm run check` aprobado: 438/438 Node y build/bindings/schema/arquitectura/paridad. Recorridos completos locales:

- m7: 7 grupos, aprobado=True, errores=[].
- m18: 8 grupos, aprobado=True, errores=[].
- m18-2: 14 grupos, aprobado=True, errores=[].

Los recorridos locales no certifican GPU física ni cierran por sí solos fallos intermitentes de CI. M18 incluyó detach real del Inspector; M7 incluyó recarga y física en Null; M18.2 incluyó la traza de preview tras Play/Stop. Los servicios externos controlados conservan sus límites de aceptación.

Se verificaron con merge-base los 46 heads de ramas y 45 heads de PR del inventario previo: todos son ancestros de la etiqueta fija de recuperación 0.0.52. No se reescribió el historial. El CI completo del PR determina el estado de regresión remota; consultar #47/#48/#49.

## Regresión determinista de sincronización

Pruebas nuevas: respuesta atrasada tras cambio humano de preview/edición/proyecto; actualización externa válida; respuesta posterior a desconexión. Código anterior: dos fallos y una aprobación; corregido: 3/3. npm run check posterior al cambio: 441/441 Node, checks completos aprobados. Los recorridos locales anteriores no se atribuyen a este cambio posterior. La confirmación del recorrido remoto figura en el CI del PR.

La regresión unitaria del bridge es independiente: CI 328 aún reprodujo el fallo de navegador. Se corrige además el recorrido antiguo para esperar el estado explícito de preview en lugar de la barra visible también en MAIN. Se fortalecen las comprobaciones con edición X=6→5 y Play realmente activo en el workspace. La matriz conserva sus 36 milestones, con los tres recorridos afectados al inicio.

Recorrido local posterior al ajuste explícito: M18.2, 14/14 grupos, sin pageerrors. Conserva el assert de traza de workspace y confirma Play dentro de la propuesta.
