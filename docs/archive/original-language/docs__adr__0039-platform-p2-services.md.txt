# ADR-0039 — Transporte y cuenta compartidos de Platform

## Contexto

P1 fue aceptada manualmente y por CI. P2 exige evitar clientes/credenciales duplicados y conservar semántica y preferencias del producto.

## Decisión

Consumir servicios de Platform como dependencia de fuente HTTPS fijada por commit e integridad. Reexports para APIs existentes del motor. En modo alojado, cliente IPC para una cuenta retenida por Platform; identidad/época se propagan sin retener token en cada daemon. En modo nativo, el mismo transporte funciona con cuenta de sesión propia.

La publicación y su autorización siguen en Game Engine. Destinos/ramas/preferencias/journal/historial se guardan por proyecto en perfil del host; se adopta configuración anterior solo para la identidad que se abre, con origen intacto. Cerrar un proyecto no desconecta la cuenta compartida; desconectar/expirar revoca operaciones nuevas e invalida revisiones anteriores. Los efectos en vuelo requieren reconciliación.

El adaptador añade importación local/remota y listado remoto, con reconocimiento/validación de formato del motor y selección de archivos propios. Infraestructura de copia y catálogo pertenece a Platform. No importar módulos del motor desde Platform.

## Alternativas y consecuencias

Se descartan copias permanentes y tokens replicados a todos los procesos. La dependencia publicada antes del consumidor permite despliegue compatible sin merges simultáneos. El perfil nativo y los datos históricos no se eliminan. No se introduce un SDK de scripting nuevo ni cambia M19–M40.

## Status

Implementado para revisión, 2026-10-21. [Detalle](../architecture/PLATFORM_P2.md) y [evidencia](../reports/PLATFORM_P2_REPORT.md). Tests controlados no sustituyen aceptación nativa/servicio real.
