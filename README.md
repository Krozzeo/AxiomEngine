# Axiom Engine

Motor de juegos con editor en navegador, núcleo Rust/WebAssembly, renderizado WebGPU y gameplay C#. Incluye escenas 2D/3D, recursos, físicas CPU/Wasm, herramientas de edición y propuestas de IA aisladas con revisión humana.

**Base actual: 0.0.52 / SDK 8.** La última entrega se integró en `main` por decisión del usuario el 2026-10-20, conservando el historial completo. El desarrollo futuro parte de esta base.

- [Estado confirmado y límites](docs/architecture/IMPLEMENTATION_STATUS.md)
- [Mapa de documentación](docs/index.md) y [contexto para continuar](docs/AI_HANDOFF.md)
- [Milestones de GitHub](https://github.com/Krozzeo/AxiomEngine/milestones) y [su correspondencia con los planes](docs/NATIVE_GITHUB_MILESTONES.md)
- [Roadmap M19–M40](docs/architecture/ROADMAP_M19_M40.md): Scripting API compatible con Unity, shaders y físicas GPU
- [Recuperación y organización de GitHub](docs/REPOSITORY_MAINTENANCE.md)
- [Cambios por versión](CHANGELOG.md)

## Descargar y ejecutar

[Descargar la entrega de recuperación 0.0.52](https://github.com/Krozzeo/AxiomEngine/archive/refs/tags/recovery/pre-restructure-0.0.52.zip). Es código fuente; requiere las herramientas siguientes, no es un instalador.

Requisitos: Node.js 24+, Rust 1.90 con `wasm32-unknown-unknown` y, para C#, .NET 10 SDK con `wasm-tools`.

```powershell
npm ci
rustup target add wasm32-unknown-unknown
dotnet workload install wasm-tools
npm run demo
npm run dev
```

Abrir la dirección local que indica el daemon. `npm run dev` construye el núcleo Wasm y el editor antes de arrancar. Conservar los proyectos completos y sus recursos al cambiar de versión. Agregar un proyecto desde una carpeta en Hub crea una copia en Project Storage y conserva el original.

## Demos y GitHub

- `npm run demo`: References & Inspector Lab y demos relacionadas; [guía](demos/M18_3_10_GUIDE.md).
- `npm run demo:m18-4`: dos proyectos independientes para crear un repositorio o conectar uno existente; [guía paso a paso](demos/M18_4_GUIDE.md).
- [Inspector, escenas y primera apertura](demos/M18_3_12_GUIDE.md).
- [Catálogo histórico de demos](demos/README.md).

La cuenta GitHub se conecta por sesión del daemon; destinos y preferencias se guardan por proyecto. Los tokens se mantienen en memoria. `Krozzeo/TestRepo` se reserva para pruebas y no se vincula automáticamente a las demos.

## Verificación

```powershell
npm run check
npm run check:native
```

Los recorridos de navegador se ejecutan mediante `test:browser:*`, enumerados en `package.json` y en el workflow CI. La evidencia local de la entrega incluyó 438 pruebas Node, 44 Rust y 18 grupos de navegador con adaptadores controlados. El CI 320 tuvo 42/45 trabajos aprobados; sus tres fallos están registrados en [el informe de mantenimiento](docs/REPOSITORY_MAINTENANCE.md). Esa entrega no se declara íntegramente verde.

M18.4 está cerrada en el alcance acordado según ADR-0034. La validación nativa manual con cuenta real continúa aplazada por el usuario. La paridad total con Unity y las físicas GPU siguen pendientes; no hay un porcentaje global auditado antes de M19.

Apache License 2.0. Consultar [CONTRIBUTING.md](CONTRIBUTING.md) para cambios y revisión.
