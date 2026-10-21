# M37 — Plataformas, APIs nativas y dispositivos especializados

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M19, M22, M24, M29, M30, M32.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Application, SystemInfo, Screen, Cursor, paths/archivos, ventanas, display y ciclo de aplicación por backend.
- Backends nativos y adaptadores para capacidades no disponibles en navegador; sensores/cámara/micrófono/XR y plataformas móviles o especializadas del inventario.
- Matriz de SDK/hardware/permisos y evidencia por plataforma; APIs de consola o servicios externos mantienen dependencias visibles.

## Subtandas previstas

- 37.1 Contratos plataforma y backend nativo.
- 37.2 Dispositivos, móvil y XR.
- 37.3 Matriz de capacidades y verificación.

## Criterios de cierre

- [ ] Valores y operaciones provienen del sistema real; hints o valores por defecto no completan capacidades.
- [ ] Cada plataforma objetivo tiene evidencia de hardware/backend; un emulador no certifica un dispositivo físico.
- [ ] La ausencia de SDK, servicio o hardware figura como bloqueo y no como implementación completa ni exclusión silenciosa.

## Demo editable requerida

Platform Capability Lab con operaciones reales de archivos, ventanas y dispositivos disponibles.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
