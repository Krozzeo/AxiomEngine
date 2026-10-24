# Historical issue40 before the M19 audit update

Read-only historical content; superseded by the current roadmap issue.

Seguimiento del roadmap ampliado solicitado el 2026-10-19. **22 milestones pendientes**: M19–M39 y M40. M18.4 queda cerrada en su alcance acordado (9/9), con verificación nativa manual aplazada explícitamente por el usuario (ADR-0034). El antiguo M19 Hardening se conserva íntegro en M40; M19 pasa a ser auditoría. Todas las etapas nuevas están planificadas y no iniciadas.

Base actual: 0.0.52 / SDK 8 integrada en main el 2026-10-20. Recuperación exacta: recovery/pre-restructure-0.0.52, commit e264ca835de14daf4fe964be6a78be5e4646ad14. El último CI completo verde anterior fue CI 315; CI 320 tuvo 42/45 trabajos aprobados y sus fallos se siguen en #47/#48/#49. El backend de físicas actual sigue siendo CPU/Wasm; la ampliación GPU está planificada, no implementada. Base de compatibilidad: Unity 6.3 LTS. Meta futura M39: >=95% del inventario core objetivo completo y 100% P0; pendientes, parciales, paquetes y plataformas se informan por separado. El 94% corresponde al MVP histórico; el avance global ampliado queda pendiente de auditoría M19.

Cada casilla se marca solo al aprobar implementación, pruebas, demo y documentación; crear el plan no la completa. Subtandas verticales y regresiones antes de cada cierre. Las dependencias de SDK/hardware/backend permanecen visibles.

- [x] **M18.4 — Integración con GitHub de proyectos de juegos** · [Cierre y plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M18_4_PLAN.md)
- [ ] **M19 — Auditoría completa y contrato de compatibilidad** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M19_PLAN.md)
- [ ] **M20 — Objetos, componentes y jerarquías compatibles** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M20_PLAN.md)
- [ ] **M21 — Matemáticas, geometría y utilidades** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M21_PLAN.md)
- [ ] **M22 — Ciclo de vida, tiempo, eventos y asincronía** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M22_PLAN.md)
- [ ] **M23 — Serialización, ScriptableObject y prefabs** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M23_PLAN.md)
- [ ] **M24 — Escenas, recursos, carga asíncrona y memoria** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M24_PLAN.md)
- [ ] **M25 — Física 3D: geometrías, consultas e infraestructura compute** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M25_PLAN.md)
- [ ] **M26 — Física 3D CPU/GPU: solver avanzado y controladores** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M26_PLAN.md)
- [ ] **M27 — Física 2D: geometrías y consultas** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M27_PLAN.md)
- [ ] **M28 — Física 2D CPU/GPU: joints y simulación avanzada** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M28_PLAN.md)
- [ ] **M29 — Input y dispositivos** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M29_PLAN.md)
- [ ] **M30 — Gráficos, shaders y recursos GPU** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M30_PLAN.md)
- [ ] **M31 — Animación, rigging y Playables** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M31_PLAN.md)
- [ ] **M32 — Audio, mezcla y procesamiento** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M32_PLAN.md)
- [ ] **M33 — UI, texto, layout y eventos** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M33_PLAN.md)
- [ ] **M34 — Mundos 2D/3D, partículas, terreno y vídeo** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M34_PLAN.md)
- [ ] **M35 — NavMesh y navegación completa** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M35_PLAN.md)
- [ ] **M36 — Networking, HTTP y multijugador** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M36_PLAN.md)
- [ ] **M37 — Plataformas, APIs nativas y dispositivos especializados** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M37_PLAN.md)
- [ ] **M38 — API de editor, assets, extensiones y builds** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M38_PLAN.md)
- [ ] **M39 — Módulos restantes, paquetes y conformidad integral** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M39_PLAN.md)
- [ ] **M40 — Estabilización final, producto y aceptación integral** · [Plan](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/M40_PLAN.md)

[Roadmap completo y dependencias](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/ROADMAP_M19_M40.md). Orden recomendado tras cerrar M18.4: M19 → M20–M39 → M40; M19 todavía no ha empezado.

Plan inicial en [PR #41](https://github.com/Krozzeo/AxiomEngine/pull/41). Ampliación GPU/shaders en [PR #43](https://github.com/Krozzeo/AxiomEngine/pull/43), apilada sobre la base 0.0.49 de #42. Las milestones permanecen pendientes; publicar documentos no implementa las etapas.

### Ampliación de físicas GPU y shaders — planificada, 0%

Ya existía intención CPU/GPU en ADR-0009 y shaders/compute en M30; ahora se incorporan entregas y aceptación explícitas. No se añaden milestones principales: siguen 45 en total, 22 pendientes y M40 al final.

- [ ] **M25.0** — Infraestructura compute WGSL, buffers, sincronización/readback, caché/diagnóstico y medición del puente C#/JS.
- [ ] **M26.4** — Prototipo GPU 3D: integración y cuerpos simples.
- [ ] **M26.5** — Broadphase, colisiones y contactos GPU 3D.
- [ ] **M26.6** — Solver/constraints GPU 3D, API, estabilidad y rendimiento.
- [ ] **M28.4** — Integración y contactos GPU 2D.
- [ ] **M28.5** — Solver, joints, motores y efectores GPU 2D.
- [ ] **M28.6** — Integración Physics2D, consultas/eventos y estrés comparado.
- [ ] **M30.4** — Sistema compartido de shaders gráficos/compute y APIs asignadas.
- [ ] **M39.4** — Conformidad CPU/GPU y publicación de restricciones.

M19 fija contratos/umbrales/hardware; M27 aporta corpus CPU 2D; M40.2 incorpora hardening GPU. M25 depende de M24; M28/M30 reutilizan M25, sin dependencia inversa con M30. Mantener CPU/Wasm y selección CPU/GPU/Auto basada en capacidades, compatibilidad y beneficio medido. Exigir demos, fallos/fallback, scripting/render/replay y mediciones completas en GPU física; Null/WebGPU de software no acreditan rendimiento físico.

[Plan detallado](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/GPU_PHYSICS_AND_SHADERS_PLAN.md) · [PR #43](https://github.com/Krozzeo/AxiomEngine/pull/43). Hierarchy/Inspector/drag y primera apertura fueron corregidos en 0.0.51; Hub/GitHub se renovaron en 0.0.52. Permanecen los pendientes de CI, rendimiento físico denso, modelo conectado y validación nativa aplazada.


### Cierre M18.4
[PR #44](https://github.com/Krozzeo/AxiomEngine/pull/44) · [ADR-0034](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/adr/0034-m18-4-closure-and-deferred-native-account-check.md) · [Dos demos y guía de token](https://github.com/Krozzeo/AxiomEngine/blob/main/demos/M18_4_GUIDE.md). Seis comprobaciones remotas del servicio aprobadas en TestRepo con transporte delegado, solo fixtures de prueba. Autenticación nativa/manual Deferred; La aceptación nativa manual continúa aplazada; consultar el CI y el estado vigentes. SDK8 y roadmap de Unity/GPU/shaders sin cambios.


### Consolidación 2026-10-20
Por instrucción explícita del usuario, la última entrega ya está en main con historial completo y etiquetas de recuperación. El mantenimiento se revisa en #50. [Estado vigente](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/architecture/IMPLEMENTATION_STATUS.md) · [Mapa documental](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/index.md) · [Recuperación](https://github.com/Krozzeo/AxiomEngine/blob/main/docs/REPOSITORY_MAINTENANCE.md). M19 no comenzó; planificación y metas conservadas. El cuerpo anterior de esta issue se conserva en docs/archive/pre-restructure-0.0.52/issue-40.md.

### Consolidación completada antes de reestructurar
#50 integrado en main 871a72f6d2c720e99e0a8d1598c0f35af69c4d78. [CI 329: 46/46](https://github.com/Krozzeo/AxiomEngine/actions/runs/39505502248); mismo árbol de código verificado. 45 PR históricos cerrados/integrados y 45 ramas antiguas retiradas con commits conservados. Quedan main y dos ramas de respaldo, sin PR abiertos. [22 milestones nativas M19–M40](https://github.com/Krozzeo/AxiomEngine/milestones), sin inicio ni fechas inventadas. Main exige PR + CI completo; recovery/* protegido contra modificación/borrado; sin bypass.

[Punto de recuperación consolidado](https://github.com/Krozzeo/AxiomEngine/releases/tag/recovery%2Fpre-restructure-stable-2026-10-20). La [entrega original exacta](https://github.com/Krozzeo/AxiomEngine/releases/tag/recovery%2Fpre-restructure-0.0.52) también permanece conservada. #48 y #49 cerradas; #47 sigue abierta como fallo intermitente pendiente de reproducción específica. No cambia alcance ni progreso de Unity API, shaders o físicas GPU; M19 aún no comenzó.
