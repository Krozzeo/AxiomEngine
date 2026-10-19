# M22 — Ciclo de vida, tiempo, eventos y asincronía

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M20, M21.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar mensajes y orden de ejecución de MonoBehaviour, activación, destrucción, pausa/foco y sincronización física; mensajes Unity privados conforme al contrato.
- Ampliar Time, paso fijo configurable, corutinas, waits/timeouts, Invoke, Awaitable/cancelación y puente async requerido por las firmas objetivo.
- UnityEvent/delegados y orden/reentrada; propagación de excepciones, cancelación y limpieza tras descarga de escena o Stop.

## Subtandas previstas

- 22.1 Mensajes y scheduling.
- 22.2 Corutinas, tiempos y cancelación.
- 22.3 Eventos, asincronía y limpieza.

## Criterios de cierre

- [ ] Trazas de orden coinciden con casos de referencia a distintas tasas de render/física y timeScale.
- [ ] Desactivar/destruir/descargar/Stop termina únicamente el trabajo que corresponda sin callbacks tardíos.
- [ ] Errores y cancelaciones tienen estados observables y no se confunden con éxito.

## Demo editable requerida

Lifecycle Timeline Lab con ejecución por fotograma, eventos y tareas canceladas.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
