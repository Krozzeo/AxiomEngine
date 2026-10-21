# ADR-0036 — Familia Axiom y separación de Platform

## Contexto

El propietario aprobó separar servicios transversales para una familia de aplicaciones locales en navegador operables manualmente y por agentes, conservando el motor como primer producto.

## Decisión

AxiomPlatform aloja Hub, infraestructura común y SDK; AxiomGameEngine conserva dominio y adaptador. Dos repositorios, versiones propias, dependencia hacia contratos sin tipos del motor. Extracción P0–P5 con gates y recuperación; P0 es documentación. Conservar arranque directo técnico y juegos exportados independientes. Configuración por niveles y credenciales de sesión por defecto. La API Unity, shaders y físicas GPU permanecen en M19–M40 del motor.

## Alternativas

Monorepo universal, copias del motor para cada aplicación y extracción total inmediata. Se elige extracción incremental para conservar un producto utilizable y comprobar abstracciones con un segundo consumidor acotado.

## Consecuencias

Mantener contratos/versiones y pruebas de integración. No trasladar carpetas mixtas sin adaptadores ni cambiar formatos por branding. Platform define infraestructura; el producto mantiene semántica e invariantes.

## Status

Aceptado por el propietario; 2026-10-21. Implementación pendiente. [Transición y fuentes canónicas](../architecture/PLATFORM_TRANSITION.md). Licencia e identidad: ADR-0037.
