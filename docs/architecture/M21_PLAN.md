# M21 — Matemáticas, geometría y utilidades

Plan vigente desde 2026-10-19. **No iniciada; 0% de aceptación nueva.**

Dependencias mínimas: M19, M20.

[Roadmap general](ROADMAP_M19_M40.md) · [Manifest](roadmap-v2.json)

## Alcance requerido

- Completar vectores, quaternions, matrices, colores, rectángulos, bounds, planos y rayos; tipos enteros y conversiones presentes en el inventario.
- Mathf, Random reproducible, interpolaciones, curvas, gradients y utilidades geométricas asignadas; igualdad, tolerancias y float/double conforme al contrato.
- Validar extremos: cero, singularidades, grandes coordenadas, NaN/infinito según semántica documentada.

## Subtandas previstas

- 21.1 Tipos y operadores.
- 21.2 Matrices, espacios y geometría.
- 21.3 Curvas, random y precisión.

## Criterios de cierre

- [ ] Vectores de referencia y propiedades algebraicas cubren operaciones normales y degeneradas.
- [ ] Semillas, curvas y conversiones se reproducen entre configuraciones .NET/Wasm soportadas.
- [ ] Las diferencias numéricas toleradas están cuantificadas por miembro; no se declara equivalencia por igualdad de nombres.

## Demo editable requerida

Math & Geometry Lab con inspección visual de matrices, rayos, curvas y secuencias aleatorias.

## Reglas comunes de ejecución y cierre

- Estado inicial: **planificada, no iniciada, 0% de aceptación nueva**. La base SDK 7 conserva su cobertura parcial; este plan no implementa las APIs.
- Antes de implementar: anexar la lista exacta de firmas/overloads del inventario M19, su propietario, dependencias, contratos y pruebas. Las listas de familias de este plan definen alcance; no sustituyen el inventario de miembros.
- Ejecutar subtandas verticales coherentes (orientativamente 20–40 firmas cuando sea razonable). Cada subtanda incluye implementación del motor/puente C#, pruebas, demo y documentación. Una fase puede necesitar varias versiones.
- Verificar comportamiento real, errores, referencias/recursos, Play/Stop, persistencia, compatibilidad y regresiones. C# desarrollo/AOT/Windows y kernel nativo/Wasm según capacidades; render/audio/dispositivos requieren evidencia de su resultado efectivo.
- Un wrapper vacío, una propiedad con valor ficticio o una firma que solo compila no cuentan como implementados. Una restricción real sigue visible como parcial/bloqueada.
- Mantener las invariantes de propuestas aisladas, Apply revisado, proyectos del usuario, credenciales fuera del proyecto y publicación explícita. No fusionar PRs automáticamente.
- Cerrar únicamente con criterios aprobados, demo editable y evidencia retenida. Actualizar README, handoff, estado, changelog, matriz y GitHub. [Reglas de cierre](MILESTONE_REPORTING.md).
- No hay fechas ni esfuerzo comprometidos: M19 debe medir alcance y dependencias. Cada replanificación conserva el historial y exige una decisión de alcance explícita.
