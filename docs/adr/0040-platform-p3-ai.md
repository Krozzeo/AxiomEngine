# ADR-0040 — Consumir AI/revisión genéricas con adaptador de juegos

2026-10-21. Implementado para revisión en ramas P3, sobre P2 aún no integrada.

Compartir AiRuntime, OpenAiProvider/SharedAiProvider, contratos/consumo, ToolRegistry, TaskJournal y review/diff desde dependencia HTTPS fijada. Conservar selección/ejecución de operaciones de juegos, PMD y transacción de propuestas aquí. El host fija sesión/proyecto de IPC y retiene la credencial; el producto mantiene sus presupuestos y requiere revisión humana antes de Apply.

No extraer la clase OpenAiAssistant completa: sus instrucciones y aceptación son de dominio. No copiar fuentes ni usar rutas de checkout como dependencia final. El arranque nativo usa las mismas bibliotecas. El esquema de journal y los receipts existentes se conservan para reanudar/reconciliar sin repetir efectos. Los modelos guardados no se reconectan ni facturan automáticamente.

[Arquitectura/evidencia](../architecture/PLATFORM_P3.md). Los modelos y selector no se consideran aceptados por mocks; #55 y el gate P2 permanecen visibles. No cambia scripting SDK 8 ni el roadmap Unity/shaders/GPU.
