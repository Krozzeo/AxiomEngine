# M29 — Input y dispositivos

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M20, M22.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar Input/KeyCode/Touch y estado de mouse, teclado y gamepad; perfiles, zonas muertas y hotplug.
- Sensores, pen, haptics, orientación y APIs de dispositivos con backends y hardware identificados.
- Remapeo interactivo, persistencia y foco entre Game principal/desacoplado; Input System se versiona como paquete en M39.

## Subtandas previstas

- 29.1 Estados y perfiles.
- 29.2 Dispositivos, sensores y haptics.
- 29.3 Remapeo y foco.

## Criterios de cierre

- [ ] Eventos edge/held, hotplug y pérdida de foco tienen pruebas deterministas.
- [ ] Las capacidades físicas solo cuentan como verificadas con un backend real y evidencia del dispositivo; emulación se etiqueta.
- [ ] Los controles funcionan en ventanas principales y desacopladas sin acciones duplicadas.

## Demo editable requerida

Device & Rebinding Lab con perfiles, hotplug y remapeo persistente.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
