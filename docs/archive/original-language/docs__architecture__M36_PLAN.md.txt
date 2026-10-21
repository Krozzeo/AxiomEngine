# M36 — Networking, HTTP y multijugador

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M22, M23, M24.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar UnityWebRequest, handlers, uploads/formularios, streaming, progreso, errores y cancelación según plataforma.
- WebSockets y transportes reales entre procesos; protocolo, ownership/autoridad, RPC/replicación y reconexión del perfil multijugador elegido.
- Versionar cualquier compatibilidad de paquetes Netcode/Transport separadamente; CORS, cookies y sockets requieren contratos explícitos de backend.

## Subtandas previstas

- 36.1 HTTP/handlers y errores.
- 36.2 Transportes y sesiones.
- 36.3 Replicación, autoridad y fallos de red.

## Criterios de cierre

- [ ] Pruebas con servidor separado verifican datos, cancelación y errores; no se cuenta HTTP como multijugador.
- [ ] Dos clientes y servidor intercambian estado/juego real con latencia/pérdida/reconexión controladas.
- [ ] Credenciales y autoridad se conservan; capacidades imposibles en navegador se atienden mediante backend real o quedan bloqueadas.

## Demo editable requerida

Network Arena Lab con dos clientes, servidor y condiciones de red reproducibles.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
