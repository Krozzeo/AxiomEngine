# Actualización de cierre

M18.4 cerrada con validación nativa manual aplazada por decisión del usuario; [ADR-0034](../adr/0034-m18-4-closure-and-deferred-native-account-check.md). M19 aún no ha empezado. Los contratos y el resto del alcance no cambian.

# Roadmap ampliado — M19 a M40

Decisión de alcance: **2026-10-19**, solicitada por el usuario. Plan originalmente aprobado sobre Axiom **0.0.49 / SDK 8**. Base funcional actual: **0.0.52 / SDK 8** integrada en `main`; [estado y verificación](IMPLEMENTATION_STATUS.md). Este documento no acredita implementación ni aceptación de las etapas futuras.

## Número de milestones y migración

- Se añaden **21 milestones de compatibilidad, M19–M39**.
- La última milestone anterior, **M19 MVP Hardening**, se traslada íntegramente a **M40**. El nuevo M19 es auditoría, no estabilización.
- **M18.4 se conserva** con su alcance de integración GitHub. M18.4 queda cerrada según ADR-0034; quedan **22 milestones principales pendientes**: M19–M39 y M40.
- El proyecto pasa a **45 milestones principales**: M0–M40 y M18.1–M18.4; 23 principales están cerradas. Las correcciones M18.3.x no se suman como milestones principales nuevas.
- Orden recomendado: M18.4 → M19 → M20–M39 → M40. El inventario/harness de M19 puede prepararse mientras una verificación externa de M18.4 esté pendiente; eso no cierra M18.4. Las dependencias de la tabla permiten trabajo independiente, pero cada cierre respeta sus gates.

## Objetivo verificable

Implementación propia funcional de todo o casi todo el alcance público fijado de la Scripting API. Base estable: **Unity 6.3 LTS (6000.3)**. El enlace sin versión cambia (6.6 en la consulta de 2026-10-18); su delta se registra aparte. Los paquetes adicionales llevan versiones e inventarios propios.

Meta operativa para M39: **al menos 95% de las firmas públicas objetivo del snapshot core y 100% de las P0**, con comportamiento verificado. No es un porcentaje actual. M19 fijará snapshot, denominador completo, firmas únicas, tratamiento de herencia/obsoletos y clasificación de prioridades. El inventario incluye runtime y editor; no se restringe tácitamente a nueve familias de gameplay.

Se publican cobertura total, cobertura de perfiles de plataforma y cobertura por paquete. Las APIs pendientes, parcialmente equivalentes, bloqueadas por backend/SDK/hardware o excluidas permanecen visibles. No se retiran del denominador completo para alcanzar 95%. Si el objetivo resulta bloqueado, se registra el bloqueo o se documenta una decisión de alcance; no se declara completado.

## Estado y porcentajes

La última base con CI completo verde fue 0.0.49 / SDK 8: CI 315, 42 trabajos, 415 tests Node, 44 Rust y 33 grupos de navegador. La entrega vigente 0.0.52 tiene evidencia local propia y tres fallos de navegador en CI 320; consultar el estado enlazado. Las físicas actuales siguen siendo CPU/Wasm; el backend GPU aquí planificado no está implementado. Los porcentajes por área de la conversación anterior son estimaciones de planificación; no forman una línea base auditada.

El **94% (122/130)** se conserva únicamente como **MVP histórico**. El avance global ampliado queda **sin cuantificar hasta M19**, que deberá definir esfuerzo relativo y criterios medibles. Publicar este plan no gana crédito funcional. Una ponderación futura tendrá que distinguir esfuerzo de roadmap y cobertura API por firmas.

## Plan principal

| Milestone | Alcance y entrega principal | Dependencias mínimas |
| --- | --- | --- |
| [M18.4](M18_4_PLAN.md) | Integración con GitHub de proyectos guardados, publicación explícita y recuperación segura | M18.3.10 |
| [M19](M19_PLAN.md) | Auditoría completa y contrato de compatibilidad | M18.3.10 |
| [M20](M20_PLAN.md) | Objetos, componentes y jerarquías compatibles | M19 |
| [M21](M21_PLAN.md) | Matemáticas, geometría y utilidades | M19, M20 |
| [M22](M22_PLAN.md) | Ciclo de vida, tiempo, eventos y asincronía | M20, M21 |
| [M23](M23_PLAN.md) | Serialización, ScriptableObject y prefabs | M20, M22 |
| [M24](M24_PLAN.md) | Escenas, recursos, carga asíncrona y memoria | M22, M23 |
| [M25](M25_PLAN.md) | Física 3D: geometrías, consultas e infraestructura compute | M20, M21, M22, M24 |
| [M26](M26_PLAN.md) | Física 3D CPU/GPU: solver avanzado y controladores | M25 |
| [M27](M27_PLAN.md) | Física 2D: geometrías y consultas | M20, M21, M22 |
| [M28](M28_PLAN.md) | Física 2D CPU/GPU: joints y simulación avanzada | M27, M25 |
| [M29](M29_PLAN.md) | Input y dispositivos | M20, M22 |
| [M30](M30_PLAN.md) | Gráficos, shaders y recursos GPU | M21, M23, M24, M25 |
| [M31](M31_PLAN.md) | Animación, rigging y Playables | M22, M23, M30 |
| [M32](M32_PLAN.md) | Audio, mezcla y procesamiento | M22, M24 |
| [M33](M33_PLAN.md) | UI, texto, layout y eventos | M22, M23, M29, M30 |
| [M34](M34_PLAN.md) | Mundos 2D/3D, partículas, terreno y vídeo | M24, M25, M27, M30, M31, M32 |
| [M35](M35_PLAN.md) | NavMesh y navegación completa | M21, M24, M25 |
| [M36](M36_PLAN.md) | Networking, HTTP y multijugador | M22, M23, M24 |
| [M37](M37_PLAN.md) | Plataformas, APIs nativas y dispositivos especializados | M19, M22, M24, M29, M30, M32 |
| [M38](M38_PLAN.md) | API de editor, assets, extensiones y builds | M20, M23, M24, M30, M33, M37 |
| [M39](M39_PLAN.md) | Módulos restantes, paquetes y conformidad integral | M19, M20, M21, M22, M23, M24, M25, M26, M27, M28, M29, M30, M31, M32, M33, M34, M35, M36, M37, M38 |
| [M40](M40_PLAN.md) | Estabilización final, producto y aceptación integral | M18.4 y M19–M39 |

## Ampliación de físicas GPU y shaders — 2026-10-19

La aceleración era una intención de ADR-0009 y M30 ya contemplaba shaders/compute. Ahora es alcance explícito y requerido: **M25.0** infraestructura compute WGSL y puente; **M26.4–26.6** físicas GPU 3D; **M28.4–28.6** físicas GPU 2D; **M30.4** sistema compartido de shaders; **M39.4** conformidad cruzada; **M40.2** hardening. M19 fija el contrato y los umbrales. Son nueve subtandas nuevas, no nueve milestones principales: permanecen 45 principales y 22 pendientes tras el cierre acordado de M18.4, con M40 al final.

CPU/Wasm permanece disponible; Auto necesita capacidades, funciones compatibles y beneficio medido. Se desarrollan compute shaders WGSL de producción, sincronización y consultas/eventos coherentes con C#, y pruebas en GPU física. Renderizar con WebGPU no acredita simular físicas en GPU. No cambia el ejecutable, la cobertura ni el rendimiento actual por publicar el plan.

[Plan detallado, entregas, dependencias y aceptación](GPU_PHYSICS_AND_SHADERS_PLAN.md). M25 depende de M24; M28/M30 reutilizan M25. La infraestructura M25.0 se entrega antes de los solvers sin esperar al cierre completo de M30: no hay ciclo. Los shaders gráficos de M30 conservan su alcance y se integran con compute.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 8 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.

## Dependencias y alcance que no se pueden simular

El navegador no ofrece todas las capacidades de un motor nativo. M37 desarrolla backends/adaptadores efectivos; las capacidades que necesitan SDKs, dispositivos o servicios externos requieren acceso y evidencia antes de considerarse completas. UnityEditor se aborda en M38; tener Inspectors de Axiom no equivale a implementar ese SDK.

La selección de backends de física, shaders, texto, audio y red se documenta mediante ADRs y pruebas antes de comprometer equivalencia. AI Master continúa planificado fuera de este alcance; se conserva el flujo IA y la aceptación integral originales.

## Fuente de verdad y seguimiento

- [Manifest del roadmap](roadmap-v2.json): IDs, dependencias y estado inicial.
- Cada M19–M40 tiene un plan con alcance, subtandas, demo y aceptación.
- [Estado del proyecto](../../axiom.project-state.json) conserva evidencia ejecutable separada de planificación.
- [Estado de la API SDK 8](../scripting-api/STATUS_0_0_49.md) sigue describiendo lo implementado.
- [Issue #40 de seguimiento](https://github.com/Krozzeo/AxiomEngine/issues/40): checklist de las 23 milestones, enlazado desde el PR de planificación. Las casillas representan aceptación futura, no simple creación de documentos.
- Las referencias antiguas a M19 Hardening en informes históricos quedan supersedidas por esta migración; los informes de releases no se reescriben.

## Referencias

- [Unity 6.3 Scripting API](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/)
- [UnityEditor](https://docs.unity3d.com/6000.3/Documentation/ScriptReference/UnityEditor.html)
- [Inventario retenido de tipos/namespaces](../scripting-api/unity-6.3-inventory.json): no es aún la auditoría de miembros.
