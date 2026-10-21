# Informe P0 — Familia Axiom

Fecha: 2026-10-21. Rama: docs/platform-p0-and-game-engine-identity. Base de inspección y recuperación estable: 871a72f6d2c720e99e0a8d1598c0f35af69c4d78.

## Entrega

Repositorio del motor renombrado AxiomGameEngine; AxiomPlatform público creado. Platform contiene maestro, arquitectura, propiedad, contrato preliminar, datos/sesiones, AI, versiones, migración, validación, ADR y roadmap P0–P5. [Mapa de Platform](https://github.com/Krozzeo/AxiomPlatform/blob/main/docs/index.md).

Motor actualizado en rama propia: entradas documentales, handoff/estado, roadmap sin renumerar M19–M40, ADR-0036/0037 y enlaces activos. MIT sustituye Apache para esta nueva entrega en LICENSE/Cargo/npm/ayuda y avisos propios; licencias de terceros y ADR-0013 histórico intactos. Los identificadores técnicos y formatos no cambian.

Único ajuste de lógica: conservar bloqueo de publicación de juegos al nombre histórico del motor y añadir AxiomGameEngine/AxiomPlatform, con comprobación insensible a mayúsculas. La prueba existente cubre los tres destinos. La prueba de arranque conserva su aserción de título con el nuevo nombre.

## Comprobaciones

- Platform: scripts/check_docs.py aprobado; 17 documentos Markdown, enlaces locales y MIT. Workflow documental inicial de GitHub aprobado: https://github.com/Krozzeo/AxiomPlatform/actions/runs/39594711462 (commit 44b03c8).
- Motor: pruebas GitHub 14/14 y servidor 7/7 aprobadas. La primera ejecución completa detectó que el test de servidor aún esperaba el título anterior; actualizado para exigir Axiom Game Engine, sin retirar la aserción.
- Enlaces relativos de los Markdown modificados/nuevos y git diff --check aprobados.
- npm run check final aprobado: build, catálogos/bindings, esquemas, arquitectura, paridad de daemon y 441/441 pruebas Node. El CI remoto del PR se evalúa de forma independiente; no se presume aprobado.

## Límites

Sin extracción funcional, nuevo ejecutable de Platform, SDK publicado o migración de datos. M19–M40 conservadas: no aumenta cobertura Unity ni implementa GPU. MIT se integra en main del motor al integrar el PR; recovery conserva historia y términos previos.

Pendientes heredados: #47 Inspector intermitente, validación nativa GitHub aplazada, modelo conectado y rendimiento físico denso. Se detectó también fallo M17 del run posterior en main y se abrió #51; no queda resuelto por P0. El CI 329 previo del mismo árbol aprobó, pero el run posterior 39507425121 falló M17 y el gate (44/46). No atribuir causa sin reproducción.

## Siguiente paso

Revisar/integrar el PR con sus checks y comenzar P1 por contrato/negociación y adaptador de apertura del motor. No mover carpetas completas ni bloquear M19 hasta terminar P5.
