# ADR-0038 — Adaptador P1 y sesiones alojadas

## Contexto

ADR-0036 aprobó separar Platform sin trasladar masivamente archivos mixtos. P1 necesita abrir el producto existente y conservar invariantes y persistencia.

## Decisión

Implementar descriptor/protocolo 1 para Platform API 0.1 y adaptador IPC en platform/. Crear un puerto de autoría opcional en startServer, activo solo en sesiones alojadas. Plataforma usa un proceso por sesión, editor en pestaña independiente y autenticación propia. Conservar formatos y arranque directo.

Serializar ciclo de vida con el bus y comprobar revisión antes de guardar/cerrar. Rechazar cambios de proyecto desde el Hub interno alojado. Bloqueo por carpeta, reportes de buffers con secuencia e idempotencia de operaciones acotada a la sesión. No publicar SDK en npm ni instalar automáticamente productos en P1.

## Alternativas

Iframe, imports directos del motor desde Platform y extracción completa del Hub/AI. Se eligió IPC y adaptador por respetar protecciones existentes y mantener la separación de dominio.

## Consecuencias

Nueva ruta interna autenticada de reporte de buffers solo al alojarse. El daemon mantiene sus comportamientos nativos por defecto. El bloqueo no es conocido por versiones anteriores y necesita recuperación manual tras un cierre abrupto; no borrarlo sin comprobar procesos y copiar el proyecto. Catálogo persistente/selector nativo compartido son P2.

## Status

Implementado en rama para revisión, 2026-10-21. [Contrato y ejecución](../architecture/PLATFORM_P1.md). CI e integración de P0 se verifican por separado. No implica conformidad Unity/GPU.
