# Contexto vigente — Axiom Game Engine / P2

2026-10-21. Producto Axiom Game Engine, repositorio AxiomGameEngine, carpeta local AxiomEngine. MIT vigente en main tras integrar P0/P1; recovery mantiene historia/licencias previas. Base P1 main 400fec0, CI 332 completo aprobado y pruebas manuales del usuario aceptadas. P2 vive en feat/p2-platform-services para revisión.

## Arquitectura y versión

Editor navegador, Rust/Wasm, WebGPU/Null, C# SDK 8 y daemon Node productivo; daemon Rust parcial. Adaptador de Platform y puerto opcional de autoría mantienen dominio aquí. Platform API 0.1.1 / IPC 1 es independiente del SDK de scripting. [P2](../architecture/PLATFORM_P2.md), [ADR-0039](../adr/0039-platform-p2-services.md) e [informe](../reports/PLATFORM_P2_REPORT.md).

Se extraen transporte GitHub, selector y resolución de Documentos a dependencia pública HTTPS de Platform 78d219b04d16b13074d76414483bc121cef32be9 con integridad. npm ci reproduce la instalación sin checkout vecino/SSH. Reexports conservan imports del motor. No copiar fuentes compartidas ni depender de main mutable.

Modo alojado: cuenta compartida por broker del host; producto no retiene token. Cuenta/época invalidan planes anteriores; cerrar un producto no desconecta a otros. Configuración/ramas/defaults/journal/historial por proyecto fuera de sus documentos. Adopción nativa anterior solo para el ID abierto, sin otras identidades/secretos, con origen intacto. Publicación, bundles, validación de MAIN y reconciliación pertenecen al motor. Modo nativo conserva cuenta propia con transporte común.

## Roadmap preservado

45 milestones principales, 23 cerradas y M19–M40 pendientes. M19 audita la API objetivo Unity 6.3 LTS; meta futura de al menos 95% core y 100% prioridad P0, sin porcentaje actual auditado antes de M19. M25/M26/M28/M30/M39 y hardening M40 mantienen compute/shaders/físicas GPU; físicas actuales CPU/Wasm. El 94% previo solo describe MVP histórico, nunca el alcance ampliado.

Platform tiene P0–P5 separados. P2 no implementa APIs Unity/GPU ni bloquea M19 hasta terminar P5. P3 extraerá orquestación AI manteniendo herramientas/invariantes en producto. Propuestas aisladas y revisión humana se conservan.

## Verificación y pendientes

Tests locales y browser de Platform aprobados; GitHub HTTP y selector controlados, no cuenta/PAT real. Comprobar CI P2 separado antes de integrar. #47 Inspector intermitente y #51 M17 siguen sin causa resuelta aunque P1 aprobara CI. Rendimiento denso (~5,1 FPS Null/1024 cuerpos en medición histórica), calidad/coste de modelo conectado y validación GitHub nativa manual aplazada siguen pendientes. Null no certifica GPU; capacidad 65.536 entidades no garantiza fluidez.

No pedir tokens por chat ni leer credenciales internas. TestRepo es solo para pruebas explícitas, sin vinculación automática a demos. No se publicaron datos reales por P2. No mover recovery tags. [Roadmap](../architecture/ROADMAP_M19_M40.md) · [Mapa](../index.md) · [Antecedentes](../archive/PRE_P2_HANDOFF.md).
