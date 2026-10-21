# Informe P2 — Servicios compartidos

2026-10-21. Base P1 integrada 400fec0, con aceptación manual del usuario y CI 332 aprobado. Rama P2 propia, pendiente de su revisión/CI.

## Entrega

Extracción de transporte GitHub, picker y Documentos; reexports desde fuente Platform 78d219b04d16b13074d76414483bc121cef32be9 por HTTPS con integridad. Broker IPC para cuenta compartida, sin token retenido en producto; publicación sigue validada por dominio. Configuración/historial por proyecto con adopción selectiva de legado y origen intacto. Importación/descubrimiento por carpeta y capacidades remotas de lectura para Hub de Platform.

## Verificación

- Pruebas existentes de GitHub, Hub y adaptador aprobadas con el paquete común instalado; sin retirar aserciones.
- Nueva regresión de legado: solo copia identidad/destino/defaults/historial coincidentes; descarta campo token, conserva origen y no sobrescribe una adopción existente.
- Platform tiene 13 tests con procesos reales del motor, incluidos dos editores/cuenta compartida, destinos/defaults aislados, cierre sin desconectar otro, desconexión común y pérdida de respuesta con recuperación sin commit duplicado.
- Browser P1 y P2 pasan sin pageErrors. P2 prueba catálogo/raíz persistentes, importación local/remota y cancelación con selector controlado. GitHub HTTP controlado; P1 renderer Null.
- npm run check: 444/444 aprobadas, sin fallos ni omitidas. Los checks remotos de P2 se comprueban por separado; no extrapolar CI de P1.

## Límites

Sin token real ni acceso a credenciales del usuario para estas pruebas. Sin publicación real en TestRepo. Diálogo nativo de P2 requiere operación manual del usuario; reusa implementación real con pruebas de invocación/cancelación. AI se extraerá en P3. Reestructurar no resuelve #47/#51 o rendimiento denso, y no implementa Unity/shaders/GPU nuevos.

No se modifican documentos/formato o referencias de recuperación. P2 se entrega por PR desde main P1 integrado, y no requiere fusionarse junto a Platform: consume el commit público fijo. Mantener visibles posibles resultados remotos inciertos y los recibos del proyecto al desconectar.
