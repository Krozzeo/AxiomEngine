# P1 — Adaptador de Axiom Game Engine

Fecha: 2026-10-21. Rama feat/p1-platform-adapter, basada en P0 fcc7435 (PR #52 pendiente al comenzar). No se integra a main automáticamente. Base funcional 0.0.52 / SDK 8; compatibilidad de este adaptador con Platform API 0.1, protocolo/manifiesto 1.

## Contrato y propiedad

El descriptor platform/product.json registra axiom.game-engine y el entrypoint platform/adapter.mjs. Platform arranca ese proceso con IPC nativo, verifica identidad/versiones/capacidades y concede una raíz de proyectos. El motor mantiene formato schemaVersion 1, editor y toda la semántica. El adaptador implementa el contrato; no importa ni copia el SDK de Platform. Platform no importa clases del motor.

El puerto platform/authoring.mjs conecta el ciclo de vida con la cola transaccional del daemon existente. Guardar/cerrar validan revisión e impiden interferir con Play, jobs, AI activa y preview. El editor conserva operaciones de dominio y guardado; los controles que cambian proyecto del Hub interno no administran sesiones alojadas. La apertura alojada no modifica el arranque nativo por defecto.

## Datos y concurrencia

Detectar formato es lectura sin migración. Crear usa una carpeta nueva vacía y guarda el formato existente. La carpeta tiene un lease exclusivo .axiom-platform-session.lock, liberado al cerrar normalmente; aperturas nativas de esta versión lo respetan. Es por carpeta y no se elimina automáticamente si quedó tras un cierre forzado. Los motores anteriores no lo conocen: no abrirlos simultáneamente sobre el mismo proyecto.

Mensajes identifican sesión, producto, proyecto cuando aplica, actor humano y correlación. Operaciones mutantes usan operationId con recibos de éxito/error acotados y revisión esperada. No hay reintento automático tras resultado desconocido ni garantía de deduplicación después de reiniciar Platform.

Los buffers de código se reportan desde el editor con secuencia creciente. Save/Save-close desde Platform requiere guardarlos primero en el editor; Cancel conserva todo y Discard-close es explícito. Los avisos dirty no caducan silenciosamente si desaparece una pestaña. La sesión no promete recuperar borradores tras matar el proceso.

## Ejecución

Construir el motor con npm ci y npm run build; usar el host del checkout P1 de AxiomPlatform:

```powershell
npm start -- --product "C:\ruta\AxiomGameEngine\platform\product.json" --projects-root "C:\ruta\Mis proyectos Axiom"
```

El comando se ejecuta desde Platform. Abrir su URL local, crear/abrir un proyecto y elegir Abrir editor. La pestaña del motor tiene su propia autenticación de sesión. [Guía completa](https://github.com/Krozzeo/AxiomPlatform/blob/feat/p1-local-host/docs/P1_GUIDE.md).

## Verificación y alcance

Tests del motor comprueban formato futuro sin escritura y protección de buffers/reportes atrasados; integración en Platform comprueba procesos reales, revisión, cancelar/guardar/cerrar/reabrir y arranque nativo posterior. El navegador ejecuta Hub y editor reales con Null, sin acreditar GPU. [Informe](../reports/PLATFORM_P1_REPORT.md).

P2 extraerá catálogo y servicios comunes; P3 AI. M19–M40, Unity scripting, shaders y físicas GPU se conservan sin crédito funcional por P1. #47/#51 y aceptaciones nativas/modelo/rendimiento previas siguen pendientes.
