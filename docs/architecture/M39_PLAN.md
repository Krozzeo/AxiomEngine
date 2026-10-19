# M39 — Módulos restantes, paquetes y conformidad integral

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Cerrar el registro residual de miembros de M19, incluyendo accesibilidad, utilidades, servicios y módulos que no pertenecen a las familias anteriores.
- Implementar adaptadores/versiones de paquetes seleccionados en M19: Input System, Addressables, Timeline, texto/UI, Transport/Netcode, Jobs/Collections/Burst/ECS y otros; medirlos por separado del core.
- Ejecutar corpus amplio de migración y auditoría final por firma/plataforma; reparar diferencias, sobrecargas y regresiones.

## Subtandas previstas

- 39.1 Cierre de módulos residuales con propietario explícito.
- 39.2 Paquetes versionados y sus backends.
- 39.3 Auditoría integral y publicación de cobertura.

## Criterios de cierre

- [ ] La meta es >=95% de firmas públicas objetivo verificadas del snapshot core fijado en M19 y 100% del nivel P0; son metas futuras, no cobertura actual.
- [ ] Denominador completo, obsoletos, exclusiones, parciales y bloqueos permanecen visibles; no se quitan APIs del total para alcanzar la meta.
- [ ] Paquetes y plataformas tienen métricas propias, corpus funcional y lista exacta de diferencias; si las dependencias impiden la meta, la milestone sigue abierta.

## Demo editable requerida

Compatibility Gallery: proyectos de referencia migrados y corpus reproducible por familia/paquete.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
