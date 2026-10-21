# ADR-0037 — MIT e identidad Axiom Game Engine

## Contexto

Tras aprobar la familia Axiom, el propietario pidió explícitamente licencia MIT para Platform y Game Engine y renombrar el repositorio del motor.

## Decisión

Producto Axiom Game Engine; repositorio Krozzeo/AxiomGameEngine, antes Krozzeo/AxiomEngine. Sustituir LICENSE raíz y metadatos vigentes por MIT. Conservar licencias y atribuciones de dependencias/fixtures; no modificar tags, commits ni licencias de versiones históricas. No renombrar paquetes, namespaces C#, rutas locales o formatos por esta entrega.

Esta decisión **sustituye ADR-0013** para nuevas entregas desde esta rama. ADR-0013 se conserva íntegro como antecedente. Platform también usa MIT; monetización y servicios comerciales siguen pendientes.

## Alternativas

Mantener Apache-2.0 o dejar Platform sin licencia. El propietario eligió MIT en su instrucción posterior; esa es la decisión vigente.

## Consecuencias

Actualizar README, ayuda del editor, metadatos Cargo/npm, avisos propios y enlaces activos. Mantener la protección contra publicar juegos en los repositorios de infraestructura con los nombres antiguo/nuevo y Platform. El cambio de licencia no concede derechos sobre dependencias ajenas ni altera sus avisos.

## Status

Aceptado por instrucción del propietario; 2026-10-21. Efectivo en esta rama y en main cuando se integre su PR. La recuperación anterior permanece intacta bajo sus términos originales.
