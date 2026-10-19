# M19 — Auditoría completa y contrato de compatibilidad

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M18.3.10.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Congelar Unity 6.3 LTS (6000.3), snapshot y hash; inventariar namespaces, tipos, miembros, sobrecargas, herencia, obsoletos, plataformas y módulos. Separar paquetes versionados y el delta 6.6.
- Mapear cada firma contra SDK y motor, corregir coincidencias ambiguas por nombre y registrar compatible, parcial, pendiente, bloqueada o fuera de alcance explícito.
- Definir compatibilidad de código y comportamiento, niveles P0/P1/P2, precisión numérica, namespaces, presupuestos y perfiles navegador/daemon/nativo. Diseñar harness de conformidad y corpus de scripts.

## Subtandas previstas

- 19.1 Inventario reproducible y propiedad de cada miembro por milestone.
- 19.2 Mapeo SDK/motor, prioridades y registro de dependencias.
- 19.3 Harness, casos de referencia, métricas y esfuerzo relativo.

## Criterios de cierre

- [ ] Todos los registros del snapshot tienen identificador estable, procedencia y asignación; no hay miembros omitidos por falta de implementación.
- [ ] El informe separa superficie declarada, comportamiento probado, restricciones de plataforma y paquetes; un tipo parcialmente presente no completa sus miembros.
- [ ] El harness reproduce casos positivos, negativos y de ciclo de vida; se publica la primera cobertura medida y la ponderación revisada del roadmap.

## Demo editable requerida

Compatibility Observatory: navegador del inventario y corpus ejecutable de objetos, tiempo, física y recursos; sin atribuir al harness la implementación de APIs pendientes.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
