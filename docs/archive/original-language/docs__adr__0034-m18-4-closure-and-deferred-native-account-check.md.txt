# ADR-0034 — Cierre de M18.4 y validación nativa aplazada

## Decisión explícita del usuario

El usuario indica: «Cerrá la 18.4 sin el link, el link lo voy a crear manualmente cuando tenga la demo». Luego autoriza usar `Krozzeo/TestRepo` para ejecutar pruebas, **no para las demos**. Se cierra la implementación M18.4 con nueve grupos requeridos aprobados y se aplaza la validación manual del inicio de sesión/publicación desde la app con su cuenta hasta que utilice las demos.

El grupo externo original se clasifica **Deferred por decisión de alcance**, nunca Passed. La aceptación del alcance de cierre pasa de 9/10 a **9/9 = 100%**. No representa cobertura total de GitHub ni verificación de la autenticación nativa: el token y la mutación GraphQL de producción siguen sin ejercicio contra la cuenta real. La conexión nativa se describe en la guía para esa comprobación posterior.

## Evidencia adicional en el repositorio autorizado

Se ejecuta el servicio de producción `GitHubPublication` con un transporte Git delegado al conector autenticado, usando un fixture mínimo sin demos. Se confirma publicación durable, descarga/reapertura, recuperación de una respuesta perdida sin duplicación tras reconstruir el servicio y detención por divergencia remota. El transporte delegado crea árbol/commit y actualiza la referencia con condición de cabecera; **no sustituye la prueba del cliente HTTP/GraphQL nativo de Axiom**. Informe y recibos: `docs/reports/M18_4_CONNECTED_TEST_REPORT.md` y `m18-4-connected-test.json`.

## Consecuencias

M18.4 figura complete/100 en planificación y estado. M19–M40 conserva íntegro su alcance de Scripting API de Unity, shaders y físicas GPU; M19 no empieza por este cambio. Quedan 22 milestones principales pendientes, de 45, con 23 cerradas. Los pendientes anteriores del editor/render/física densa y modelo real permanecen abiertos por separado. No se fusionan PRs automáticamente. La CI se registra con su resultado real y no se presenta una ejecución fallida como aprobada.
