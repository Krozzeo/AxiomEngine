# Informe P1 — Primer consumidor de Platform

2026-10-21. Rama feat/p1-platform-adapter, baseline P0 fcc7435. Entrega candidata en rama; main y CI remoto independientes.

## Cambio

Descriptor y adaptador IPC de Game Engine, puerto opcional de autoría en startServer, bloqueo de carpeta al alojarse y reporte secuenciado de buffers desde el editor. Las herramientas específicas, el daemon productivo, formatos y SDK de scripting se conservan. Platform aloja su propio host/Hub/SDK; no se copia el motor a su repositorio.

## Evidencia local

- npm run check completo aprobado: 443/443 Node, build, catálogos, bindings, esquemas, arquitectura y paridad del daemon.
- Dos tests nuevos del adaptador: incompatibilidad sin escritura, rechazo de versión, buffers pendientes, reporte atrasado, Cancel y arranque nativo posterior.
- Platform pasó seis tests de contrato/integración, incluidos procesos reales, permisos, crear/editar/cancelar/guardar/reabrir, revisión antigua sin escritura, idempotencia y bloqueo de apertura nativa concurrente.
- Navegador real del Hub y del editor: proyecto creado, pestaña independiente, entidad manual, estado dirty, Cancel, Save y cierre/reapertura, sin pageErrors. Renderer Null: no acredita render/GPU.

## Límites

P0 aún está separado en PR #52 al comenzar. El PR de P1 apunta a main e incluye el commit P0 mientras #52 siga pendiente; integrar P0 primero permite que el diff muestre solo P1. No se exige fusionar ambos simultáneamente. No cerrar #47/#51 por estos resultados ni declarar el CI remoto aprobado sin verificarlo. La aceptación de modelo real/GitHub nativo y rendimiento denso sigue pendiente.

Sin instalación distribuida, catálogo persistente, cuentas compartidas o extracción AI. Lease por carpeta y recibos en memoria; cierre forzado puede dejar bloqueo y perder borradores no guardados. La recuperación anterior y sus licencias permanecen intactas. M19–M40 no cambian.
